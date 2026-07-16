import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicLanding =
    pathname === '/landing' ||
    pathname.startsWith('/landing/');

  if (isPublicLanding) {
    const response = NextResponse.next();
    if (pathname === '/landing/demo' || pathname.startsWith('/landing/demo/')) {
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    }
    return response;
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let session = null;
  if (token) {
    try { session = await verifySession(token); } catch { session = null; }
  }

  if (pathname === '/login') {
    if (session?.sessionType === 'public-demo') return NextResponse.redirect(new URL('/demo/workspace', request.url));
    if (session) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  if (pathname === '/demo/workspace' || pathname.startsWith('/demo/workspace/')) {
    if (session?.sessionType === 'public-demo') {
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'private, no-store, max-age=0');
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return response;
    }
    if (session) return NextResponse.redirect(new URL('/', request.url));
    const launcher = NextResponse.redirect(new URL('/landing/demo', request.url));
    if (token) launcher.cookies.delete(SESSION_COOKIE);
    return launcher;
  }

  if (!session) {
    const login = new URL('/login', request.url);
    login.searchParams.set('returnTo', pathname);
    const response = NextResponse.redirect(login);
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (session.sessionType === 'public-demo') {
    return NextResponse.redirect(new URL('/demo/workspace', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}

export const config = {
  matcher: ['/((?!api/auth|api/runtime|api/public-demo|_next/static|_next/image|favicon.ico).*)'],
};
