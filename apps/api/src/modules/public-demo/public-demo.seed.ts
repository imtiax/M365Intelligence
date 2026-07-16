import { createEnterpriseDemo } from '../runtime/enterprise-seed';
import type { EnterpriseDemoState } from '../runtime/enterprise.types';

export const PUBLIC_DEMO_MODULE_IDS = [
  'command-center',
  'explorer-360',
  'identity',
  'security',
  'reporting',
  'licenses',
  'compliance',
  'usage-analytics',
  'auditing',
  'management',
  'governance',
  'hybrid-ad',
] as const;

export type PublicDemoModuleId = (typeof PUBLIC_DEMO_MODULE_IDS)[number];

export const PUBLIC_DEMO_SCENARIO_IDS = [
  'baseline',
  'identity-risk',
  'license-optimization',
  'compliance-audit',
] as const;

export type PublicDemoScenarioId =
  (typeof PUBLIC_DEMO_SCENARIO_IDS)[number];

export const PUBLIC_DEMO_REPORT_FIELDS = [
  'objectId',
  'displayName',
  'owner',
  'status',
  'risk',
  'region',
  'activity',
] as const;

export type PublicDemoReportField =
  (typeof PUBLIC_DEMO_REPORT_FIELDS)[number];

export type PublicDemoRow = Record<PublicDemoReportField, string | number>;

export type PublicDemoReport = {
  id: string;
  name: string;
  description: string;
  modeledRows: number;
  columns: readonly PublicDemoReportField[];
};

export type PublicDemoModule = {
  id: PublicDemoModuleId;
  label: string;
  summary: string;
  metrics: Readonly<Record<string, string | number>>;
  reports: readonly PublicDemoReport[];
  rows: readonly PublicDemoRow[];
};

type Scenario = {
  id: PublicDemoScenarioId;
  label: string;
  description: string;
  metrics: Readonly<{
    securityScore: number;
    complianceScore: number;
    licenseUtilization: number;
    highRiskUsers: number;
  }>;
};

type PublicDemoSeed = {
  version: string;
  disclosure: string;
  tenant: Readonly<{
    id: string;
    name: string;
    primaryDomain: string;
    industry: string;
    region: string;
    users: number;
    objects: number;
  }>;
  scenarios: readonly Scenario[];
  modules: Readonly<Record<PublicDemoModuleId, PublicDemoModule>>;
};

const owners = [
  'amina.rahman@northstar.example',
  'david.chen@northstar.example',
  'maya.patel@northstar.example',
  'omar.hassan@northstar.example',
  'sara.wilson@northstar.example',
] as const;

const regions = ['Dubai', 'London', 'Singapore', 'New York', 'Frankfurt'] as const;

