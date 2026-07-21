import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  return !!host && (origin === request.nextUrl.origin || origin === `${request.nextUrl.protocol}//${host}`);
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request)) {
    return NextResponse.json({ message: "Cross-origin operation rejected." }, { status: 403 });
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

  let session;
  try { session = await verifySession(token); }
  catch { return NextResponse.json({ message: "Session is invalid or expired." }, { status: 401 }); }

  const secret = process.env.AEGIS_INTERNAL_API_SECRET;
  if (!secret || secret.length < 43) return NextResponse.json({ message: "Internal API trust is not configured." }, { status: 503 });
  const identity = Buffer.from(JSON.stringify({
    tenantId: session.tenantId,
    actorId: session.sub,
    roles: session.roles,
    sessionType: session.sessionType,
    issuedAt: Date.now(),
    nonce: randomUUID(),
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(identity).digest("base64url");
  const { path } = await context.params;
  const base = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:3001";
  const target = new URL(`/${path.join("/")}`, base);
  target.search = request.nextUrl.search;
  const correlationId = request.headers.get("x-correlation-id") ?? randomUUID();
  const upstream = await fetch(target, {
    method: request.method,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/json",
      "x-aegis-identity": identity,
      "x-aegis-signature": signature,
      "x-correlation-id": correlationId,
    },
    cache: "no-store",
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "private, no-store",
      "x-correlation-id": upstream.headers.get("x-correlation-id") ?? correlationId,
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
