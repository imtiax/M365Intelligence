import { NextRequest, NextResponse } from "next/server";
import { listConfiguredIdentities } from "@/lib/password";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  try {
    const session = await verifySession(token);
    if (!session.roles.includes("platform-admin")) return NextResponse.json({ message: "Platform administrator role required." }, { status: 403 });
    return NextResponse.json({ items: listConfiguredIdentities() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ message: "Session is invalid or expired." }, { status: 401 });
  }
}
