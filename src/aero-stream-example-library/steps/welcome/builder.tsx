import { colors } from '../../../styles/tokens.ts';
import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import type { BuilderStepDefinition } from '../../types.ts';

export const welcomeBuilderStep: BuilderStepDefinition = {
  id: 'welcome',
  label: 'Welcome',
  toolboxLabel: 'Welcome Node',
  nodeType: 'welcomeStep',
  executionType: 'WelcomeComponent',
  fields: ['status'],
  propKeys: ['title', 'description'],
  accentColor: colors.blue500,
};

export function WelcomeNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={welcomeBuilderStep.accentColor} />;
}
