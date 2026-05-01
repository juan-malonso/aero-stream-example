import type { ConnectionGroup, PlatformEventEnvelope, PlatformSession, PlatformSessionSummary } from './types';
import { PlatformEventType } from './types';

/**
 * Process-level singleton for platform event storage.
 * Uses the globalThis pattern to survive Next.js hot-reload in development.
 * Data is intentionally volatile — lost on process restart.
 */

const STORE_KEY = '__aerostream_platform_store__' as const;

interface StoredSession {
  sessionId: string;
  workflowId: string;
  createdAt: string;
  lastActivityAt: string;
  eventCount: number;
  events: PlatformEventEnvelope[];
}

interface GlobalWithStore {
  [STORE_KEY]?: Map<string, StoredSession>;
}

function getStore(): Map<string, StoredSession> {
  const globalRef = globalThis as unknown as GlobalWithStore;
  if (!globalRef[STORE_KEY]) {
    globalRef[STORE_KEY] = new Map<string, StoredSession>();
  }
  return globalRef[STORE_KEY];
}

function deriveConnectionGroups(events: PlatformEventEnvelope[]): ConnectionGroup[] {
  const groupMap = new Map<string, ConnectionGroup>();

  for (const event of events) {
    if (!event.connectionId) continue;

    if (!groupMap.has(event.connectionId)) {
      groupMap.set(event.connectionId, {
        connectionId: event.connectionId,
        connectedAt: event.occurredAt,
        device: null,
        events: [],
      });
    }

    const group = groupMap.get(event.connectionId)!;
    group.events.push(event);

    if (event.type === PlatformEventType.SESSION_CONNECTED) {
      group.connectedAt = event.occurredAt;
      group.device = (event.payload.device as Record<string, unknown> | null) ?? null;
    }
  }

  return Array.from(groupMap.values());
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
  const session = store.get(sessionId);
  if (!session) return null;

  return {
    ...session,
    connections: deriveConnectionGroups(session.events),
  };
}
