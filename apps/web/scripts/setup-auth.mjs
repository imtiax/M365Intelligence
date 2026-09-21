import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const passwordArg = process.argv.find((item) => item.startsWith('--password='));
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
const generated = Array.from(randomBytes(22), (byte) => alphabet[byte % alphabet.length]).join('');
const password = passwordArg?.slice('--password='.length) || generated;
if (password.length < 14) throw new Error('Password must contain at least 14 characters.');

const tenantId = '00000000-0000-4000-8000-000000000001';
const profiles = [
  ['admin@local.invalid', 'Alex Morgan', 'Platform Administrator', ['platform-admin']],
  ['security@local.invalid', 'Sara Khan', 'Security Operations Lead', ['security-admin']],
  ['m365admin@local.invalid', 'Omar Rahman', 'Microsoft 365 Administrator', ['m365-admin']],
  ['reports@local.invalid', 'Nadia Ali', 'Reporting Administrator', ['report-admin']],
  ['auditor@local.invalid', 'David Chen', 'Compliance Auditor', ['auditor']],
  ['viewer@local.invalid', 'Maya Patel', 'Business Risk Viewer', ['read-only']],
];
const users = await Promise.all(profiles.map(async ([username, name, title, roles]) => {
  const salt = randomBytes(24).toString('base64url');
  const hash = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return { username, name, title, tenantId, roles, salt, passwordHash: Buffer.from(hash).toString('hex') };
}));
const sessionSecret = randomBytes(48).toString('base64url');
const internalApiSecret = randomBytes(48).toString('base64url');
const content = [
  '# Generated local authentication material. Never commit this file.',
  `AEGIS_LOCAL_USERS_B64=${Buffer.from(JSON.stringify(users)).toString('base64url')}`,
  `AEGIS_SESSION_SECRET=${sessionSecret}`,
  `AEGIS_INTERNAL_API_SECRET=${internalApiSecret}`,
  '# Localhost uses HTTP. Set true when deployed behind trusted HTTPS.',
  'AEGIS_COOKIE_SECURE=false',
  '',
].join('\n');
await writeFile(new URL('../.env.local', import.meta.url), content, { mode: 0o600 });
console.log('Local organization identities configured:');
for (const [username, , title] of profiles) console.log(`- ${username} (${title})`);
console.log(`Shared local acceptance password: ${password}`);
console.log('Restart the web application before signing in.');
