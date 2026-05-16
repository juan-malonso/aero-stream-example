import { colors } from '../../../styles/tokens.ts';
import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import type { BuilderStepDefinition } from '../../types.ts';

export const doneBuilderStep: BuilderStepDefinition = {
  id: 'done',
  label: 'Done',
  toolboxLabel: 'Done Node',
  nodeType: 'doneStep',
  executionType: 'DoneComponent',
  fields: ['status'],
  propKeys: ['title', 'message'],
  accentColor: colors.amber500,
  defaultSpecs: { stopWorkflow: true },
  hideOutputs: true,
};

export function DoneNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={doneBuilderStep.accentColor} />;
}
