import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { DatabaseService } from "../../shared/database/database.service";
import type { PlatformRole } from "../../shared/security/tenant-context";
import { CreateReportDefinitionDto, CreateRunbookExecutionDto, CreateWorkflowCaseDto } from "./control-plane.dto";

type ConnectorRow = { connectorCode: string; displayName: string; state: string; requestedPermissions: string[]; grantedPermissions: string[]; coverage: Record<string, unknown>; lastSuccessAt: string | null; nextSyncAt: string | null; recordsProcessed: string };

@Injectable()
export class ControlPlaneService {
  constructor(private readonly database: DatabaseService) {}

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
