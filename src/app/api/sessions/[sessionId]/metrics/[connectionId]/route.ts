import { NextResponse } from 'next/server';

import { requireAccessApi } from '@/lib/auth/access-token';
import { parsePipeMetrics } from '@/lib/sessions/r2-store';
import { emptyPipeMetrics } from '@/lib/sessions/store';
import { getControllerApiUrl } from '@/lib/shared/config/workerEndpoints';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ connectionId: string; sessionId: string }> },
): Promise<NextResponse> {
  const unauthorized = await requireAccessApi();
  if (unauthorized) return unauthorized;

  const { connectionId, sessionId } = await params;
  const resourcePath = [
    encodeURIComponent(sessionId),
    encodeURIComponent(connectionId),
    'metrics.json',
  ].join('/');
  const headers = buildForwardedHeaders(request);
  const signedUrlResponse = await fetch(`${getControllerApiUrl()}/resources/${resourcePath}`, { headers });

  if (signedUrlResponse.status === 404) {
    return NextResponse.json({ data: emptyPipeMetrics() });
  }

  if (!signedUrlResponse.ok) {
    return NextResponse.json({ error: 'Unable to resolve metrics resource' }, { status: signedUrlResponse.status });
  }

  const signedUrlJson = await signedUrlResponse.json() as { url?: string };
  if (typeof signedUrlJson.url !== 'string') {
    return NextResponse.json({ error: 'Invalid metrics resource response' }, { status: 502 });
  }

  const metricsResponse = await fetch(signedUrlJson.url);
  if (metricsResponse.status === 404) {
    return NextResponse.json({ data: emptyPipeMetrics() });
  }

  if (!metricsResponse.ok) {
    return NextResponse.json({ error: 'Unable to fetch metrics resource' }, { status: metricsResponse.status });
  }

  const metrics = parsePipeMetrics(await metricsResponse.json());
  return NextResponse.json({ data: metrics ?? emptyPipeMetrics() });
}

function buildForwardedHeaders(request: Request): HeadersInit | undefined {
  const cookie = request.headers.get('cookie');
  return cookie ? { Cookie: cookie } : undefined;
}
