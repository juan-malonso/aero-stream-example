import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const libraryDir = dirname(fileURLToPath(import.meta.url));

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
    dir: 'done',
    builderExport: 'doneBuilderStep',
    nodeExport: 'DoneNode',
    liveExport: 'doneLiveStep',
    componentExport: 'DoneComponent',
    executionType: 'DoneComponent',
    nodeType: 'doneStep',
  },
];

function readLibraryFile(relativePath: string): string {
  return readFileSync(join(libraryDir, relativePath), 'utf8');
}

test('keeps each step grouped into Builder and Live files', () => {
  for (const step of expectedSteps) {
    const stepDir = join(libraryDir, 'steps', step.dir);
    assert.ok(existsSync(join(stepDir, 'builder.tsx')), `${step.dir} builder.tsx exists`);
    assert.ok(existsSync(join(stepDir, 'live.tsx')), `${step.dir} live.tsx exists`);
    assert.ok(existsSync(join(stepDir, 'index.ts')), `${step.dir} index.ts exists`);

    assert.equal(existsSync(join(stepDir, 'node.tsx')), false, `${step.dir} has no separate node file`);
    assert.equal(
      existsSync(join(stepDir, `${step.componentExport}.tsx`)),
      false,
      `${step.dir} has no separate component file`,
    );
  }
});

test('keeps Builder metadata and node rendering in one file per step', () => {
  for (const step of expectedSteps) {
    const builder = readLibraryFile(`steps/${step.dir}/builder.tsx`);

    assert.match(builder, new RegExp(`export const ${step.builderExport}`));
    assert.match(builder, new RegExp(`export function ${step.nodeExport}`));
    assert.match(builder, new RegExp(`nodeType: '${step.nodeType}'`));
    assert.match(builder, new RegExp(`executionType: '${step.executionType}'`));
  }
});

test('keeps Live registration and component rendering in one file per step', () => {
  for (const step of expectedSteps) {
    const live = readLibraryFile(`steps/${step.dir}/live.tsx`);

    assert.match(live, new RegExp(`export const ${step.componentExport}`));
    assert.match(live, new RegExp(`export const ${step.liveExport}`));
    assert.match(live, new RegExp(`executionType: '${step.executionType}'`));
    assert.match(live, new RegExp(`<${step.componentExport} \\{\\.\\.\\.props\\} />`));
  }
});

test('keeps aggregate Builder and node registries wired to step Builder files', () => {
  const builderRegistry = readLibraryFile('builder.ts');
  const nodeRegistry = readLibraryFile('builderNodes.tsx');

  for (const step of expectedSteps) {
    assert.match(builderRegistry, new RegExp(`from './steps/${step.dir}/builder'`));
    assert.match(nodeRegistry, new RegExp(`from './steps/${step.dir}/builder'`));
  }
});

test('does not keep old split step component files', () => {
  const legacyStepDir = join(libraryDir, '..', 'components', 'steps');
  assert.equal(existsSync(legacyStepDir), false);
});
