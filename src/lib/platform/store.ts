import type { PlatformEventEnvelope, PlatformSession, PlatformSessionSummary } from './types';

/**
 * Process-level singleton for platform event storage.
 * Uses the globalThis pattern to survive Next.js hot-reload in development.
 * Data is intentionally volatile — lost on process restart.
 */

const STORE_KEY = '__aerostream_platform_store__' as const;

interface GlobalWithStore {
  [STORE_KEY]?: Map<string, PlatformSession>;
}

function getStore(): Map<string, PlatformSession> {
  const globalRef = globalThis as unknown as GlobalWithStore;
  if (!globalRef[STORE_KEY]) {
    globalRef[STORE_KEY] = new Map<string, PlatformSession>();
  }
  return globalRef[STORE_KEY];
}

export function addEvent(event: PlatformEventEnvelope): void {
  const store = getStore();
  const existing = store.get(event.sessionId);

  if (existing) {
    existing.events.push(event);
    existing.lastActivityAt = event.occurredAt;
    existing.eventCount = existing.events.length;
  } else {
    store.set(event.sessionId, {
      sessionId: event.sessionId,
      workflowId: event.workflowId,
      createdAt: event.occurredAt,
      lastActivityAt: event.occurredAt,
      eventCount: 1,
      events: [event],
    });
  }
}

export function getSessionSummaries(): PlatformSessionSummary[] {
  const store = getStore();
  const summaries: PlatformSessionSummary[] = [];

  store.forEach((session) => {
    summaries.push({
      sessionId: session.sessionId,
      workflowId: session.workflowId,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      eventCount: session.eventCount,
    });
  });

  return summaries.sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
  );
}

export function getSessionDetail(sessionId: string): PlatformSession | null {
  const store = getStore();
  return store.get(sessionId) ?? null;
}
