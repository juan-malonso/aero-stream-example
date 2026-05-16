import { colors } from '../../../styles/tokens.ts';
import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import type { BuilderStepDefinition } from '../../types.ts';

export const videoBuilderStep: BuilderStepDefinition = {
  id: 'video',
  label: 'Video',
  toolboxLabel: 'Video Node',
  nodeType: 'videoStep',
  executionType: 'VideoComponent',
  fields: ['status'],
  propKeys: ['title', 'subtitle'],
  accentColor: colors.cyan500,
};

export function VideoNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={videoBuilderStep.accentColor} />;
}
