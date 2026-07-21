import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { DatabaseService } from "../../shared/database/database.service";
import type { PlatformRole } from "../../shared/security/tenant-context";
import { CreateReportDefinitionDto, CreateRunbookExecutionDto, CreateWorkflowCaseDto } from "./control-plane.dto";

type ConnectorRow = { connectorCode: string; displayName: string; state: string; requestedPermissions: string[]; grantedPermissions: string[]; coverage: Record<string, unknown>; lastSuccessAt: string | null; nextSyncAt: string | null; recordsProcessed: string };

@Injectable()
export class ControlPlaneService {
  constructor(private readonly database: DatabaseService) {}

  connectionReadiness(tenantId: string) {
    const configured = (value: string | undefined, pattern?: RegExp) => !!value && value.trim().length > 0 && (!pattern || pattern.test(value.trim()));
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const graphEnabled = process.env.M365_GRAPH_ENABLED === "true";
    const graphRequirements = [
      ["Tenant ID", configured(process.env.M365_TENANT_ID, uuid)],
      ["Client ID", configured(process.env.M365_CLIENT_ID, uuid)],
      ["Certificate reference", configured(process.env.M365_CERTIFICATE_THUMBPRINT) || configured(process.env.M365_CERTIFICATE_PATH)],
      ["Collector explicitly enabled", graphEnabled],
    ] as const;
    const oidcEnabled = process.env.ENTRA_OIDC_ENABLED === "true";
    const oidcRequirements = [
      ["Tenant ID", configured(process.env.ENTRA_OIDC_TENANT_ID, uuid)],
      ["Application client ID", configured(process.env.ENTRA_OIDC_CLIENT_ID, uuid)],
      ["HTTPS redirect URI", configured(process.env.ENTRA_OIDC_REDIRECT_URI) && process.env.ENTRA_OIDC_REDIRECT_URI!.startsWith("https://")],
      ["Allowed tenant binding", configured(process.env.ENTRA_OIDC_ALLOWED_TENANT_ID, uuid)],
      ["Federation explicitly enabled", oidcEnabled],
    ] as const;
    const packs = [
      { code: "entra-read", name: "Entra identity and sign-in", permissions: ["User.Read.All", "Group.Read.All", "AuditLog.Read.All", "RoleManagement.Read.Directory"], status: "blocked_until_consent" },
      { code: "licensing", name: "Licensing and usage", permissions: ["Organization.Read.All", "Reports.Read.All"], status: "blocked_until_consent" },
      { code: "defender-xdr", name: "Defender XDR and incidents", permissions: ["SecurityIncident.Read.All", "SecurityAlert.Read.All"], status: "blocked_until_consent" },
      { code: "purview-audit", name: "Purview audit", permissions: ["AuditLogsQuery-Exchange.Read.All", "AuditLogsQuery-SharePoint.Read.All"], status: "blocked_until_consent" },
      { code: "intune", name: "Intune devices and compliance", permissions: ["DeviceManagementManagedDevices.Read.All", "DeviceManagementConfiguration.Read.All"], status: "blocked_until_consent" },
    ];
    return {
      tenantId,
      mode: "configuration_gated",
      graphCollector: { enabled: graphEnabled, ready: graphRequirements.every(([, ready]) => ready), requirements: graphRequirements.map(([name, ready]) => ({ name, ready })) },
      workforceSso: { enabled: oidcEnabled, ready: oidcRequirements.every(([, ready]) => ready), requirements: oidcRequirements.map(([name, ready]) => ({ name, ready })) },
      connectorPacks: packs,
      releaseGates: ["least-privilege permission review", "admin consent evidence", "certificate rotation runbook", "tenant isolation test", "pagination, throttling, and retry test", "backup and audit-ledger restore test"],
    };
  }

  async overview(tenantId: string) {
    const [connectors, reports, workflows] = await Promise.all([
      this.database.tenantQuery<{ total: string; healthy: string }>(tenantId, "SELECT count(*)::text AS total, count(*) FILTER (WHERE state = 'healthy')::text AS healthy FROM control.connector_installations"),
      this.database.tenantQuery<{ total: string }>(tenantId, "SELECT count(*)::text AS total FROM control.report_definitions"),
      this.database.tenantQuery<{ total: string }>(tenantId, "SELECT count(*)::text AS total FROM control.workflow_cases WHERE state IN ('draft','pending_approval','approved','running')"),
    ]);
    return { connectors: { total: Number(connectors[0]?.total ?? 0), healthy: Number(connectors[0]?.healthy ?? 0) }, reports: Number(reports[0]?.total ?? 0), openWorkflows: Number(workflows[0]?.total ?? 0) };
  }

