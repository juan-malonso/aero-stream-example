import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import { videoBuilderStep } from './builder';

export function VideoNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={videoBuilderStep.accentColor} />;
}
