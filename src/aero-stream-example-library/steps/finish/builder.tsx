import { colors } from '../../../styles/tokens.ts';
import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import type { BuilderStepDefinition } from '../../types.ts';

export const finishBuilderStep: BuilderStepDefinition = {
  id: 'finish',
  label: 'Finish',
  toolboxLabel: 'Finish Node',
  nodeType: 'finishStep',
  executionMode: 'FINISH',
  executionType: 'FinishComponent',
  fields: ['status'],
  propKeys: ['title', 'message'],
  accentColor: colors.gray500,
  hideOutputs: true,
};

export function FinishNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={finishBuilderStep.accentColor} />;
}
