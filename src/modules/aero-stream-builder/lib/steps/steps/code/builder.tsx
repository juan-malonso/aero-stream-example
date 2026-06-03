import { colors } from '@/styles/tokens';

import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import type { BuilderStepDefinition } from '../../types.ts';

const defaultSource = [
  'async function run(ctx, helpers) {',
  "  const data = await helpers.fetchJson('http://localhost:3000/api/sessions/request');",
  '  return {',
  '    status: "success",',
  '    data,',
  '  };',
  '}',
].join('\n');

export const backendBuilderStep: BuilderStepDefinition = {
  id: 'backend',
  label: 'BackendComponent',
  toolboxLabel: 'Backend Node',
  nodeType: 'backendStep',
  executionType: 'BackendComponent',
  executionMode: 'SERVER',
  fields: ['status', 'data'],
  propKeys: [],
  accentColor: colors.green500,
  defaultCode: {
    entrypoint: 'run',
    language: 'ts',
    source: defaultSource,
  },
};

export function BackendNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={backendBuilderStep.accentColor} />;
}
