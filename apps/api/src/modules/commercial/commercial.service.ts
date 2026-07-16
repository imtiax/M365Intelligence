import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DEMO_TENANT, LocalStateService } from "../runtime/local-state.service";

const connectorDefinitions = [
  ["entra", "Microsoft Entra ID", "Identity", 148],
  ["exchange", "Exchange Online", "Messaging", 112],
  ["teams", "Microsoft Teams", "Collaboration", 86],
  ["sharepoint", "SharePoint Online", "Content", 104],
  ["intune", "Microsoft Intune", "Endpoint", 93],
  ["defender", "Microsoft Defender XDR", "Security", 76],
  ["purview", "Microsoft Purview", "Compliance", 72],
  ["hybrid-ad", "Hybrid Active Directory", "Directory", 118],
] as const;

type Connector = {
  code: string;
  name: string;
  domain: string;
  reports: number;
  state: "healthy" | "degraded" | "action_required";
  permissionCoverage: number;
  lastSyncAt: string;
  nextSyncAt: string;
  objectsProcessed: number;
  missingPermissions: string[];
};

@Injectable()
export class CommercialService {
  private readonly connectors = new Map<string, Connector[]>();

  constructor(private readonly runtime: LocalStateService) {}

  organization(tenantId: string) {
    if (tenantId !== DEMO_TENANT) throw new NotFoundException("Organization was not found in the active tenant context.");
    return {
      id: "8edba2cc-2a5c-4d2e-9f46-9cc32e0f4177",
      tenantId,
      legalName: "Global Enterprise Holdings Ltd",
      displayName: "Global Enterprise Holdings",
      industry: ["Logistics", "Manufacturing", "Financial Services"],
      companySize: "5,000 users",
      primaryRegion: "United Arab Emirates",
      mode: "customer-preview",
      dataBoundary: "customer-controlled",
      onboarding: { completed: 8, total: 9, next: "Validate production Microsoft Graph consent" },
    };
  }

  subscription(tenantId: string) {
    this.organization(tenantId);
    return {
      plan: "Enterprise",
      state: "evaluation",
      billingCycle: "Annual",
      licensedUsers: 5000,
      trialEndsAt: "2026-08-15T23:59:59.000Z",
      entitlements: ["reporting", "security", "compliance", "automation", "private-ai", "hybrid-operations"],
      note: "Commercial billing provider is not connected in the local evaluation environment.",
    };
  }

  license(tenantId: string) {
    this.organization(tenantId);
    return {
      licenseNumber: "EVAL-GEH-2026",
      state: "evaluation",
      edition: "Enterprise Evaluation",
      boundTenantId: tenantId,
      maxInstances: 1,
      activeInstances: 1,
      maxUsers: 5000,
      activationMode: "local-evaluation",
      expiresAt: "2026-08-15T23:59:59.000Z",
      cryptographicEnforcement: "not-enabled-in-evaluation",
    };
  }

  listConnectors(tenantId: string) {
    this.organization(tenantId);
    if (!this.connectors.has(tenantId)) {
      const now = Date.now();
      this.connectors.set(tenantId, connectorDefinitions.map(([code, name, domain, reports], index) => ({
        code, name, domain, reports,
        state: index === 6 ? "degraded" : "healthy",
        permissionCoverage: index === 6 ? 88 : 100,
        lastSyncAt: new Date(now - (index + 1) * 4 * 60_000).toISOString(),
        nextSyncAt: new Date(now + (index + 1) * 3 * 60_000).toISOString(),
        objectsProcessed: 840 + index * 731,
        missingPermissions: index === 6 ? ["RecordsManagement.Read.All"] : [],
      })));
    }
    return { generatedAt: new Date().toISOString(), items: this.connectors.get(tenantId)! };
  }

  validateConnector(tenantId: string, code: string, actorId: string, correlationId: string) {
    const connector = this.listConnectors(tenantId).items.find((item) => item.code === code);
    if (!connector) throw new NotFoundException("Connector was not found.");
    connector.lastSyncAt = new Date().toISOString();
    connector.nextSyncAt = new Date(Date.now() + 15 * 60_000).toISOString();
    this.runtime.appendAudit(tenantId, actorId, "connector.validate", "connector", code, "success", correlationId);
    this.runtime.publish(tenantId, "connector.validated", { connector: code, state: connector.state });
    return { validationId: randomUUID(), ...connector, validation: connector.missingPermissions.length ? "action_required" : "passed" };
  }

  customers(tenantId: string) {
    this.organization(tenantId);
    return {
      summary: { customers: 1, activeTrials: 1, paidSubscriptions: 0, expiringLicenses: 1 },
      items: [{ organization: "Global Enterprise Holdings", tenantId, mode: "Customer preview", subscription: "Enterprise evaluation", license: "Evaluation", connectors: "7 healthy · 1 degraded", dataBoundary: "Local" }],
      disclosure: "Super Admin contains commercial metadata only; customer operational records are not available in this workspace.",
    };
  }
}
