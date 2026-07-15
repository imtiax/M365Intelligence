import type { Finding, Severity } from '../domain/finding';

export interface FindingFilter {
  severity?: Severity;
  limit: number;
}

export abstract class FindingsRepository {
  abstract list(tenantId: string, filter: FindingFilter): Promise<Finding[]>;
  abstract get(tenantId: string, id: string): Promise<Finding | undefined>;
}

