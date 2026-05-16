import { NextResponse } from 'next/server';

import { addEvent } from '../../../../lib/sessions/store';
import { parseSessionEvent } from '../../../../lib/sessions/ingest';

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

  addEvent(parsed.event);

  return NextResponse.json({ received: true }, { status: 200 });
}
