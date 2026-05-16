import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import { welcomeBuilderStep } from './builder';

export function WelcomeNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={welcomeBuilderStep.accentColor} />;
}
