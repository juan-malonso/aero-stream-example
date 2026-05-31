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

test('accepts frontend render events', () => {
  const stepResult = parseSessionEvent(event({
    type: 'STEP_RENDERED',
    payload: {
      step: { id: 'front-data', name: 'Front Data', type: 'form' },
      props: {},
    },
  }));
  const finishResult = parseSessionEvent(event({
    type: 'FINISH_RENDER',
    payload: {
      step: { id: 'finish-data', name: 'Finish Node', type: 'FinishComponent' },
      props: {},
    },
  }));

  assert.equal(stepResult.ok, true);
  assert.equal(stepResult.ok && stepResult.event.type, SessionEventType.STEP_RENDERED);
  assert.equal(finishResult.ok, true);
  assert.equal(finishResult.ok && finishResult.event.type, SessionEventType.FINISH_RENDER);
});

test('accepts normalized step response events', () => {
  const conditionResult = parseSessionEvent(event({
    type: 'STEP_CONDITION',
    payload: {
      condition: { '==': [{ var: 'steps.backend.result.status' }, 'PHONE_GREATER'] },
      nextStep: { id: 'finish-ok', name: 'OK', type: 'FinishComponent' },
      step: { id: 'backend', name: 'Backend Node', type: 'BackendComponent' },
    },
  }));
  const startResult = parseSessionEvent(event({
    type: 'STEP_START',
    payload: {
      input: { firstName: 'Ada' },
      mode: 'SERVER',
      step: { id: 'request-data', name: 'Request Data', type: 'BackendComponent' },
    },
  }));
  const responseResult = parseSessionEvent(event({
    type: 'STEP_RESPONSE',
    payload: {
      mode: 'SERVER',
      result: { status: 'success', data: { firstName: 'Ada' } },
      step: { id: 'request-data', name: 'Request Data', type: 'BackendComponent' },
    },
  }));

  assert.equal(conditionResult.ok, true);
  assert.equal(conditionResult.ok && conditionResult.event.type, SessionEventType.STEP_CONDITION);
  assert.equal(startResult.ok, true);
  assert.equal(startResult.ok && startResult.event.type, SessionEventType.STEP_START);
  assert.equal(responseResult.ok, true);
  assert.equal(responseResult.ok && responseResult.event.type, SessionEventType.STEP_RESPONSE);
});

test('rejects unsupported event types', () => {
  const result = parseSessionEvent(event({ type: 'NOT_A_TOWER_EVENT' }));

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.status, 422);
});
