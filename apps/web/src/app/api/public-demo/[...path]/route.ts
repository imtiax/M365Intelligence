import { createHmac, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RateWindow = { reads: number; writes: number; resetAt: number };
const rateWindows = new Map<string, RateWindow>();
const WINDOW_MS = 60_000;
const MAX_READS = 180;
const MAX_WRITES = 24;
const MAX_BODY_BYTES = 64 * 1024;

const allowedReads = [
  /^bootstrap$/,
  /^module\/[a-zA-Z0-9._@%+-]{1,160}$/,
];
const allowedPosts = new Set(['report-preview', 'scenario', 'reset']);

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('host');
  return !!host && (origin === request.nextUrl.origin || origin === `${request.nextUrl.protocol}//${host}`);
}

function reject(status: number, code: string, message: string, headers?: Record<string, string>) {
  return NextResponse.json({ code, message }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...headers },
  });
}

function checkRate(sessionId: string, method: string) {
  const now = Date.now();
  if (rateWindows.size > 2_000) {
    for (const [candidate, value] of rateWindows) {
      if (value.resetAt <= now) rateWindows.delete(candidate);
    }
    while (rateWindows.size > 2_000) rateWindows.delete(rateWindows.keys().next().value!);
  }
  const current = rateWindows.get(sessionId);
  const active = current && current.resetAt > now
    ? current
    : { reads: 0, writes: 0, resetAt: now + WINDOW_MS };
  if (method === 'GET') active.reads += 1;
  else active.writes += 1;
  rateWindows.set(sessionId, active);
  const exceeded = method === 'GET' ? active.reads > MAX_READS : active.writes > MAX_WRITES;
  return exceeded ? Math.ceil((active.resetAt - now) / 1000) : 0;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (process.env.AEGIS_PUBLIC_DEMO_ENABLED !== 'true') {
    return reject(404, 'public_demo_disabled', 'The public demo is not enabled on this deployment.');
  }
  if (!['GET', 'POST'].includes(request.method)) {
    return reject(405, 'public_demo_method_denied', 'This method is not available in the public demo.', { Allow: 'GET, POST' });
  }
  if (request.method === 'POST' && !sameOrigin(request)) {
    return reject(403, 'cross_origin_rejected', 'Cross-origin operation rejected.');
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return reject(401, 'demo_session_required', 'Start a public demo session first.');
  let session;
  try {
    session = await verifySession(token);
  } catch {
    return reject(401, 'demo_session_expired', 'The public demo session is invalid or expired.');
  }
  if (session.sessionType !== 'public-demo' || !session.demoSessionId || !session.demoPersona) {
    return reject(403, 'public_demo_session_required', 'This endpoint is reserved for isolated public demo sessions.');
  }

  const { path } = await context.params;
  const route = path.join('/');
  const moduleId = path[0] === 'module' && path.length === 2 ? path[1] : null;
  if (moduleId) {
    let decoded = moduleId;
    try { decoded = decodeURIComponent(moduleId); } catch { return reject(400, 'invalid_public_demo_module', 'The demo module identifier is invalid.'); }
    if (decoded === '.' || decoded === '..' || decoded.includes('/') || decoded.includes('\\')) {
      return reject(400, 'invalid_public_demo_module', 'The demo module identifier is invalid.');
    }
  }
  const allowed = request.method === 'GET'
    ? allowedReads.some((pattern) => pattern.test(route))
    : allowedPosts.has(route);
  if (!allowed) return reject(403, 'public_demo_route_denied', 'This route is outside the public demo allowlist.');

  const retryAfter = checkRate(session.demoSessionId, request.method);
  if (retryAfter) return reject(429, 'public_demo_rate_limited', 'Demo request limit reached. Try again shortly.', { 'Retry-After': String(retryAfter) });

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return reject(413, 'public_demo_payload_too_large', 'The demo request is too large.');
  const body = request.method === 'POST' ? await request.arrayBuffer() : undefined;
  if (body && body.byteLength > MAX_BODY_BYTES) return reject(413, 'public_demo_payload_too_large', 'The demo request is too large.');

  const secret = process.env.AEGIS_INTERNAL_API_SECRET;
  if (!secret || secret.length < 43) return reject(503, 'internal_trust_unavailable', 'Public demo trust is not configured.');
  const identity = Buffer.from(JSON.stringify({
    tenantId: session.tenantId,
    actorId: session.sub,
    roles: session.roles,
    sessionType: session.sessionType,
    demoSessionId: session.demoSessionId,
    demoPersona: session.demoPersona,
    issuedAt: Date.now(),
    nonce: randomUUID(),
  })).toString('base64url');
  const signature = createHmac('sha256', secret).update(identity).digest('base64url');
  const base = process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:3001';
  const upstreamRoute = moduleId ? `module/${encodeURIComponent(moduleId)}` : route;
  const target = new URL(`/api/v1/public-demo/${upstreamRoute}`, base);
  target.search = request.nextUrl.search;
  const correlationId = request.headers.get('x-correlation-id') ?? randomUUID();

  try {
    const upstream = await fetch(target, {
      method: request.method,
      body,
      headers: {
        'content-type': request.headers.get('content-type') ?? 'application/json',
        'x-aegis-identity': identity,
        'x-aegis-signature': signature,
        'x-correlation-id': correlationId,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        'cache-control': 'private, no-store',
        'x-robots-tag': 'noindex, nofollow',
        'x-correlation-id': upstream.headers.get('x-correlation-id') ?? correlationId,
      },
    });
  } catch {
    return reject(503, 'public_demo_runtime_unavailable', 'The synthetic demo runtime is temporarily unavailable.');
  }
}

export const GET = proxy;
export const POST = proxy;
