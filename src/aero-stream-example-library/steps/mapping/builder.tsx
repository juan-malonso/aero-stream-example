import { colors } from '../../../styles/tokens.ts';
import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import type { BuilderStepDefinition } from '../../types.ts';

export const mappingBuilderStep: BuilderStepDefinition = {
  id: 'mapping',
  label: 'Mapping',
  toolboxLabel: 'Mapping Backend',
  nodeType: 'mappingStep',
  executionType: 'mapping',
  executionMode: 'BACK',
  fields: ['givenName', 'familyName', 'contactEmail', 'city'],
  propKeys: [],
  accentColor: colors.emerald600,
  defaultSpecs: {
    mappings: 'firstName:givenName,lastName:familyName,email:contactEmail,city:city',
  },
};

export function MappingNode({ id, data }: { id: string; data: StepNodeData }) {
  return <StepNode id={id} data={data} accentColor={mappingBuilderStep.accentColor} />;
}
