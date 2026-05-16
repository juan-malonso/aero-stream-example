import { addEvent } from '@/lib/sessions/store';
import { type SessionEventEnvelope, SUPPORTED_EVENT_TYPES } from '@/lib/sessions/types';
import { NextResponse } from 'next/server';

function isValidEnvelope(body: unknown): body is SessionEventEnvelope {
  if (typeof body !== 'object' || body === null) return false;

  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.eventId === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.occurredAt === 'string' &&
    typeof candidate.sessionId === 'string' &&
    typeof candidate.workflowId === 'string' &&
    typeof candidate.source === 'string' &&
    typeof candidate.payload === 'object' &&
    candidate.payload !== null
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isValidEnvelope(body)) {
    return NextResponse.json({ error: 'Invalid event envelope structure' }, { status: 400 });
  }

  if (!SUPPORTED_EVENT_TYPES.has(body.type)) {
    return NextResponse.json(
      { error: `Unsupported event type: ${body.type}` },
      { status: 422 },
    );
  }

  addEvent(body);

  return NextResponse.json({ received: true }, { status: 200 });
}
