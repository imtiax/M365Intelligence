import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DemoPersona } from '../../shared/security/tenant-context';
import {
  PublicDemoModuleQueryDto,
  PublicDemoReportPreviewDto,
  type PublicDemoReportFilterDto,
} from './public-demo.dto';
import {
  PUBLIC_DEMO_ENTERPRISE,
  PUBLIC_DEMO_MODULE_IDS,
  PUBLIC_DEMO_SEED,
  type PublicDemoModule,
  type PublicDemoModuleId,
  type PublicDemoReportField,
  type PublicDemoRow,
  type PublicDemoScenarioId,
} from './public-demo.seed';
import { PublicDemoStore } from './public-demo.store';

@Injectable()
export class PublicDemoService {
  constructor(private readonly store: PublicDemoStore) {}

  bootstrap(sessionId: string, persona: DemoPersona) {
    const overlay = this.store.get(sessionId);
    const scenario = this.scenario(overlay.activeScenario);
    const safeguards = this.safeguards();
    return {
      generatedAt: new Date().toISOString(),
      seedVersion: PUBLIC_DEMO_SEED.version,
      disclosure: PUBLIC_DEMO_SEED.disclosure,
      session: { id: sessionId, persona, expiresAt: overlay.expiresAt },
      tenant: {
        ...PUBLIC_DEMO_SEED.tenant,
        metrics: scenario.metrics,
      },
      activeScenario: scenario,
      scenarios: PUBLIC_DEMO_SEED.scenarios,
      summary: {
        ...scenario.metrics,
        availableModules: PUBLIC_DEMO_MODULE_IDS.length,
        availableReports: PUBLIC_DEMO_MODULE_IDS.reduce(
          (total, id) => total + PUBLIC_DEMO_SEED.modules[id].reports.length,
          0,
        ),
        recentPreviews: overlay.reportPreviews.length,
        evidenceEvents: PUBLIC_DEMO_ENTERPRISE.timeline.length,
      },
      safeguards,
      resetVersion: overlay.resetVersion,
      modules: PUBLIC_DEMO_MODULE_IDS.map((id) => {
        const item = PUBLIC_DEMO_SEED.modules[id];
        return {
          id: item.id,
          label: item.label,
          summary: item.summary,
          metrics: this.moduleMetrics(item, overlay.activeScenario),
          reports: item.reports.map(({ id: reportId, name, description }) => ({
            id: reportId,
            name,
            description,
          })),
        };
      }),
      recentReportPreviews: overlay.reportPreviews,
    };
  }

  module(
    sessionId: string,
    moduleId: string,
    query: PublicDemoModuleQueryDto,
  ) {
    const overlay = this.store.get(sessionId);
    const legacy = this.legacyModule(moduleId, overlay.activeScenario, query);
    if (legacy !== undefined) return legacy;
    const item = this.requireModule(moduleId);
    return {
      generatedAt: new Date().toISOString(),
      disclosure: PUBLIC_DEMO_SEED.disclosure,
      activeScenario: this.scenario(overlay.activeScenario),
      module: {
        id: item.id,
        label: item.label,
        summary: item.summary,
        metrics: this.moduleMetrics(item, overlay.activeScenario),
        reports: item.reports,
        sample: item.rows,
      },
    };
  }

  reportPreview(sessionId: string, input: PublicDemoReportPreviewDto) {
    this.store.get(sessionId);
    if (input.kind === 'ai') return this.aiPreview(sessionId, input.question);

    const module = this.requireModule(
      input.moduleId ?? this.moduleForWorkload(input.workload),
    );
    const report = input.reportId
      ? module.reports.find((item) => item.id === input.reportId)
      : module.reports[0];
    if (!report) {
      throw new NotFoundException(
        'The requested synthetic report is not available in this module.',
      );
    }

    const columns = input.columns?.length
      ? input.columns
      : [...report.columns];

    const filters = input.filters ?? [];
    const matchingRows = module.rows.filter((row) => {
      if (!filters.length) return true;
      return filters.reduce((matched, filter, index) => {
        const next = this.matches(row, filter);
        if (index === 0) return next;
        return filter.logic === 'or' ? matched || next : matched && next;
      }, true);
    });
    const rows = matchingRows
      .slice(0, input.limit)
      .map((row) => columns.map((column) => String(this.project(row, column))));
    const ratio = module.rows.length
      ? matchingRows.length / module.rows.length
      : 0;
    const totalRows = filters.length
      ? Math.max(matchingRows.length, Math.round(report.modeledRows * ratio))
      : report.modeledRows;
    const record = this.store.recordPreview(sessionId, {
      moduleId: module.id,
      reportId: report.id,
      totalRows,
    });

    return {
      id: record.id,
      name: input.name?.trim() || report.name,
      workload: input.workload?.trim() || module.label,
      description: `${report.description} ${PUBLIC_DEMO_SEED.disclosure}`,
      generatedAt: record.createdAt,
      sourceFreshness: 'isolated synthetic snapshot',
      totalRows: totalRows.toLocaleString('en-US'),
      columns,
      rows,
      metrics: [
        { label: 'Modeled rows', value: totalRows.toLocaleString('en-US'), detail: 'Synthetic population' },
        { label: 'Preview rows', value: rows.length.toLocaleString('en-US'), detail: 'Bounded session preview' },
        { label: 'Filters', value: filters.length.toLocaleString('en-US'), detail: 'Allow-listed conditions' },
      ],
    };
  }

