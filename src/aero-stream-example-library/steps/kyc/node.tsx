import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import { kycBuilderStep } from './builder';

export function KYCNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={kycBuilderStep.accentColor} />;
}
