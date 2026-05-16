import assert from 'node:assert/strict';
import test from 'node:test';

import { addEvent, clearPlatformSessionsForTest, getSessionDetail, getSessionSummaries } from './store.ts';
import { PlatformEventType, type PlatformEventEnvelope } from './types.ts';

function event(overrides: Partial<PlatformEventEnvelope> = {}): PlatformEventEnvelope {
  return {
    eventId: overrides.eventId ?? 'event-1',
    type: overrides.type ?? PlatformEventType.SESSION_CREATED,
    occurredAt: overrides.occurredAt ?? '2026-05-16T00:00:00.000Z',
    sessionId: overrides.sessionId ?? 'session-1',
    workflowId: overrides.workflowId ?? 'workflow-1',
    connectionId: overrides.connectionId,
    source: overrides.source ?? 'tower',
    payload: overrides.payload ?? {},
  };
}

test('stores session events for summaries and detail review', () => {
  clearPlatformSessionsForTest();

  addEvent(event());
  addEvent(event({
    eventId: 'event-2',
    type: PlatformEventType.SESSION_CONNECTED,
    occurredAt: '2026-05-16T00:01:00.000Z',
    connectionId: 'connection-1',
    payload: { device: { kind: 'browser' } },
  }));

  const summaries = getSessionSummaries();
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0]?.sessionId, 'session-1');
  assert.equal(summaries[0]?.eventCount, 2);

  const detail = getSessionDetail('session-1');
  assert.equal(detail?.connections.length, 1);
  assert.equal(detail?.connections[0]?.connectionId, 'connection-1');
});

test('marks session result as finished', () => {
  clearPlatformSessionsForTest();

  addEvent(event());
  addEvent(event({
    eventId: 'event-2',
    type: PlatformEventType.SESSION_RESULT,
    payload: { type: 'COMPLETED', reason: 'done' },
  }));

  const [summary] = getSessionSummaries();
  assert.equal(summary?.status, 'FINISHED');
  assert.deepEqual(summary?.result, { type: 'COMPLETED', reason: 'done' });
});