  selectScenario(sessionId: string, scenarioId: PublicDemoScenarioId) {
    this.scenario(scenarioId);
    this.store.selectScenario(sessionId, scenarioId);
    const overlay = this.store.get(sessionId);
    return {
      activeScenario: this.scenario(overlay.activeScenario),
      resetVersion: overlay.resetVersion,
      safeguards: this.safeguards(),
    };
  }

  tick(sessionId: string) {
    const overlay = this.store.get(sessionId);
    const variants = [
      ['login', 'Synthetic sign-in observed', 'An allow-listed location completed a synthetic sign-in.', 'info'],
      ['risk', 'Synthetic identity risk changed', 'A fictional identity moved into owner review.', 'warning'],
      ['alert', 'Synthetic alert correlated', 'Fictional identity and endpoint evidence was correlated.', 'critical'],
    ] as const;
    const selected = variants[
      (overlay.resetVersion + overlay.reportPreviews.length) % variants.length
    ];
    return {
      id: `public-demo-${overlay.resetVersion}-${overlay.reportPreviews.length}`,
      type: selected[0],
      title: selected[1],
      detail: selected[2],
      severity: selected[3],
      occurredAt: new Date().toISOString(),
      synthetic: true,
    };
  }

  reset(sessionId: string) {
    const overlay = this.store.reset(sessionId);
    return {
      demoSessionId: sessionId,
      resetVersion: overlay.resetVersion,
      activeScenario: overlay.activeScenario,
      recentReportPreviews: overlay.reportPreviews.length,
      expiresAt: overlay.expiresAt,
      safeguards: this.safeguards(),
    };
  }

  private requireModule(moduleId: string): PublicDemoModule {
    if (!PUBLIC_DEMO_MODULE_IDS.includes(moduleId as PublicDemoModuleId)) {
      throw new NotFoundException('Public demo module not found.');
    }
    return PUBLIC_DEMO_SEED.modules[moduleId as PublicDemoModuleId];
  }

