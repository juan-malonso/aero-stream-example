import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSessionDetailFromEvents,
  getSessionSummariesFromEvents,
} from './store.ts';
import { type SessionEventEnvelope, SessionEventType } from './types.ts';

function event(overrides: Partial<SessionEventEnvelope> = {}): SessionEventEnvelope {
  return {
    eventId: overrides.eventId ?? 'event-1',
    type: overrides.type ?? SessionEventType.SESSION_CREATE,
    occurredAt: overrides.occurredAt ?? '2026-05-16T00:00:00.000Z',
    sessionId: overrides.sessionId ?? 'session-1',
    workflowId: overrides.workflowId ?? 'workflow-1',
    connectionId: overrides.connectionId,
    source: overrides.source ?? 'tower',
    payload: overrides.payload ?? {},
  };
}

test('derives summaries and detail review from persisted events', () => {
  const events = [
    event(),
    event({
      eventId: 'event-2',
      type: SessionEventType.SESSION_CONNECTED,
      occurredAt: '2026-05-16T00:01:00.000Z',
      connectionId: 'connection-1',
      payload: { device: { kind: 'browser' } },
    }),
  ];

  const summaries = getSessionSummariesFromEvents(events);
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0]?.sessionId, 'session-1');
  assert.equal(summaries[0]?.eventCount, 2);

  const detail = getSessionDetailFromEvents(events, 'session-1');
  assert.equal(detail?.connections.length, 1);
  assert.equal(detail?.connections[0]?.connectionId, 'connection-1');
});

test('marks session result as finished', () => {
  const events = [
    event(),
    event({
      eventId: 'event-2',
      type: SessionEventType.SESSION_RESULT,
      payload: { type: 'COMPLETED', reason: 'done' },
    }),
  ];

  const [summary] = getSessionSummariesFromEvents(events);
  assert.equal(summary?.status, 'FINISHED');
  assert.deepEqual(summary?.result, { type: 'COMPLETED', reason: 'done' });
});

test('stores Tower session create events', () => {
  const events = [
    event({
      eventId: 'event-session-create',
      type: SessionEventType.SESSION_CREATE,
      payload: { workflowId: 'workflow-1' },
    }),
  ];

  const [summary] = getSessionSummariesFromEvents(events);
  assert.equal(summary?.sessionId, 'session-1');
  assert.equal(summary?.eventCount, 1);
});

test('derives summaries and detail from persisted event lists', () => {
  const events = [
    event(),
    event({
      eventId: 'event-2',
      type: SessionEventType.SESSION_CONNECTED,
      occurredAt: '2026-05-16T00:01:00.000Z',
      connectionId: 'connection-1',
      payload: { device: { browser: 'test' } },
    }),
  ];

  const [summary] = getSessionSummariesFromEvents(events);
  assert.equal(summary?.sessionId, 'session-1');
  assert.equal(summary?.eventCount, 2);

  const detail = getSessionDetailFromEvents(events, 'session-1');
  assert.equal(detail?.connections[0]?.device?.browser, 'test');
});

test('adds connection metrics to session detail', () => {
  const events = [
    event(),
    event({
      eventId: 'event-2',
      type: SessionEventType.SESSION_CONNECTED,
      occurredAt: '2026-05-16T00:01:00.000Z',
      connectionId: 'connection-1',
    }),
  ];

  const detail = getSessionDetailFromEvents(events, 'session-1', {
    'connection-1': {
      'pipe.encrypted_bytes': [[1_780_401_600_000, 1536]],
      'pipe.latency_ms': [[1_780_401_600_000, 42]],
      'pipe.message_count': [[1_780_401_600_000, 1]],
    },
  });

  assert.deepEqual(detail?.connections[0]?.metrics['pipe.encrypted_bytes'], [[1_780_401_600_000, 1536]]);
});
