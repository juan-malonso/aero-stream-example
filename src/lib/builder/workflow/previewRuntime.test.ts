import assert from 'node:assert/strict';
import test from 'node:test';

import type { StepNodeData } from '@/aero-stream-example-library';

import {
  createPreviewCodeHelpers,
  executePreviewCode,
  formatStepCodeSource,
  normalizePreviewCodeResult,
} from './previewRuntime.ts';

const stepData: StepNodeData = {
  code: {
    entrypoint: 'run',
    language: 'ts',
    source: '',
  },
  execution: { mode: 'SERVER', type: 'Code' },
  label: 'Code',
};

test('formats step code source with stable indentation', () => {
  assert.equal(
    formatStepCodeSource('export function run() {\nreturn { status: "ok" };\n}'),
    'export function run() {\n  return { status: "ok" };\n}',
  );
});

test('normalizes preview code result envelopes', () => {
  assert.deepEqual(normalizePreviewCodeResult({ result: { status: 'done', value: 7 } }), {
    data: { value: 7 },
    status: 'done',
  });
  assert.deepEqual(normalizePreviewCodeResult(null), { data: {}, status: 'success' });
});

test('maps preview helper paths from records', () => {
  const helpers = createPreviewCodeHelpers({ payload: { score: 42 } });

  assert.equal(helpers.get('payload.score'), 42);
  assert.deepEqual(helpers.map({ score: 42 }, 'score:total'), { total: 42 });
});

test('executes demo preview code through the isolated runtime boundary', async () => {
  const result = await executePreviewCode({
    inputValue: { score: 42 },
    source: 'export function run(ctx, helpers) { return { data: helpers.map(ctx.props, "score:total") }; }',
    stepData,
  });

  assert.deepEqual(normalizePreviewCodeResult(result), {
    data: { total: 42 },
    status: 'success',
  });
});