  private legacyModule(
    moduleId: string,
    scenarioId: PublicDemoScenarioId,
    query: PublicDemoModuleQueryDto,
  ): unknown | undefined {
    const enterprise = PUBLIC_DEMO_ENTERPRISE;
    const scenario = this.scenario(scenarioId);
    const generatedAt = new Date().toISOString();
    const tenant = {
      ...enterprise.tenant,
      activeScenario: scenario.id,
      kpis: { ...enterprise.tenant.kpis, ...scenario.metrics },
    };

    if (moduleId === 'overview') {
      return {
        generatedAt,
        tenant,
        objectCounts: {
          users: enterprise.users.length,
          groups: enterprise.groups.length,
          teams: enterprise.teams.length,
          channels: enterprise.channels.length,
          sharePointSites: enterprise.sharePointSites.length,
          oneDrives: enterprise.oneDrives.length,
          mailboxes: enterprise.mailboxes.length,
          devices: enterprise.devices.length,
          applications: enterprise.applications.length,
        },
        departments: enterprise.departments,
        locations: enterprise.locations,
        scenarios: PUBLIC_DEMO_SEED.scenarios,
        latestEvents: enterprise.timeline.slice(0, 8),
      };
    }

    if (moduleId === 'users') {
      const search = query.search.trim().toLowerCase();
      const risk = query.risk.trim().toLowerCase();
      const users = enterprise.users.filter(
        (user) =>
          (!search ||
            `${user.displayName} ${user.username} ${user.department} ${user.location}`
              .toLowerCase()
              .includes(search)) &&
          (!risk || user.riskLevel.toLowerCase() === risk),
      );
      return { total: users.length, items: users.slice(0, query.limit) };
    }

    if (moduleId.startsWith('user-')) {
      const id = moduleId.slice('user-'.length).toLowerCase();
      const user = enterprise.users.find(
        (item) =>
          item.id.toLowerCase() === id || item.username.toLowerCase() === id,
      );
      if (!user) throw new NotFoundException('Synthetic demo user not found.');
      return {
        ...user,
        recommendations: [
          ...(user.riskLevel === 'High'
            ? ['Review the synthetic risky sign-in evidence.']
            : []),
          ...(user.mfaStatus === 'Disabled'
            ? ['Model phishing-resistant MFA registration.']
            : []),
          ...(user.accountStatus === 'Inactive'
            ? ['Review ownership before modeling license recovery.']
            : []),
        ],
        recentActivity: enterprise.timeline.slice(0, 6),
      };
    }

    if (moduleId === 'security') {
      return {
        score: scenario.metrics.securityScore,
        riskDistribution: { high: scenario.metrics.highRiskUsers, medium: 86, low: 340 },
        activeIncidents: enterprise.securityEvents.filter(
          (item) => item.status !== 'Resolved',
        ).length,
        events: enterprise.securityEvents.slice(0, 50),
        findings: enterprise.riskFindings,
        recommendations: [
          'Model Conditional Access MFA coverage',
          'Review synthetic dormant privilege',
          'Inspect external collaboration exceptions',
        ],
      };
    }

    if (moduleId === 'licenses') {
      const annualSavings = enterprise.licenses.reduce(
        (total, item) => total + item.unused * item.monthlyUnitCost * 12,
        0,
      );
      const candidates = enterprise.users
        .filter((user, index) => user.license === 'Microsoft 365 E5' && index % 3 === 0)
        .slice(0, 100)
        .map((user, index) => ({
          user: user.displayName,
          username: user.username,
          currentLicense: user.license,
          usage: `${3 + (index % 12)}%`,
          recommendation: 'Model move to Business Premium',
          annualSaving: 420,
        }));
      return {
        utilization: scenario.metrics.licenseUtilization,
        annualSavings,
        plans: enterprise.licenses,
        candidates,
      };
    }

    if (moduleId === 'compliance') {
      const frameworkScores = ['ISO 27001', 'NIST', 'CIS', 'SOC 2'].map(
        (framework) => {
          const controls = enterprise.complianceControls.filter(
            (item) => item.framework === framework,
          );
          return {
            framework,
            score: Math.round(
              controls.reduce((sum, item) => sum + item.score, 0) /
                controls.length,
            ),
            controls: controls.length,
            failed: controls.filter((item) => item.status === 'Failed').length,
          };
        },
      );
      return {
        score: scenario.metrics.complianceScore,
        frameworkScores,
        controls: enterprise.complianceControls,
      };
    }

    if (moduleId === 'admin-centers') {
      const definitions = [
        ['Microsoft Entra ID', 1400],
        ['Exchange Online', 900],
        ['Microsoft Teams', 650],
        ['SharePoint Online', 650],
        ['OneDrive', 750],
        ['Microsoft Intune', 900],
        ['Defender XDR', 350],
        ['Microsoft Purview', 450],
        ['Licensing & Cost', 1100],
        ['Hybrid Active Directory', 700],
      ] as const;
      return {
        generatedAt,
        items: definitions.map(([workload, total], index) => {
          const critical = Math.max(2, Math.round(total * (0.025 + index * 0.001)));
          const warning = Math.round(total * 0.11);
          return {
            workload,
            total,
            healthy: total - warning - critical,
            warning,
            critical,
            health: 96 - (index % 6),
            averageRisk: 18 + index * 2,
            freshnessSeconds: 45 + index * 17,
          };
        }),
      };
    }

    if (moduleId === 'report-operations') {
      return {
        generatedAt,
        summary: { views: 3, activeSchedules: 2, activeAlerts: 2, completedRuns: 4 },
        views: [
          { id: 'demo-view-identity', tenantId: 'public-demo-v1', reportId: 'identity-posture', name: 'Identity risk owner review', reportName: 'Identity posture and exceptions', workload: 'Microsoft Entra ID', columns: ['Display name', 'Owner', 'Risk score'], filters: [], visibility: 'team', favorite: true, createdBy: 'reporting@northstar.example', createdAt: generatedAt, updatedAt: generatedAt },
          { id: 'demo-view-license', tenantId: 'public-demo-v1', reportId: 'licenses-posture', name: 'Inactive license candidates', reportName: 'License posture and exceptions', workload: 'Licensing & Cost', columns: ['Display name', 'Owner', 'Activity'], filters: [], visibility: 'team', favorite: true, createdBy: 'finops@northstar.example', createdAt: generatedAt, updatedAt: generatedAt },
          { id: 'demo-view-compliance', tenantId: 'public-demo-v1', reportId: 'compliance-posture', name: 'Failed control evidence', reportName: 'Compliance posture and exceptions', workload: 'Microsoft Purview', columns: ['Display name', 'Status', 'Owner'], filters: [], visibility: 'private', favorite: false, createdBy: 'audit@northstar.example', createdAt: generatedAt, updatedAt: generatedAt },
        ],
        schedules: [
          { id: 'demo-schedule-1', tenantId: 'public-demo-v1', viewId: 'demo-view-identity', name: 'Weekly identity review', cadence: 'weekly', timezone: 'Asia/Dubai', runAt: '08:30', delivery: 'local_archive', status: 'active', createdBy: 'reporting@northstar.example', createdAt: generatedAt, updatedAt: generatedAt },
          { id: 'demo-schedule-2', tenantId: 'public-demo-v1', viewId: 'demo-view-license', name: 'Monthly FinOps review', cadence: 'monthly', timezone: 'UTC', runAt: '07:00', delivery: 'local_archive', status: 'active', createdBy: 'finops@northstar.example', createdAt: generatedAt, updatedAt: generatedAt },
        ],
        alerts: [
          { id: 'demo-alert-1', tenantId: 'public-demo-v1', viewId: 'demo-view-identity', name: 'Critical identities detected', metric: 'critical_count', operator: 'gt', threshold: 0, severity: 'critical', status: 'active', createdBy: 'security@northstar.example', createdAt: generatedAt, updatedAt: generatedAt },
          { id: 'demo-alert-2', tenantId: 'public-demo-v1', viewId: 'demo-view-license', name: 'Recovery cohort detected', metric: 'row_count', operator: 'gt', threshold: 50, severity: 'warning', status: 'active', createdBy: 'finops@northstar.example', createdAt: generatedAt, updatedAt: generatedAt },
        ],
        runs: [
          { id: 'demo-run-1', name: 'Identity risk owner review', workload: 'Microsoft Entra ID', status: 'completed', trigger: 'interactive', requestedBy: 'reporting@northstar.example', createdAt: generatedAt, completedAt: generatedAt, result: { totalRows: 86 } },
          { id: 'demo-run-2', name: 'Inactive license candidates', workload: 'Licensing & Cost', status: 'completed', trigger: 'schedule_manual', requestedBy: 'finops@northstar.example', createdAt: generatedAt, completedAt: generatedAt, result: { totalRows: 87 } },
        ],
      };
    }

    if (moduleId === 'workflows') {
      return {
        items: [
          { id: 'demo-workflow-1', title: 'Dormant E5 assignment review', requestedBy: 'finops@northstar.example', owner: 'FinOps', approver: 'security@northstar.example', state: 'pending_approval' },
          { id: 'demo-workflow-2', title: 'Phishing-resistant MFA registration', requestedBy: 'identity@northstar.example', owner: 'Identity Operations', approver: 'security@northstar.example', state: 'approved' },
          { id: 'demo-workflow-3', title: 'External sharing exception review', requestedBy: 'governance@northstar.example', owner: 'Data Governance', approver: 'audit@northstar.example', state: 'completed', execution: { affected: 42, succeeded: 39, failed: 0, skipped: 3, message: 'Synthetic preview completed; no customer service was changed.' } },
        ],
      };
    }

    const organization = {
      id: 'northstar-example',
      tenantId: 'public-demo-v1',
      legalName: 'Northstar Example Group Ltd',
      displayName: 'Northstar Example Group',
      industry: ['Logistics', 'Manufacturing', 'Financial Services'],
      companySize: '5,000 synthetic users',
      primaryRegion: 'Global synthetic organization',
      mode: 'public-demo',
      dataBoundary: 'isolated synthetic session',
      onboarding: { completed: 8, total: 9, next: 'Exit demo without connecting a tenant' },
    };
    if (moduleId === 'commercial-organization') return organization;
    if (moduleId === 'commercial-subscription') {
      return { plan: 'Enterprise Demo', state: 'synthetic', billingCycle: 'Not applicable', licensedUsers: 5000, trialEndsAt: '2026-12-31T23:59:59.000Z', entitlements: ['reporting', 'security', 'compliance', 'governed-preview'], note: PUBLIC_DEMO_SEED.disclosure };
    }
    if (moduleId === 'commercial-license') {
      return { licenseNumber: 'PUBLIC-DEMO-NOT-A-LICENSE', state: 'synthetic', edition: 'Public Demonstration', boundTenantId: 'public-demo-v1', maxInstances: 1, activeInstances: 1, maxUsers: 5000, activationMode: 'isolated-session', expiresAt: '2026-12-31T23:59:59.000Z', cryptographicEnforcement: 'not-applicable-to-public-demo' };
    }
    if (moduleId === 'commercial-connectors') {
      const names = ['Microsoft Entra ID', 'Exchange Online', 'Microsoft Teams', 'SharePoint Online', 'Microsoft Intune', 'Defender XDR', 'Microsoft Purview', 'Hybrid Active Directory'];
      return { generatedAt, items: names.map((name, index) => ({ code: name.toLowerCase().replaceAll(' ', '-'), name, domain: 'Synthetic', reports: 72 + index * 9, state: index === 6 ? 'degraded' : 'healthy', permissionCoverage: index === 6 ? 88 : 100, lastSyncAt: generatedAt, nextSyncAt: generatedAt, objectsProcessed: 840 + index * 731, missingPermissions: index === 6 ? ['Synthetic.Records.Read'] : [] })) };
    }
    if (moduleId === 'commercial-customers') {
      return { summary: { customers: 1, activeTrials: 0, paidSubscriptions: 0, expiringLicenses: 0 }, items: [{ organization: 'Northstar Example Group', tenantId: 'public-demo-v1', mode: 'Synthetic public demo', subscription: 'Not billable', license: 'Synthetic', connectors: '7 healthy · 1 simulated warning', dataBoundary: 'Isolated session' }], disclosure: PUBLIC_DEMO_SEED.disclosure };
    }

    return undefined;
  }

