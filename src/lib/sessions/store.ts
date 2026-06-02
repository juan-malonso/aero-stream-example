import type {
  ConnectionGroup,
  PipeMetrics,
  Session,
  SessionEventEnvelope,
  SessionResult,
  SessionStatus,
  SessionSummary,
} from './types.ts';
import { SessionEventType } from './types.ts';

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

export function emptyPipeMetrics(): PipeMetrics {
  return {
    'browser.memory_used_bytes': [],
    'pipe.encrypted_bytes': [],
    'pipe.latency_ms': [],
    'pipe.message_count': [],
  };
}

export function deriveConnectionGroups(
  events: SessionEventEnvelope[],
  metricsByConnectionId: Record<string, PipeMetrics> = {},
): ConnectionGroup[] {
  const groupMap = new Map<string, ConnectionGroup>();

  for (const event of events) {
    if (!event.connectionId) continue;

    if (!groupMap.has(event.connectionId)) {
      groupMap.set(event.connectionId, {
        connectionId: event.connectionId,
        connectedAt: event.occurredAt,
        device: null,
        events: [],
        metrics: metricsByConnectionId[event.connectionId] ?? emptyPipeMetrics(),
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

function buildSessionsFromEvents(events: SessionEventEnvelope[]): Map<string, StoredSession> {
  const store = new Map<string, StoredSession>();

  for (const event of events) {
    const existing = store.get(event.sessionId);
    if (existing) {
      existing.events.push(event);
      existing.lastActivityAt = event.occurredAt;
      existing.eventCount = existing.events.length;

      if (event.type === SessionEventType.SESSION_RESULT) {
        existing.status = 'FINISHED';
        existing.result = event.payload as unknown as SessionResult;
      }
      continue;
    }

    store.set(event.sessionId, {
      sessionId: event.sessionId,
      workflowId: event.workflowId,
      createdAt: event.occurredAt,
      lastActivityAt: event.occurredAt,
      eventCount: 1,
      status: event.type === SessionEventType.SESSION_RESULT ? 'FINISHED' : 'ACTIVE',
      result: event.type === SessionEventType.SESSION_RESULT ? event.payload as unknown as SessionResult : undefined,
      events: [event],
    });
  }

  return store;
}

function summariesFromStore(store: Map<string, StoredSession>): SessionSummary[] {
  const summaries: SessionSummary[] = [];

  store.forEach((session) => {
    summaries.push({
      sessionId: session.sessionId,
      workflowId: session.workflowId,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      eventCount: session.eventCount,
      status: session.status,
      result: session.result,
    });
  });

  return summaries.sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
  );
}

export function getSessionSummariesFromEvents(events: SessionEventEnvelope[]): SessionSummary[] {
  return summariesFromStore(buildSessionsFromEvents(events));
}

export function getSessionDetailFromEvents(
  events: SessionEventEnvelope[],
  sessionId: string,
  metricsByConnectionId: Record<string, PipeMetrics> = {},
): Session | null {
  const session = buildSessionsFromEvents(events).get(sessionId);
  if (!session) return null;

  return {
    ...session,
    connections: deriveConnectionGroups(session.events, metricsByConnectionId),
  };
}
