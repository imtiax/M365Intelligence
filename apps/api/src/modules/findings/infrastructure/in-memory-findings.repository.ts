import { Injectable } from "@nestjs/common";
import {
  FindingFilter,
  FindingsRepository,
} from "../application/findings.repository";
import type { Finding } from "../domain/finding";

const TENANT = "00000000-0000-4000-8000-000000000001";

const seed: Finding[] = [
  {
    id: "FND-1042",
    tenantId: TENANT,
    title: "Privileged identities lack phishing-resistant MFA",
    category: "identity",
    severity: "critical",
    riskScore: 96,
    confidence: 0.98,
    impact: "High likelihood of account takeover and privileged access abuse.",
    affectedCount: 45,
    recommendation:
      "Run a registration campaign, then enforce an authentication-strength Conditional Access policy.",
    status: "active",
    automation: { available: true, approvalRequired: true },
    evidenceAsOf: "2026-07-15T08:14:00Z",
  },
  {
    id: "FND-1038",
    tenantId: TENANT,
    title: "Unmanaged external sharing remains enabled",
    category: "data",
    severity: "high",
    riskScore: 82,
    confidence: 0.94,
    impact:
      "Sensitive content may be accessed from identities and devices outside organizational control.",
    affectedCount: 12,
    recommendation:
      "Review business exceptions and restrict sharing to approved guests with expiration.",
    status: "active",
    automation: { available: true, approvalRequired: true },
    evidenceAsOf: "2026-07-15T08:05:00Z",
  },
  {
    id: "FND-1029",
    tenantId: TENANT,
    title: "Dormant E5 assignments show no qualifying activity",
    category: "license",
    severity: "medium",
    riskScore: 58,
    confidence: 0.91,
    impact:
      "Approximately $4,957 in monthly subscription value may be recoverable.",
    affectedCount: 87,
    recommendation:
      "Validate leave and service-account exceptions, then reclaim licenses through an approved workflow.",
    status: "active",
    automation: { available: true, approvalRequired: true },
    evidenceAsOf: "2026-07-15T07:58:00Z",
  },
  {
    id: "FND-1034",
    tenantId: TENANT,
    title: "Users operate exclusively from noncompliant devices",
    category: "device",
    severity: "high",
    riskScore: 79,
    confidence: 0.89,
    impact:
      "Corporate data is accessible from endpoints that do not meet security baseline.",
    affectedCount: 23,
    recommendation:
      "Remediate device controls and stage Conditional Access enforcement after impact review.",
    status: "remediating",
    automation: { available: false, approvalRequired: true },
    evidenceAsOf: "2026-07-15T07:51:00Z",
  },
  {
    id: "FND-1021",
    tenantId: TENANT,
    title: "Legacy authentication observed in production",
    category: "identity",
    severity: "high",
    riskScore: 76,
    confidence: 0.93,
    impact: "Password spray and MFA bypass risk persists through legacy protocols.",
    affectedCount: 31,
    recommendation:
      "Confirm application owners, migrate protocol usage, then block legacy authentication.",
    status: "active",
    automation: { available: true, approvalRequired: true },
    evidenceAsOf: "2026-07-15T07:44:00Z",
  },
  {
    id: "FND-1014",
    tenantId: TENANT,
    title: "Retention policy drift across regulated mailboxes",
    category: "compliance",
    severity: "medium",
    riskScore: 63,
    confidence: 0.96,
    impact:
      "Required correspondence may not be retained consistently for regulatory discovery.",
    affectedCount: 64,
    recommendation:
      "Restore the approved seven-year retention assignment and validate preservation.",
    status: "remediating",
    automation: { available: true, approvalRequired: true },
    evidenceAsOf: "2026-07-15T07:31:00Z",
  },
];

@Injectable()
export class InMemoryFindingsRepository extends FindingsRepository {
  async list(tenantId: string, filter: FindingFilter): Promise<Finding[]> {
    // Seed data is projected into the requested development tenant. Production repositories use RLS.
    return seed
      .filter((item) => !filter.severity || item.severity === filter.severity)
      .slice(0, filter.limit)
      .map((item) => ({ ...item, tenantId }));
  }

  async get(tenantId: string, id: string): Promise<Finding | undefined> {
    const item = seed.find((candidate) => candidate.id === id);
    return item ? { ...item, tenantId } : undefined;
  }
}
