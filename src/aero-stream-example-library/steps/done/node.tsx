import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import { doneBuilderStep } from './builder';

export function DoneNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={doneBuilderStep.accentColor} />;
}
