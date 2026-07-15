import { scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

function derive(password: string, salt: string, length: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, options, (error, key) => error ? reject(error) : resolve(key));
  });
}

export async function verifyConfiguredPassword(username: string, password: string): Promise<boolean> {
  const configuredUser = process.env.AEGIS_AUTH_USERNAME;
  const salt = process.env.AEGIS_AUTH_PASSWORD_SALT;
  const expectedHex = process.env.AEGIS_AUTH_PASSWORD_HASH;
  if (!configuredUser || !salt || !expectedHex) throw new Error('Local authentication is not configured. Run npm run auth:setup.');
  if (username.length > 254 || password.length > 256) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await derive(password, salt, expected.length, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const userMatch = username.toLocaleLowerCase('en-US') === configuredUser.toLocaleLowerCase('en-US');
  return timingSafeEqual(actual, expected) && userMatch;
}
