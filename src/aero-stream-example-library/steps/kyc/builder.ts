import { colors } from '../../../styles/tokens.ts';
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
