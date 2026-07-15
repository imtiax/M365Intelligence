import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let authenticated = false;
  if (token) {
    try { await verifySession(token); authenticated = true; } catch { authenticated = false; }
  }

  if (request.nextUrl.pathname === '/login') {
    if (authenticated) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }
  if (!authenticated) {
    const login = new URL('/login', request.url);
    login.searchParams.set('returnTo', request.nextUrl.pathname);
    const response = NextResponse.redirect(login);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};

