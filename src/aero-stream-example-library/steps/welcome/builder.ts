import { colors } from '../../../styles/tokens.ts';
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