  private scenario(id: PublicDemoScenarioId) {
    const scenario = PUBLIC_DEMO_SEED.scenarios.find((item) => item.id === id);
    if (!scenario) throw new NotFoundException('Public demo scenario not found.');
    return scenario;
  }

  private moduleMetrics(
    module: PublicDemoModule,
    scenarioId: PublicDemoScenarioId,
  ) {
    const scenario = this.scenario(scenarioId);
    if (module.id === 'command-center') {
      return {
        ...module.metrics,
        securityScore: scenario.metrics.securityScore,
        complianceScore: scenario.metrics.complianceScore,
        licenseUtilization: `${scenario.metrics.licenseUtilization}%`,
        highRiskUsers: scenario.metrics.highRiskUsers,
      };
    }
    if (module.id === 'identity') {
      return { ...module.metrics, highRiskUsers: scenario.metrics.highRiskUsers };
    }
    if (module.id === 'security') {
      return { ...module.metrics, securityScore: scenario.metrics.securityScore };
    }
    if (module.id === 'compliance') {
      return {
        ...module.metrics,
        complianceScore: scenario.metrics.complianceScore,
      };
    }
    if (module.id === 'licenses') {
      return {
        ...module.metrics,
        utilization: `${scenario.metrics.licenseUtilization}%`,
      };
    }
    return module.metrics;
  }

