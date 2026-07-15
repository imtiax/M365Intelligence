import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import type { JWTPayload } from 'jose';
import type { PlatformRole, PublicIdentity } from './identity';

export const SESSION_COOKIE = 'aegis_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface AegisSession extends JWTPayload {
  sub: string;
  name: string;
  title: string;
  tenantId: string;
  roles: PlatformRole[];
}

function signingKey(): Uint8Array {
  const secret = process.env.AEGIS_SESSION_SECRET;
  if (!secret || secret.length < 43) throw new Error('AEGIS_SESSION_SECRET must contain at least 256 bits of entropy.');
  return new TextEncoder().encode(secret);
}

export async function createSession(identity: PublicIdentity): Promise<string> {
  return new SignJWT({ name: identity.name, title: identity.title, tenantId: identity.tenantId, roles: identity.roles })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(identity.username)
    .setIssuer('aegis-local')
    .setAudience('aegis-web')
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(signingKey());
}

export async function verifySession(token: string): Promise<AegisSession> {
  const { payload } = await jwtVerify(token, signingKey(), {
    algorithms: ['HS256'], issuer: 'aegis-local', audience: 'aegis-web',
  });
  if (!payload.sub || typeof payload.name !== 'string' || typeof payload.title !== 'string' || typeof payload.tenantId !== 'string' || !Array.isArray(payload.roles)) throw new Error('Invalid session claims.');
  return payload as AegisSession;
}
