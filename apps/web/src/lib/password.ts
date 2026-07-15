import { scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { LocalIdentity, PublicIdentity } from './identity';

function derive(password: string, salt: string, length: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, options, (error, key) => error ? reject(error) : resolve(key));
  });
}

function configuredUsers(): LocalIdentity[] {
  const encoded = process.env.AEGIS_LOCAL_USERS_B64;
  if (!encoded) throw new Error('Local authentication is not configured. Run npm run auth:setup.');
  const users = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as LocalIdentity[];
  if (!Array.isArray(users) || !users.length) throw new Error('No local identities are configured.');
  return users;
}

export function listConfiguredIdentities(): PublicIdentity[] {
  return configuredUsers().map(({ salt: _salt, passwordHash: _passwordHash, ...identity }) => identity);
}

export async function authenticateConfiguredUser(username: string, password: string): Promise<PublicIdentity | null> {
  if (username.length > 254 || password.length > 256) return null;
  const user = configuredUsers().find((candidate) => candidate.username.toLocaleLowerCase('en-US') === username.toLocaleLowerCase('en-US'));
  // Derive a key even when the username is unknown to reduce account-enumeration timing differences.
  const fallback = configuredUsers()[0];
  const candidate = user ?? fallback;
  const expected = Buffer.from(candidate.passwordHash, 'hex');
  const actual = await derive(password, candidate.salt, expected.length, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  if (!user || !timingSafeEqual(actual, expected)) return null;

  const { salt: _salt, passwordHash: _passwordHash, ...identity } = user;
  return identity;
}
