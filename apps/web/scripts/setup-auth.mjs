import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const usernameArg = process.argv.find((item) => item.startsWith('--username='));
const passwordArg = process.argv.find((item) => item.startsWith('--password='));
const username = usernameArg?.slice('--username='.length) || 'admin@apex.local';
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
const generated = Array.from(randomBytes(22), (byte) => alphabet[byte % alphabet.length]).join('');
const password = passwordArg?.slice('--password='.length) || generated;
if (password.length < 14) throw new Error('Password must contain at least 14 characters.');

const salt = randomBytes(24).toString('base64url');
const hash = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const sessionSecret = randomBytes(48).toString('base64url');
const content = [
  '# Generated local authentication material. Never commit this file.',
  `AEGIS_AUTH_USERNAME=${username}`,
  `AEGIS_AUTH_PASSWORD_SALT=${salt}`,
  `AEGIS_AUTH_PASSWORD_HASH=${Buffer.from(hash).toString('hex')}`,
  `AEGIS_SESSION_SECRET=${sessionSecret}`,
  '# Localhost uses HTTP. Set true when deployed behind trusted HTTPS.',
  'AEGIS_COOKIE_SECURE=false',
  '',
].join('\n');
await writeFile(new URL('../.env.local', import.meta.url), content, { mode: 0o600 });
console.log(`Local identity configured for: ${username}`);
console.log(`One-time password: ${password}`);
console.log('Restart the web application before signing in.');
