import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const publicOrigin = host ? `${request.nextUrl.protocol}//${host}` : '';
  if (origin && origin !== request.nextUrl.origin && origin !== publicOrigin) return NextResponse.json({ error: 'Request rejected.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'strict', secure: process.env.AEGIS_COOKIE_SECURE !== 'false', path: '/', maxAge: 0 });
  response.headers.set('Clear-Site-Data', '"cache"');
  return response;
}
