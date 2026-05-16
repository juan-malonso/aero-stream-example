import type {
  ConnectionGroup,
  SessionEventEnvelope,
  Session,
  SessionResult,
  SessionStatus,
  SessionSummary,
} from './types.ts';
import { SessionEventType } from './types.ts';

/**
 * Process-level singleton for session event storage.
 * Uses the globalThis pattern to survive Next.js hot-reload in development.
 * Data is intentionally volatile — lost on process restart.
 */

const STORE_KEY = '__aerostream_sessions_store__' as const;

interface StoredSession {
  sessionId: string;
  workflowId: string;
  createdAt: string;
  lastActivityAt: string;
  eventCount: number;
  status: SessionStatus;
  result?: SessionResult;
  events: SessionEventEnvelope[];
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

function deriveConnectionGroups(events: SessionEventEnvelope[]): ConnectionGroup[] {
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

    if (event.type === SessionEventType.SESSION_CONNECTED) {
      group.connectedAt = event.occurredAt;
      group.device = (event.payload.device as Record<string, unknown> | null) ?? null;
    }

    if (event.type === SessionEventType.SESSION_REQUESTED && !group.device) {
      group.device = (event.payload.device as Record<string, unknown> | null) ?? null;
    }
  }

  return Array.from(groupMap.values());
}

export function addEvent(event: SessionEventEnvelope): void {
  const store = getStore();
  const existing = store.get(event.sessionId);

  if (existing) {
    existing.events.push(event);
    existing.lastActivityAt = event.occurredAt;
    existing.eventCount = existing.events.length;

    if (event.type === SessionEventType.SESSION_RESULT) {
      existing.status = 'FINISHED';
      existing.result = event.payload as unknown as SessionResult;
    }
  } else {
    store.set(event.sessionId, {
      sessionId: event.sessionId,
      workflowId: event.workflowId,
      createdAt: event.occurredAt,
      lastActivityAt: event.occurredAt,
      eventCount: 1,
      status: 'ACTIVE',
      events: [event],
    });
  }
}

export function getSessionSummaries(): SessionSummary[] {
  const store = getStore();
  const summaries: SessionSummary[] = [];

  store.forEach((session) => {
    summaries.push({
      sessionId: session.sessionId,
      workflowId: session.workflowId,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      eventCount: session.eventCount,
      status: session.status ?? 'ACTIVE',
      result: session.result,
    });
  });

  return summaries.sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
  );
}

export function getSessionDetail(sessionId: string): Session | null {
  const store = getStore();
  const session = store.get(sessionId);
  if (!session) return null;

  return {
    ...session,
    status: session.status ?? 'ACTIVE',
    connections: deriveConnectionGroups(session.events),
  };
}

export function clearSessionsForTest(): void {
  getStore().clear();
}
