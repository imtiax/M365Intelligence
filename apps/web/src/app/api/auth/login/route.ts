import { NextRequest, NextResponse } from 'next/server';
import { createSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/lib/session';
import { verifyConfiguredPassword } from '@/lib/password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').map((value) => value.trim()).filter(Boolean);
  // The trusted reverse proxy appends the immediate client address; use the right-most value to prevent caller prefix spoofing.
  return forwarded?.at(-1) || request.headers.get('x-real-ip') || 'local-client';
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('host');
  if (!host) return false;
  const publicOrigin = `${request.nextUrl.protocol}//${host}`;
  return origin === request.nextUrl.origin || origin === publicOrigin;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  const key = clientKey(request);
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  let credentials: { username?: unknown; password?: unknown };
  try { credentials = await request.json(); } catch { return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 }); }
  if (typeof credentials.username !== 'string' || typeof credentials.password !== 'string') return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });

  let valid = false;
  try { valid = await verifyConfiguredPassword(credentials.username, credentials.password); }
  catch { return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 }); }

  if (!valid) {
    const active = current && current.resetAt > now ? current : { count: 0, resetAt: now + WINDOW_MS };
    active.count += 1;
    attempts.set(key, active);
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  attempts.delete(key);
  const token = await createSession(credentials.username);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'strict', secure: process.env.AEGIS_COOKIE_SECURE !== 'false', path: '/', maxAge: SESSION_TTL_SECONDS,
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
