import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import type { JWTPayload } from 'jose';
import type { PlatformRole, PublicIdentity } from './identity';

export const SESSION_COOKIE = 'aegis_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const PUBLIC_DEMO_SESSION_TTL_SECONDS = 30 * 60;

export const publicDemoPersonas = ['executive', 'security', 'operations', 'reporting'] as const;
export type PublicDemoPersona = (typeof publicDemoPersonas)[number];
export type PublicDemoMode = 'guided' | 'free';

export interface AegisSession extends JWTPayload {
  sub: string;
  name: string;
  title: string;
  tenantId: string;
  roles: PlatformRole[];
  sessionType: 'workforce' | 'public-demo';
  demoSessionId?: string;
  demoPersona?: PublicDemoPersona;
  demoMode?: PublicDemoMode;
}

function signingKey(): Uint8Array {
  const secret = process.env.AEGIS_SESSION_SECRET;
  if (!secret || secret.length < 43) throw new Error('AEGIS_SESSION_SECRET must contain at least 256 bits of entropy.');
  return new TextEncoder().encode(secret);
}

export async function createSession(identity: PublicIdentity): Promise<string> {
  return new SignJWT({ name: identity.name, title: identity.title, tenantId: identity.tenantId, roles: identity.roles, sessionType: 'workforce' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(identity.username)
    .setIssuer('aegis-local')
    .setAudience('aegis-web')
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(signingKey());
}

const publicDemoIdentities: Record<PublicDemoPersona, Pick<AegisSession, 'sub' | 'name' | 'title'>> = {
  executive: { sub: 'maya.chen@aegis-demo.example', name: 'Maya Chen', title: 'Chief Information Officer' },
  security: { sub: 'omar.haddad@aegis-demo.example', name: 'Omar Haddad', title: 'Security & Compliance Director' },
  operations: { sub: 'priya.nair@aegis-demo.example', name: 'Priya Nair', title: 'Microsoft 365 Operations Lead' },
  reporting: { sub: 'daniel.kim@aegis-demo.example', name: 'Daniel Kim', title: 'Reporting & FinOps Manager' },
};

export async function createPublicDemoSession(
  persona: PublicDemoPersona,
  mode: PublicDemoMode,
  demoSessionId = crypto.randomUUID(),
): Promise<{ token: string; demoSessionId: string }> {
  const identity = publicDemoIdentities[persona];
  const token = await new SignJWT({
    name: identity.name,
    title: identity.title,
    tenantId: '00000000-0000-4000-8000-00000000d3f0',
    roles: ['read-only'] satisfies PlatformRole[],
    sessionType: 'public-demo',
    demoSessionId,
    demoPersona: persona,
    demoMode: mode,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(identity.sub)
    .setIssuer('aegis-local')
    .setAudience('aegis-public-demo')
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${PUBLIC_DEMO_SESSION_TTL_SECONDS}s`)
    .sign(signingKey());
  return { token, demoSessionId };
}

export async function verifySession(token: string): Promise<AegisSession> {
  const { payload } = await jwtVerify(token, signingKey(), {
    algorithms: ['HS256'], issuer: 'aegis-local', audience: ['aegis-web', 'aegis-public-demo'],
  });
  if (!payload.sub || typeof payload.name !== 'string' || typeof payload.title !== 'string' || typeof payload.tenantId !== 'string' || !Array.isArray(payload.roles)) throw new Error('Invalid session claims.');
  if (payload.sessionType !== 'workforce' && payload.sessionType !== 'public-demo') throw new Error('Invalid session type.');
  if (payload.sessionType === 'public-demo') {
    if (typeof payload.demoSessionId !== 'string' || !publicDemoPersonas.includes(payload.demoPersona as PublicDemoPersona)) throw new Error('Invalid public demo claims.');
    if (payload.demoMode !== 'guided' && payload.demoMode !== 'free') throw new Error('Invalid public demo mode.');
    if (payload.roles.length !== 1 || payload.roles[0] !== 'read-only') throw new Error('Public demo sessions must be read-only.');
  }
  return payload as AegisSession;
}
