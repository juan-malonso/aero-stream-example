import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BUILDER_STEP_DEFINITIONS,
  COMPONENT_REGISTRY,
  EXECUTION_TYPE_TO_NODE,
  NODE_TYPE_TO_EXECUTION,
  createStepNodeData,
} from './builder.ts';

const expectedExecutionTypes = [
  'WelcomeComponent',
  'KYCComponent',
  'VideoComponent',
  'DoneComponent',
];

test('exports the current example step set', () => {
  assert.deepEqual(
    BUILDER_STEP_DEFINITIONS.map((step) => step.executionType),
    expectedExecutionTypes,
  );
});

test('keeps execution and node mappings compatible', () => {
  assert.equal(EXECUTION_TYPE_TO_NODE.WelcomeComponent, 'welcomeStep');
  assert.equal(EXECUTION_TYPE_TO_NODE.KYCComponent, 'kycStep');
  assert.equal(EXECUTION_TYPE_TO_NODE.VideoComponent, 'videoStep');
  assert.equal(EXECUTION_TYPE_TO_NODE.DoneComponent, 'doneStep');

  assert.equal(NODE_TYPE_TO_EXECUTION.welcomeStep, 'WelcomeComponent');
  assert.equal(NODE_TYPE_TO_EXECUTION.kycStep, 'KYCComponent');
  assert.equal(NODE_TYPE_TO_EXECUTION.videoStep, 'VideoComponent');
  assert.equal(NODE_TYPE_TO_EXECUTION.doneStep, 'DoneComponent');
});

test('creates Builder node data from step definitions', () => {
  const done = BUILDER_STEP_DEFINITIONS.find((step) => step.executionType === 'DoneComponent');
  assert.ok(done);

  const nodeData = createStepNodeData(done);

  assert.equal(nodeData.execution.type, 'DoneComponent');
  assert.equal(nodeData.hideOutputs, true);
  assert.deepEqual(nodeData.specs, { stopWorkflow: true });
});

test('keeps component metadata available for existing consumers', () => {
  assert.deepEqual(COMPONENT_REGISTRY.KYCComponent.fields, ['name', 'email', 'phone']);
  assert.deepEqual(COMPONENT_REGISTRY.VideoComponent.propKeys, ['title', 'subtitle']);
});
