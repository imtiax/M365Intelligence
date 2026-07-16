export type PlatformRole =
  | 'platform-admin'
  | 'security-admin'
  | 'm365-admin'
  | 'auditor'
  | 'report-admin'
  | 'read-only';

export type SessionType = 'workforce' | 'public-demo';
export type DemoPersona = 'executive' | 'security' | 'operations' | 'reporting';

export interface TenantContext {
  tenantId: string;
  actorId: string;
  roles: PlatformRole[];
  sessionType: SessionType;
  demoSessionId?: string;
  demoPersona?: DemoPersona;
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
      correlationId?: string;
    }
  }
}
