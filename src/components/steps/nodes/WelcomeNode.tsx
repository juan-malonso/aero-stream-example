import { COMPONENT_REGISTRY } from '@/lib/workflow/componentRegistry';
import { StepNode } from '../StepNode';
import { type StepNodeData } from '../types';

export function WelcomeNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={COMPONENT_REGISTRY.WelcomeComponent.accentColor} />;
}
