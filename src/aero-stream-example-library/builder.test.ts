import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const libraryDirectory = dirname(fileURLToPath(import.meta.url));

const expectedSteps = [
  {
    dir: 'welcome',
    builderExport: 'welcomeBuilderStep',
    nodeExport: 'WelcomeNode',
    liveExport: 'welcomeLiveStep',
    componentExport: 'WelcomeComponent',
    executionType: 'WelcomeComponent',
    nodeType: 'welcomeStep',
  },
  {
    dir: 'kyc',
    builderExport: 'kycBuilderStep',
    nodeExport: 'KYCNode',
    liveExport: 'kycLiveStep',
    componentExport: 'KYCComponent',
    executionType: 'KYCComponent',
    nodeType: 'kycStep',
  },
  {
    dir: 'video',
    builderExport: 'videoBuilderStep',
    nodeExport: 'VideoNode',
    liveExport: 'videoLiveStep',
    componentExport: 'VideoComponent',
    executionType: 'VideoComponent',
    nodeType: 'videoStep',
  },
  {
    dir: 'finish',
    builderExport: 'finishBuilderStep',
    nodeExport: 'FinishNode',
    liveExport: 'finishLiveStep',
    componentExport: 'FinishComponent',
    executionType: 'FinishComponent',
    nodeType: 'finishStep',
  },
];

const expectedBackendSteps = [
  {
    dir: 'code',
    builderExport: 'backendBuilderStep',
    nodeExport: 'BackendNode',
    executionType: 'BackendComponent',
    nodeType: 'backendStep',
  },
];

function readLibraryFile(relativePath: string): string {
  return readFileSync(join(libraryDirectory, relativePath), 'utf8');
}

test('keeps each step grouped into Builder and Live files', () => {
  for (const step of expectedSteps) {
    const stepDirectory = join(libraryDirectory, 'steps', step.dir);
    assert.ok(existsSync(join(stepDirectory, 'builder.tsx')), `${step.dir} builder.tsx exists`);
    assert.ok(existsSync(join(stepDirectory, 'live.tsx')), `${step.dir} live.tsx exists`);
    assert.ok(existsSync(join(stepDirectory, 'index.ts')), `${step.dir} index.ts exists`);

    assert.equal(existsSync(join(stepDirectory, 'node.tsx')), false, `${step.dir} has no separate node file`);
    assert.equal(
      existsSync(join(stepDirectory, `${step.componentExport}.tsx`)),
      false,
      `${step.dir} has no separate component file`,
    );
  }

  for (const step of expectedBackendSteps) {
    const stepDirectory = join(libraryDirectory, 'steps', step.dir);
    assert.ok(existsSync(join(stepDirectory, 'builder.tsx')), `${step.dir} builder.tsx exists`);
    assert.equal(existsSync(join(stepDirectory, 'live.tsx')), false, `${step.dir} has no live.tsx`);
    assert.ok(existsSync(join(stepDirectory, 'index.ts')), `${step.dir} index.ts exists`);
  }
});

test('keeps Builder metadata and node rendering in one file per step', () => {
  for (const step of [...expectedSteps, ...expectedBackendSteps]) {
    const builder = readLibraryFile(`steps/${step.dir}/builder.tsx`);

    assert.match(builder, new RegExp(`export const ${step.builderExport}`));
    assert.match(builder, new RegExp(`export function ${step.nodeExport}`));
    assert.match(builder, new RegExp(`nodeType: '${step.nodeType}'`));
    assert.match(builder, new RegExp(`executionType: '${step.executionType}'`));
  }
});

test('keeps Finish mode as the terminal Builder step', () => {
  const finishBuilder = readLibraryFile('steps/finish/builder.tsx');
  const builderRegistry = readLibraryFile('builder.ts');
  const definitions = /export const BUILDER_STEP_DEFINITIONS = \[([\S\s]*?)] as const/.exec(builderRegistry);

  assert.ok(definitions);
  const entries: string[] = [];
  const stepPattern = /(\w+BuilderStep),/g;
  let stepMatch = stepPattern.exec(definitions[1]);

  while (stepMatch) {
    entries.push(stepMatch[1]);
    stepMatch = stepPattern.exec(definitions[1]);
  }

  assert.equal(entries.at(-1), 'finishBuilderStep');
  assert.match(finishBuilder, /executionMode: 'FINISH'/);
  assert.match(finishBuilder, /hideOutputs: true/);
});

test('keeps Live registration and component rendering in one file per step', () => {
  for (const step of expectedSteps) {
    const live = readLibraryFile(`steps/${step.dir}/live.tsx`);

    assert.match(live, new RegExp(`export const ${step.componentExport}`));
    assert.match(live, new RegExp(`export const ${step.liveExport}`));
    assert.match(live, new RegExp(`executionType: ['"]${step.executionType}['"]`));
    assert.match(live, new RegExp(`<${step.componentExport} \\{\\.\\.\\.(props|properties)\\} />`));
  }
});

test('keeps aggregate Builder and node registries wired to step Builder files', () => {
  const builderRegistry = readLibraryFile('builder.ts');

  for (const step of [...expectedSteps, ...expectedBackendSteps]) {
    assert.match(builderRegistry, new RegExp(`from './steps/${step.dir}/builder'`));
    assert.match(builderRegistry, new RegExp(`component: ${step.nodeExport}`));
    assert.match(builderRegistry, new RegExp(`nodeType: ${step.builderExport}\\.nodeType`));
  }

  assert.match(builderRegistry, /export const BUILDER_NODE_DEFINITIONS/);
  assert.match(builderRegistry, /export const BUILDER_NODE_TYPES/);
  assert.match(builderRegistry, /export function getBuilderNodeByNodeType/);
  assert.equal(existsSync(join(libraryDirectory, 'builderNodes.tsx')), false);
});

test('keeps aggregate Live step and component registries wired to step Live files', () => {
  const liveRegistry = readLibraryFile('live.tsx');

  for (const step of expectedSteps) {
    assert.match(liveRegistry, new RegExp(`from './steps/${step.dir}/live'`));
    assert.match(liveRegistry, new RegExp(`component: ${step.componentExport}`));
    assert.match(liveRegistry, new RegExp(`executionType: ${step.liveExport}\\.executionType`));
  }

  assert.match(liveRegistry, /export const LIVE_COMPONENT_DEFINITIONS/);
  assert.match(liveRegistry, /export const LIVE_COMPONENTS_BY_EXECUTION_TYPE/);
  assert.match(liveRegistry, /export function getLiveComponentByExecutionType/);
});

test('does not keep old split step component files', () => {
  const legacyStepDirectory = join(libraryDirectory, '..', 'components', 'steps');
  assert.equal(existsSync(legacyStepDirectory), false);
});
