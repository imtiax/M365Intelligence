export type PlatformRole =
  | 'platform-admin'
  | 'security-admin'
  | 'm365-admin'
  | 'auditor'
  | 'report-admin'
  | 'read-only';

export interface TenantContext {
  tenantId: string;
  actorId: string;
  roles: PlatformRole[];
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
      correlationId?: string;
    }
  }
}

