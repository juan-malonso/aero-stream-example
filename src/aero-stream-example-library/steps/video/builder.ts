import { colors } from '../../../styles/tokens.ts';
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
