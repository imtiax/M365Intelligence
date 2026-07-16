import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const session = await verifySession(token);
    return NextResponse.json({
      username: session.sub,
      name: session.name,
      title: session.title,
      tenantId: session.tenantId,
      roles: session.roles,
      sessionType: session.sessionType,
      demoSessionId: session.demoSessionId,
      demoPersona: session.demoPersona,
      demoMode: session.demoMode,
      expiresAt: typeof session.exp === "number" ? session.exp * 1000 : undefined,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
