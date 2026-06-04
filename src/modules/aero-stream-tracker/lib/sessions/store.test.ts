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
      payload: { device: { browser: 'test' }, metadata: { termsVersion: '1.0.0' } },
    }),
  ];

  const [summary] = getSessionSummariesFromEvents(events);
  assert.equal(summary?.sessionId, 'session-1');
  assert.equal(summary?.eventCount, 2);

  const detail = getSessionDetailFromEvents(events, 'session-1');
  assert.equal(detail?.connections[0]?.device?.browser, 'test');
  assert.deepEqual(detail?.connections[0]?.metadata, { termsVersion: '1.0.0' });
});

test('keeps request data from session requested events', () => {
  const request = {
    forwardedIp: '198.51.100.25',
    ip: '198.51.100.25',
    origin: 'https://client.example',
    referer: 'https://client.example/live/session-1',
  };
  const events = [
    event(),
    event({
      eventId: 'event-2',
      type: SessionEventType.SESSION_REQUESTED,
      occurredAt: '2026-05-16T00:01:00.000Z',
      connectionId: 'connection-1',
      payload: { device: {}, metadata: {}, request },
    }),
  ];

  const detail = getSessionDetailFromEvents(events, 'session-1');
  assert.deepEqual(detail?.connections[0]?.request, request);
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
      'browser.inbound_latency_ms': [],
      'browser.interaction_count': [],
      'browser.memory_used_bytes': [],
      'pipe.encrypted_bytes': [[1_780_401_600_000, 1536]],
      'pipe.latency_ms': [[1_780_401_600_000, 42]],
      'pipe.message_count': [[1_780_401_600_000, 1]],
    },
  });

  assert.deepEqual(detail?.connections[0]?.metrics['pipe.encrypted_bytes'], [[1_780_401_600_000, 1536]]);
});
