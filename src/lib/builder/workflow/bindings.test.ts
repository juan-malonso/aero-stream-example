import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractBindingRanges,
  findBindingRange,
  findFirstStepResultBinding,
  formatStepResultBinding,
  normalizeRanges,
  parseStepResultBinding,
  validateBindings,
} from './bindings.ts';

test('parses and formats step result bindings', () => {
  assert.deepEqual(parseStepResultBinding('{{steps.review-step.result.status}}'), {
    path: ['status'],
    pathText: 'status',
    stepId: 'review-step',
  });
  assert.equal(formatStepResultBinding('review-step', 'status'), '{{steps.review-step.result.status}}');
  assert.equal(formatStepResultBinding('review-step'), '{{steps.review-step.result}}');
});

test('finds embedded step bindings used by implicit edges', () => {
  assert.deepEqual(findFirstStepResultBinding('value: {{steps.source.result.score}}'), {
    path: ['score'],
    pathText: 'score',
    stepId: 'source',
  });
  assert.equal(findFirstStepResultBinding('{{env.secret}}'), null);
});

test('extracts complete and incomplete binding ranges', () => {
  const value = '{"a":"{{steps.one.result.status}}","b":"{{steps.two.result';

  assert.deepEqual(extractBindingRanges(value), [
    { end: 33, start: 6 },
    { end: value.length, start: 40 },
  ]);
});

test('validates step and environment bindings against previous steps', () => {
  const previousSteps = [{ fields: ['status'], id: 'one' }];

  assert.equal(
    validateBindings('{"a":"{{steps.one.result.status}}","b":"{{env.secret}}"}', previousSteps).message,
    null,
  );
  assert.deepEqual(
    validateBindings('{"a":"{{steps.two.result.status}}"}', previousSteps).invalidRanges,
    [{ end: 33, start: 6 }],
  );
});

test('locates selected binding ranges and normalizes overlapping ranges', () => {
  const value = '{"a":"{{steps.one.result.status}}"}';

  assert.deepEqual(findBindingRange(value, { end: 12, start: 12 }), { end: 33, start: 6 });
  assert.deepEqual(normalizeRanges([{ end: 10, start: 5 }, { end: 12, start: 8 }], 20), [
    { end: 12, start: 5 },
  ]);
});
