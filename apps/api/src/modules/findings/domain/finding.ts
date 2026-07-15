export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type FindingStatus = 'active' | 'accepted' | 'remediating' | 'resolved';

export interface Finding {
  id: string;
  tenantId: string;
  title: string;
  category: 'identity' | 'data' | 'device' | 'license' | 'compliance';
  severity: Severity;
  riskScore: number;
  confidence: number;
  impact: string;
  affectedCount: number;
  recommendation: string;
  status: FindingStatus;
  automation: { available: boolean; approvalRequired: boolean };
  evidenceAsOf: string;
}

