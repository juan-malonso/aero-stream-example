import { NextResponse } from 'next/server';

import {
  ACCESS_COOKIE_NAME,
  isSecureCookieRequest,
  isValidAccessToken,
  resolveAccessCookieDomain,
} from '@/libs/security/access-token';

const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

async function readToken(request: Request): Promise<string | undefined> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await request.json() as { token?: unknown };
    return typeof body.token === 'string' ? body.token : undefined;
  }

  const form = await request.formData();
  const token = form.get('token');
  return typeof token === 'string' ? token : undefined;
}

export async function POST(request: Request): Promise<NextResponse> {
  let token: string | undefined;

  try {
    token = await readToken(request);
  } catch {
    return new NextResponse(null, { status: 401 });
  }

  if (!token || !isValidAccessToken(token)) {
    return new NextResponse(null, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  const cookieOptions: {
    domain?: string;
    httpOnly: boolean;
    maxAge: number;
    name: string;
    path: string;
    sameSite: 'lax';
    secure: boolean;
    value: string;
  } = {
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    secure: isSecureCookieRequest(request),
    path: '/',
  };
  const domain = resolveAccessCookieDomain(request);
  if (domain) cookieOptions.domain = domain;
  response.cookies.set(cookieOptions);

  return response;
}
