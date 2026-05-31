import { NextResponse } from 'next/server';

import { requireAccessApi } from '@/lib/auth/access-token';
import { getDestinationEventsBucket } from '@/lib/sessions/cloudflare';
import { getSessionSummariesFromR2 } from '@/lib/sessions/r2-store';

export async function GET(): Promise<NextResponse> {
  const unauthorized = await requireAccessApi();
  if (unauthorized) return unauthorized;

  const bucket = getDestinationEventsBucket();
  const summaries = await getSessionSummariesFromR2(bucket);

  return NextResponse.json({ data: summaries });
}