function rowsFor(label: string, offset: number): PublicDemoRow[] {
  return Array.from({ length: 8 }, (_, index) => {
    const risk = (offset * 13 + index * 17) % 100;
    return {
      objectId: `${label.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
      displayName: `${label} synthetic record ${index + 1}`,
      owner: owners[(index + offset) % owners.length],
      status: risk >= 80 ? 'critical' : risk >= 55 ? 'warning' : 'healthy',
      risk,
      region: regions[(index + offset) % regions.length],
      activity: `${4 + index * 7} minutes ago`,
    };
  });
}

const standardColumns = [
  'displayName',
  'owner',
  'status',
  'risk',
  'region',
  'activity',
] as const satisfies readonly PublicDemoReportField[];

function moduleSeed(
  id: PublicDemoModuleId,
  label: string,
  summary: string,
  offset: number,
  metrics: Record<string, string | number>,
  modeledRows: number,
): PublicDemoModule {
  return {
    id,
    label,
    summary,
    metrics,
    reports: [
      {
        id: `${id}-posture`,
        name: `${label} posture and exceptions`,
        description: `Synthetic ${label.toLowerCase()} evidence with ownership, status, risk, and activity.`,
        modeledRows,
        columns: standardColumns,
      },
      {
        id: `${id}-owners`,
        name: `${label} owner review`,
        description: `Synthetic accountability view for ${label.toLowerCase()} records.`,
        modeledRows: Math.max(24, Math.round(modeledRows * 0.18)),
        columns: ['displayName', 'owner', 'status', 'risk'],
      },
    ],
    rows: rowsFor(label, offset),
  };
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function sanitizeSyntheticValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replaceAll('Global Enterprise Holdings', 'Northstar Example Group')
      .replaceAll('globalholdings.onmicrosoft.com', 'northstar.example')
      .replaceAll('@globalholdings.com', '@northstar.example');
  }
  if (Array.isArray(value)) return value.map(sanitizeSyntheticValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        sanitizeSyntheticValue(child),
      ]),
    );
  }
  return value;
}

const modules = {
  'command-center': moduleSeed('command-center', 'Command Center', 'Unified posture, risk, operational health, and accountable action.', 0, { postureScore: 82, criticalFindings: 6, activeWorkflows: 14 }, 7850),
  'explorer-360': moduleSeed('explorer-360', 'Explorer 360', 'Synthetic identity and resource relationships in one governed profile.', 1, { identities: 5000, privileged: 86, external: 312 }, 5000),
  identity: moduleSeed('identity', 'Identity', 'Authentication, privilege, lifecycle, and access-risk intelligence.', 2, { mfaCoverage: '94%', highRiskUsers: 24, dormantPrivileged: 15 }, 5000),
  security: moduleSeed('security', 'Security', 'Correlated incidents, alerts, exposure, and evidence-backed response.', 3, { securityScore: 87, activeIncidents: 18, criticalAlerts: 7 }, 1640),
  reporting: moduleSeed('reporting', 'Reporting', 'Governed reporting catalogue, filters, evidence previews, and operations.', 4, { catalogueReports: 947, dashboards: 184, savedViews: 67 }, 947),
  licenses: moduleSeed('licenses', 'Licenses', 'Assignment activity, utilization, exceptions, and modeled recovery.', 5, { utilization: '76%', unusedE5: 1500, annualOpportunity: '$150K' }, 7350),
  compliance: moduleSeed('compliance', 'Compliance', 'Control coverage, evidence readiness, ownership, and exceptions.', 6, { complianceScore: 91, frameworks: 4, failedControls: 6 }, 240),
  'usage-analytics': moduleSeed('usage-analytics', 'Usage Analytics', 'Adoption, inactivity, workload trends, and service value.', 7, { activeUsers: 4620, inactiveUsers: 380, adoption: '92%' }, 5000),
  auditing: moduleSeed('auditing', 'Auditing', 'Sanitized activity evidence, anomalous operations, and review context.', 8, { eventsToday: 12840, highRiskEvents: 31, coverage: '100%' }, 12840),
  management: moduleSeed('management', 'Management', 'Governed administrative actions with approval-aware previews.', 9, { availableActions: 500, approvalRequired: 184, directChanges: 0 }, 500),
  governance: moduleSeed('governance', 'Governance', 'Lifecycle, external collaboration, policy ownership, and attestation.', 10, { governedObjects: 28900, openReviews: 42, overdue: 5 }, 28900),
  'hybrid-ad': moduleSeed('hybrid-ad', 'Hybrid Active Directory', 'Directory health, synchronization, replication, and hybrid risk.', 11, { directoryObjects: 22800, syncHealth: 'Healthy', replicationWarnings: 3 }, 22800),
} satisfies Record<PublicDemoModuleId, PublicDemoModule>;

export const PUBLIC_DEMO_SEED: Readonly<PublicDemoSeed> = deepFreeze({
  version: 'public-demo-2026.07',
  disclosure:
    'Synthetic demonstration data only. No customer tenant, credentials, or Microsoft 365 service is connected.',
  tenant: {
    id: 'public-demo-v1',
    name: 'Northstar Example Group',
    primaryDomain: 'northstar.example',
    industry: 'Logistics · Manufacturing · Financial Services',
    region: 'Global synthetic organization',
    users: 5000,
    objects: 28900,
  },
  scenarios: [
    { id: 'baseline', label: 'Normal operations', description: 'Balanced synthetic operating baseline.', metrics: { securityScore: 87, complianceScore: 91, licenseUtilization: 76, highRiskUsers: 24 } },
    { id: 'identity-risk', label: 'Identity risk', description: 'Risky sign-ins, MFA gaps, and dormant privilege.', metrics: { securityScore: 68, complianceScore: 82, licenseUtilization: 76, highRiskUsers: 64 } },
    { id: 'license-optimization', label: 'License optimization', description: 'Inactive service use and reclaimable subscription modeling.', metrics: { securityScore: 87, complianceScore: 91, licenseUtilization: 68, highRiskUsers: 24 } },
    { id: 'compliance-audit', label: 'Compliance audit', description: 'Evidence readiness and control-owner exception review.', metrics: { securityScore: 84, complianceScore: 79, licenseUtilization: 76, highRiskUsers: 28 } },
  ],
  modules,
});

export const PUBLIC_DEMO_ENTERPRISE = deepFreeze(
  sanitizeSyntheticValue(
    createEnterpriseDemo('public-demo-v1'),
  ) as EnterpriseDemoState,
);