  private matches(row: PublicDemoRow, filter: PublicDemoReportFilterDto) {
    const value = this.project(row, filter.field);
    const expected = filter.value.trim();
    if (filter.operator === 'contains') {
      return String(value).toLowerCase().includes(expected.toLowerCase());
    }
    if (filter.operator === 'equals') {
      return String(value).toLowerCase() === expected.toLowerCase();
    }
    if (filter.operator === 'not_equals') {
      return String(value).toLowerCase() !== expected.toLowerCase();
    }
    const numericValue = typeof value === 'number' ? value : Number(value);
    const numericExpected = Number(expected);
    if (!Number.isFinite(numericValue) || !Number.isFinite(numericExpected)) {
      throw new BadRequestException(
        `Filter ${filter.operator} requires a numeric field and value.`,
      );
    }
    return filter.operator === 'gte'
      ? numericValue >= numericExpected
      : numericValue <= numericExpected;
  }

  private project(row: PublicDemoRow, field: string): string | number | boolean {
    if (field in row) return row[field as PublicDemoReportField];
    const normalized = field.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
    if (['displayname', 'name', 'entity', 'object'].includes(normalized)) return row.displayName;
    if (['riskscore', 'risk'].includes(normalized)) return row.risk;
    if (['owner', 'ownername'].includes(normalized)) return row.owner;
    if (['region', 'location'].includes(normalized)) return row.region;
    if (['activity', 'lastactivity', 'updatedat'].includes(normalized)) return row.activity;
    if (['objectid', 'id'].includes(normalized)) return row.objectId;
    const risk = Number(row.risk);
    if (normalized === 'department') return ['Finance', 'IT', 'Security', 'Operations'][risk % 4];
    if (normalized === 'type') return 'Synthetic object';
    if (normalized === 'external') return risk % 5 === 0;
    if (normalized === 'activityscore') return 100 - risk;
    if (normalized === 'status') return row.status;
    return 'Synthetic';
  }

