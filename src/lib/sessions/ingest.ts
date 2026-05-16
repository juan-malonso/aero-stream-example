import { SessionEventType, type SessionEventEnvelope, SUPPORTED_EVENT_TYPES } from './types.ts';

interface ParseResultOk {
  ok: true;
  event: SessionEventEnvelope;
}

interface ParseResultError {
  ok: false;
  error: string;
  status: 400 | 422;
}

export type ParseSessionEventResult = ParseResultOk | ParseResultError;

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

function normalizeLegacyEventType(type: string): string {
  const aliases: Record<string, SessionEventType> = {
    SESSION_CREATED: SessionEventType.SESSION_CREATE,
    ALERT_RESPONDED: SessionEventType.ALERT_SUBMITTED,
    TAILING_STEP: SessionEventType.TAILING_RENDERED,
    TAILING_END: SessionEventType.TAILING_CLOSED,
  };

  return aliases[type] ?? type;
}

export function parseSessionEvent(body: unknown): ParseSessionEventResult {
  if (!isValidEnvelope(body)) {
    return { ok: false, error: 'Invalid event envelope structure', status: 400 };
  }

  const normalizedType = normalizeLegacyEventType(body.type);
  if (!SUPPORTED_EVENT_TYPES.has(normalizedType)) {
    return { ok: false, error: `Unsupported event type: ${body.type}`, status: 422 };
  }

  return {
    ok: true,
    event: { ...body, type: normalizedType as SessionEventEnvelope['type'] },
  };
}