  async listConnectors(tenantId: string) {
    return this.database.tenantQuery<ConnectorRow>(tenantId, `SELECT connector_code AS "connectorCode", display_name AS "displayName", state, requested_permissions AS "requestedPermissions", granted_permissions AS "grantedPermissions", coverage, last_success_at AS "lastSuccessAt", next_sync_at AS "nextSyncAt", records_processed::text AS "recordsProcessed" FROM control.connector_installations ORDER BY display_name`);
  }

  async listReports(tenantId: string) {
    return this.database.tenantQuery(tenantId, `SELECT id, name, description, dataset_code AS "datasetCode", definition, owner_id AS "ownerId", visibility, version, created_at AS "createdAt", updated_at AS "updatedAt" FROM control.report_definitions ORDER BY updated_at DESC LIMIT 250`);
  }

  async createReport(tenantId: string, actorId: string, roles: PlatformRole[], dto: CreateReportDefinitionDto) {
    this.requireAnyRole(roles, ["platform-admin", "m365-admin", "security-admin", "report-admin"]);
    const definitionHash = createHash("sha256").update(JSON.stringify(dto.definition)).digest("hex");
    const rows = await this.database.tenantQuery(tenantId, `INSERT INTO control.report_definitions (tenant_id, name, description, dataset_code, definition, owner_id, visibility) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) RETURNING id, name, dataset_code AS "datasetCode", visibility, version, created_at AS "createdAt", updated_at AS "updatedAt"`, [tenantId, dto.name, dto.description ?? null, dto.datasetCode, JSON.stringify({ ...dto.definition, definitionHash }), actorId, dto.visibility ?? "private"]);
    return rows[0];
  }

  async listRunbooks(tenantId: string) {
    return this.database.tenantQuery(tenantId, `SELECT code, name, service, risk, required_modules AS "requiredModules", required_permissions AS "requiredPermissions", content_hash AS "contentHash", version FROM control.runbook_catalog WHERE active = true ORDER BY service, name`);
  }

  async prepareRunbookExecution(tenantId: string, actorId: string, roles: PlatformRole[], dto: CreateRunbookExecutionDto) {
    const runbooks = await this.database.tenantQuery<{ code: string; name: string; risk: "read_only" | "approval_required" }>(tenantId, "SELECT code, name, risk FROM control.runbook_catalog WHERE code = $1 AND active = true", [dto.runbookCode]);
    const runbook = runbooks[0];
    if (!runbook) throw new NotFoundException("Runbook not found.");
    this.requireAnyRole(roles, ["platform-admin", "m365-admin", "security-admin"]);
    const rows = await this.database.tenantQuery(tenantId, `INSERT INTO control.workflow_cases (tenant_id, type, title, target_scope, justification, requested_by, state, dry_run) VALUES ($1,'powershell_runbook',$2,$3::jsonb,$4,$5,$6,$7::jsonb) RETURNING id, state, created_at AS "createdAt"`, [tenantId, `Runbook · ${runbook.name}`, JSON.stringify(dto.targetScope), `Prepared runbook ${runbook.code}; execution is ${runbook.risk === "approval_required" ? "approval-gated" : "read-only"}.`, actorId, runbook.risk === "approval_required" ? "pending_approval" : "draft", JSON.stringify({ runbookCode: runbook.code, evidenceIds: dto.evidenceIds ?? [], mode: "dry_run_required" })]);
    return rows[0];
  }

  async createWorkflow(tenantId: string, actorId: string, roles: PlatformRole[], dto: CreateWorkflowCaseDto) {
    this.requireAnyRole(roles, ["platform-admin", "m365-admin", "security-admin"]);
    const rows = await this.database.tenantQuery(tenantId, `INSERT INTO control.workflow_cases (tenant_id, type, title, target_scope, justification, requested_by) VALUES ($1,$2,$3,$4::jsonb,$5,$6) RETURNING id, state, created_at AS "createdAt"`, [tenantId, dto.type, dto.title, JSON.stringify(dto.targetScope), dto.justification, actorId]);
    return rows[0];
  }

  private requireAnyRole(actual: PlatformRole[], allowed: PlatformRole[]) {
    if (!actual.some((role) => allowed.includes(role))) throw new ForbiddenException("Your platform role cannot create this governed resource.");
  }
}
