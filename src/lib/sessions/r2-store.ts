import { getSessionDetailFromEvents, getSessionSummariesFromEvents } from './store.ts';
import type { Session, SessionEventEnvelope, SessionSummary } from './types.ts';

const EVENT_PREFIX = 'events/';
const LIST_LIMIT = 1000;

interface R2ListObject {
  key: string;
}

interface R2ListResult {
  objects: R2ListObject[];
  truncated: boolean;
  cursor?: string;
}

export interface SessionsEventBucket {
  put(
    key: string,
    value: string,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<{ json<T>(): Promise<T> } | null>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2ListResult>;
}

function safeKeyPart(value: string): string {
  return encodeURIComponent(value).replaceAll('%', '~');
}

function eventKey(event: SessionEventEnvelope): string {
  const occurredAtDate = new Date(event.occurredAt);
  const occurredAt = Number.isNaN(occurredAtDate.getTime())
    ? safeKeyPart(event.occurredAt)
    : occurredAtDate.toISOString().replaceAll(':', '-');
  return `${EVENT_PREFIX}${safeKeyPart(event.sessionId)}/${occurredAt}-${safeKeyPart(event.eventId)}.json`;
}

export async function addEventToR2(bucket: SessionsEventBucket, event: SessionEventEnvelope): Promise<void> {
  await bucket.put(eventKey(event), JSON.stringify(event), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: {
      sessionId: event.sessionId,
      workflowId: event.workflowId,
      eventId: event.eventId,
      type: event.type,
      occurredAt: event.occurredAt,
    },
  });
}

async function listEventKeys(bucket: SessionsEventBucket, sessionId?: string): Promise<string[]> {
  const prefix = sessionId ? `${EVENT_PREFIX}${safeKeyPart(sessionId)}/` : EVENT_PREFIX;
  const keys: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await bucket.list({ prefix, limit: LIST_LIMIT, cursor });
    keys.push(...result.objects.map((object) => object.key));
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return keys;
}

export async function getEventsFromR2(bucket: SessionsEventBucket, sessionId?: string): Promise<SessionEventEnvelope[]> {
  const keys = await listEventKeys(bucket, sessionId);
  const events: SessionEventEnvelope[] = [];

  for (const key of keys) {
    const object = await bucket.get(key);
    if (!object) continue;
    events.push(await object.json<SessionEventEnvelope>());
  }

  return events.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
}

export async function getSessionSummariesFromR2(bucket: SessionsEventBucket): Promise<SessionSummary[]> {
  return getSessionSummariesFromEvents(await getEventsFromR2(bucket));
}

export async function getSessionDetailFromR2(bucket: SessionsEventBucket, sessionId: string): Promise<Session | null> {
  return getSessionDetailFromEvents(await getEventsFromR2(bucket, sessionId), sessionId);
}
