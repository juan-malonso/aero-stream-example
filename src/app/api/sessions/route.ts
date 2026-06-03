import { NextResponse } from 'next/server';

import { requireAccessApi } from '@/libs/security/access-token';
import { getDestinationEventsBucket } from '@/modules/aero-stream-tracker/lib/sessions/event-bucket';
import { getSessionSummariesFromR2 } from '@/modules/aero-stream-tracker/lib/sessions/r2-store';

export async function GET(): Promise<NextResponse> {
  const unauthorized = await requireAccessApi();
  if (unauthorized) return unauthorized;

  const bucket = getDestinationEventsBucket();
  const summaries = await getSessionSummariesFromR2(bucket);

  return NextResponse.json({ data: summaries });
}
