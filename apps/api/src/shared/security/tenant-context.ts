export type PlatformRole =
  | 'platform-admin'
  | 'security-admin'
  | 'm365-admin'
  | 'auditor'
  | 'report-admin'
  | 'read-only';

export type SessionType = 'workforce';

export interface TenantContext {
  tenantId: string;
  actorId: string;
  roles: PlatformRole[];
  sessionType: SessionType;
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
      correlationId?: string;
    }
  }
}
