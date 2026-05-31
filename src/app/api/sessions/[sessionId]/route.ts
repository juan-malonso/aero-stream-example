import { NextResponse } from 'next/server';

import { getDestinationEventsBucket } from '@/lib/sessions/cloudflare';
import { getSessionDetailFromR2 } from '@/lib/sessions/r2-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await params;
  const bucket = getDestinationEventsBucket();
  const session = await getSessionDetailFromR2(bucket, sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ data: session });
}
