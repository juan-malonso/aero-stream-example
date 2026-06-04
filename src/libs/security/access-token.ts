import { getCloudflareContext } from '@opennextjs/cloudflare';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export const ACCESS_COOKIE_NAME = 'aerostream_access_token';

const DEPLOY_COOKIE_DOMAIN = '.aerostream.deploy.men';
const DEPLOY_HOST_SUFFIX = 'aerostream.deploy.men';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

interface AccessEnv {
  AEROSTREAM_ACCESS_TOKEN?: string;
  AUTH_COOKIE_DOMAIN?: string;
  ENVIRONMENT?: string;
  NODE_ENV?: string;
}

function getRuntimeEnv(): AccessEnv {
  try {
    return {
      ...process.env,
      ...(getCloudflareContext().env as AccessEnv),
    };
  } catch {
    return process.env;
  }
}

function getConfiguredAccessToken(): string {
  const env = getRuntimeEnv();
  const token = env.AEROSTREAM_ACCESS_TOKEN?.trim();
  if (token) return token;

  throw new Error('AEROSTREAM_ACCESS_TOKEN is required');
}

function timingSafeEqual(actual: string | undefined, expected: string): boolean {
  const encoder = new TextEncoder();
  const actualBytes = encoder.encode(actual ?? '');
  const expectedBytes = encoder.encode(expected);
  let difference = actualBytes.length ^ expectedBytes.length;
  const length = Math.max(actualBytes.length, expectedBytes.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (actualBytes[index] ?? 0) ^ (expectedBytes[index] ?? 0);
  }

  return difference === 0;
}

export function isValidAccessToken(token: string | undefined): boolean {
  return timingSafeEqual(token, getConfiguredAccessToken());
}

export async function hasValidAccessCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidAccessToken(cookieStore.get(ACCESS_COOKIE_NAME)?.value);
}

export async function requireAccessPage(): Promise<void> {
  if (!(await hasValidAccessCookie())) {
    redirect('/login');
  }
}

export async function requireAccessApi(): Promise<NextResponse | undefined> {
  return (await hasValidAccessCookie()) ? null : new NextResponse(null, { status: 401 });
}

export function resolveAccessCookieDomain(request: Request): string | undefined {
  const configuredDomain = getRuntimeEnv().AUTH_COOKIE_DOMAIN?.trim();
  if (configuredDomain) return configuredDomain;

  const hostname = new URL(request.url).hostname;
  return hostname === DEPLOY_HOST_SUFFIX || hostname.endsWith(`.${DEPLOY_HOST_SUFFIX}`)
    ? DEPLOY_COOKIE_DOMAIN
    : undefined;
}

export function isSecureCookieRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === 'https:' && !LOCAL_HOSTNAMES.has(url.hostname);
}
