import { Injectable } from '@nestjs/common';
import { FindingsRepository } from '../findings/application/findings.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly findings: FindingsRepository) {}

  async overview(tenantId: string) {
    const findings = await this.findings.list(tenantId, { limit: 10 });
    return {
      generatedAt: new Date().toISOString(),
      tenant: { id: tenantId, name: 'Contoso Global', region: 'UAE North', collectionState: 'healthy', lastSyncMinutes: 2 },
      posture: { score: 78, change: 3.2, label: 'Improving' },
      metrics: { criticalFindings: findings.filter((f) => f.severity === 'critical').length, activeFindings: findings.length, complianceScore: 84, monthlySavings: 4957 },
      trend: [
        { label: 'Feb', score: 66 }, { label: 'Mar', score: 69 }, { label: 'Apr', score: 68 },
        { label: 'May', score: 72 }, { label: 'Jun', score: 75 }, { label: 'Jul', score: 78 },
      ],
      coverage: [
        { name: 'Entra ID', state: 'healthy', lagMinutes: 2 },
        { name: 'Defender XDR', state: 'healthy', lagMinutes: 4 },
        { name: 'Intune', state: 'warning', lagMinutes: 18 },
        { name: 'SharePoint', state: 'healthy', lagMinutes: 7 },
      ],
      priorityFindings: findings,
    };
  }
}

