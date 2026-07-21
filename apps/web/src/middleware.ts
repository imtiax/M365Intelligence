import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let session = null;
  if (token) {
    try { session = await verifySession(token); } catch { session = null; }
  }

  if (pathname === '/login') {
    if (session) return NextResponse.redirect(new URL('/portal', request.url));
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL('/login', request.url);
    login.searchParams.set('returnTo', pathname);
    const response = NextResponse.redirect(login);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}

export const config = {
  matcher: ['/((?!api/auth|api/runtime|_next/static|_next/image|favicon.ico).*)'],
};
