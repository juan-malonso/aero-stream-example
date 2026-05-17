import { colors } from '../../../styles/tokens.ts';
import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import type { BuilderStepDefinition } from '../../types.ts';

export const requestBuilderStep: BuilderStepDefinition = {
  id: 'request',
  label: 'Request',
  toolboxLabel: 'Request Backend',
  nodeType: 'requestStep',
  executionType: 'request',
  executionMode: 'BACK',
  fields: ['firstName', 'lastName', 'address', 'city', 'country', 'email', 'phone', 'company'],
  propKeys: [],
  accentColor: colors.pink500,
  defaultSpecs: {
    endpoint: 'http://localhost:3000/api/sessions/request',
    method: 'GET',
    headers: '{}',
    body: '',
  },
};

export function RequestNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={requestBuilderStep.accentColor} />;
}
