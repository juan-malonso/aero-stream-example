import { colors } from '../../../styles/tokens.ts';
import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import type { BuilderStepDefinition } from '../../types.ts';

export const kycBuilderStep: BuilderStepDefinition = {
  id: 'kyc',
  label: 'KYC',
  toolboxLabel: 'KYC Node',
  nodeType: 'kycStep',
  executionType: 'KYCComponent',
  fields: ['name', 'email', 'phone'],
  propKeys: ['title', 'description'],
  accentColor: colors.emerald500,
};

export function KYCNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={kycBuilderStep.accentColor} />;
}
