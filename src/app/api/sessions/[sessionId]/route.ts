import { NextResponse } from 'next/server';

import { requireAccessApi } from '@/libs/security/access-token';
import { getDestinationEventsBucket } from '@/modules/aero-stream-tracker/lib/sessions/event-bucket';
import { getSessionDetailFromR2 } from '@/modules/aero-stream-tracker/lib/sessions/r2-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const unauthorized = await requireAccessApi();
  if (unauthorized) return unauthorized;

  const { sessionId } = await params;
  const bucket = getDestinationEventsBucket();
  const session = await getSessionDetailFromR2(bucket, sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ data: session });
}
