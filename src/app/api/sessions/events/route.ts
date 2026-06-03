import { NextResponse } from 'next/server';

import { getDestinationEventsBucket } from '@/modules/aero-stream-tracker/lib/sessions/event-bucket';
import { parseSessionEvent } from '@/modules/aero-stream-tracker/lib/sessions/ingest';
import { addEventToR2 } from '@/modules/aero-stream-tracker/lib/sessions/r2-store';

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseSessionEvent(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const bucket = getDestinationEventsBucket();
  await addEventToR2(bucket, parsed.event);

  return NextResponse.json({ received: true }, { status: 200 });
}