  private moduleForWorkload(workload = ''): PublicDemoModuleId {
    const normalized = workload.toLowerCase();
    if (normalized.includes('entra') || normalized.includes('identity')) return 'identity';
    if (normalized.includes('defender') || normalized.includes('security')) return 'security';
    if (normalized.includes('purview') || normalized.includes('compliance')) return 'compliance';
    if (normalized.includes('license') || normalized.includes('finops')) return 'licenses';
    if (normalized.includes('hybrid') || normalized.includes('directory')) return 'hybrid-ad';
    if (normalized.includes('usage') || normalized.includes('onedrive')) return 'usage-analytics';
    if (normalized.includes('report')) return 'reporting';
    if (normalized.includes('team') || normalized.includes('sharepoint')) return 'governance';
    return 'management';
  }

  private aiPreview(sessionId: string, question = '') {
    const prompt = question.trim() || 'Summarize the synthetic tenant posture';
    const normalized = prompt.toLowerCase();
    const scenario = this.scenario(this.store.get(sessionId).activeScenario);
    const security = normalized.includes('security') || normalized.includes('risk');
    const licensing = normalized.includes('license') || normalized.includes('cost');
    const compliance = normalized.includes('compliance') || normalized.includes('audit');
    this.store.recordPreview(sessionId, {
      moduleId: 'command-center',
      reportId: 'deterministic-ai-preview',
      totalRows: 0,
    });
    return {
      question: prompt,
      answer: security
        ? `The isolated synthetic scenario contains ${scenario.metrics.highRiskUsers} high-risk identities and a modeled security score of ${scenario.metrics.securityScore}%. No customer evidence was queried.`
        : licensing
          ? `The synthetic license model contains 1,500 inactive E5 assignments and a modeled annual opportunity above $150,000, subject to fictional owner exceptions.`
          : compliance
            ? `Synthetic compliance readiness is ${scenario.metrics.complianceScore}%. The modeled gaps concern MFA enforcement, sharing governance, and evidence ownership.`
            : `Northstar Example Group is a fictional 5,000-user organization. Its modeled security score is ${scenario.metrics.securityScore}%, compliance is ${scenario.metrics.complianceScore}%, and license utilization is ${scenario.metrics.licenseUtilization}%.`,
      findings: security
        ? PUBLIC_DEMO_ENTERPRISE.riskFindings.slice(0, 3).map(({ title, count }) => ({ title, count }))
        : [],
      recommendations: [
        'Inspect the synthetic evidence preview',
        'Compare the modeled owner and exception context',
        'Use a private deployment for authorized customer data',
      ],
      sources: [
        'Isolated synthetic identity model',
        'Isolated synthetic security model',
        'Isolated synthetic governance model',
      ],
      groundedAt: new Date().toISOString(),
    };
  }

  private safeguards() {
    return {
      syntheticDataOnly: true,
      customerTenantConnected: false,
      persistentCustomerMutation: false,
      externalDataTransfer: false,
      resetScope: 'current_public_demo_session',
    } as const;
  }
}
