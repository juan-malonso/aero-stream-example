import assert from 'node:assert/strict';
import test from 'node:test';

import { parseSessionEvent } from './ingest.ts';
import { SessionEventType } from './types.ts';

function event(overrides: Record<string, unknown> = {}) {
  return {
    eventId: 'event-1',
    occurredAt: '2026-05-16T02:43:05.313Z',
    payload: { workflowId: 'workflow-1' },
    sessionId: 'session-1',
    source: 'aero-stream-tower',
    type: 'SESSION_CREATE',
    workflowId: 'workflow-1',
    ...overrides,
  };
}

test('accepts Tower SESSION_CREATE events', () => {
  const result = parseSessionEvent(event());

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.event.type, SessionEventType.SESSION_CREATE);
});

test('normalizes legacy session-created event names', () => {
  const result = parseSessionEvent(event({ type: 'SESSION_CREATED' }));

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.event.type, SessionEventType.SESSION_CREATE);
});

test('rejects unsupported event types', () => {
  const result = parseSessionEvent(event({ type: 'NOT_A_TOWER_EVENT' }));

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.status, 422);
});
