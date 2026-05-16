import { colors } from '../../../styles/tokens.ts';
import type { BuilderStepDefinition } from '../../types.ts';

export const doneBuilderStep: BuilderStepDefinition = {
  id: 'done',
  label: 'Done',
  toolboxLabel: 'Done Node',
  nodeType: 'doneStep',
  executionType: 'DoneComponent',
  fields: ['status'],
  propKeys: ['title', 'message'],
  accentColor: colors.amber500,
  defaultSpecs: { stopWorkflow: true },
  hideOutputs: true,
};
