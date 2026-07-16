import { NextRequest, NextResponse } from 'next/server';
import {
  createPublicDemoSession,
  PUBLIC_DEMO_SESSION_TTL_SECONDS,
  publicDemoPersonas,
  SESSION_COOKIE,
  type PublicDemoMode,
  type PublicDemoPersona,
} from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_STARTS = 12;

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('host');
  if (!host) return false;
  return origin === request.nextUrl.origin || origin === `${request.nextUrl.protocol}//${host}`;
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').map((value) => value.trim()).filter(Boolean);
  return forwarded?.at(-1) || request.headers.get('x-real-ip') || 'local-demo-client';
}

function disabled() {
  return NextResponse.json(
    { code: 'public_demo_disabled', message: 'The public demo is not enabled on this deployment.' },
    { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } },
  );
}

export async function GET() {
  if (process.env.AEGIS_PUBLIC_DEMO_ENABLED !== 'true') return disabled();
  return NextResponse.json(
    {
      enabled: true,
      personas: publicDemoPersonas,
      expiresIn: PUBLIC_DEMO_SESSION_TTL_SECONDS,
      dataClassification: 'synthetic',
    },
    { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } },
  );
}

export async function POST(request: NextRequest) {
  if (process.env.AEGIS_PUBLIC_DEMO_ENABLED !== 'true') return disabled();
  if (!sameOrigin(request)) {
    return NextResponse.json({ code: 'cross_origin_rejected', message: 'Request rejected.' }, { status: 403 });
  }

  const key = clientKey(request);
  const now = Date.now();
  if (attempts.size > 2_000) {
    for (const [candidate, value] of attempts) {
      if (value.resetAt <= now) attempts.delete(candidate);
    }
    while (attempts.size > 2_000) attempts.delete(attempts.keys().next().value!);
  }
  const current = attempts.get(key);
  if (current && current.resetAt > now && current.count >= MAX_STARTS) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return NextResponse.json(
      { code: 'demo_start_rate_limited', message: 'Too many demo starts. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' } },
    );
  }

  let payload: { persona?: unknown; mode?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ code: 'invalid_demo_request', message: 'Choose a valid demo perspective.' }, { status: 400 });
  }

  if (!publicDemoPersonas.includes(payload.persona as PublicDemoPersona)) {
    return NextResponse.json({ code: 'invalid_demo_persona', message: 'Choose a valid demo perspective.' }, { status: 400 });
  }
  if (payload.mode !== 'guided' && payload.mode !== 'free') {
    return NextResponse.json({ code: 'invalid_demo_mode', message: 'Choose guided tour or free exploration.' }, { status: 400 });
  }

  const active = current && current.resetAt > now ? current : { count: 0, resetAt: now + WINDOW_MS };
  active.count += 1;
  attempts.set(key, active);

  const persona = payload.persona as PublicDemoPersona;
  const mode = payload.mode as PublicDemoMode;
  const { token, demoSessionId } = await createPublicDemoSession(persona, mode);
  const response = NextResponse.json({
    ok: true,
    redirectTo: '/demo/workspace#command-center',
    expiresIn: PUBLIC_DEMO_SESSION_TTL_SECONDS,
    session: { id: demoSessionId, persona, mode, dataClassification: 'synthetic' },
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.AEGIS_COOKIE_SECURE !== 'false',
    path: '/',
    maxAge: PUBLIC_DEMO_SESSION_TTL_SECONDS,
  });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
