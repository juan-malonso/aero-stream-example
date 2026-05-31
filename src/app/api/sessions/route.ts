import { NextResponse } from 'next/server';

import { getDestinationEventsBucket } from '@/lib/sessions/cloudflare';
import { getSessionSummariesFromR2 } from '@/lib/sessions/r2-store';

export async function GET(): Promise<NextResponse> {
  const bucket = getDestinationEventsBucket();
  const summaries = await getSessionSummariesFromR2(bucket);

  return NextResponse.json({ data: summaries });
}
