import assert from 'node:assert/strict';
import test from 'node:test';

import type { StepNodeData } from '../steps';

import { resolveNextStepId } from './conditionEvaluator.ts';

const stepData: StepNodeData = {
  execution: { mode: 'CLIENT', type: 'Review' },
  label: 'Review',
  outputs: [
    {
      field: '{{steps.current.result.approved}}',
      id: 'approved',
      operator: 'eq',
      value: 'true',
    },
  ],
};

test('resolves the matched conditional edge from preview output', () => {
  const nextStepId = resolveNextStepId({
    edges: [
      {
        id: 'edge-approved',
        source: 'current',
        sourceHandle: 'approved',
        target: 'next',
      },
    ],
    inputValue: {},
    previewAction: { emitted: 'submit', value: { approved: true } },
    selectedNodeId: 'current',
    stepData,
  });

  assert.equal(nextStepId, 'next');
});

test('falls back to the default edge when no condition matches', () => {
  const nextStepId = resolveNextStepId({
    edges: [
      {
        id: 'edge-default',
        source: 'current',
        sourceHandle: 'default',
        target: 'fallback',
      },
    ],
    inputValue: {},
    previewAction: { emitted: 'submit', value: { approved: false } },
    selectedNodeId: 'current',
    stepData,
  });

  assert.equal(nextStepId, 'fallback');
});
