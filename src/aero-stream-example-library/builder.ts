import type { StepNodeData } from './builder/types.ts';

import { doneBuilderStep } from './steps/done/builder.ts';
import { kycBuilderStep } from './steps/kyc/builder.ts';
import { videoBuilderStep } from './steps/video/builder.ts';
import { welcomeBuilderStep } from './steps/welcome/builder.ts';
import type { BuilderStepDefinition, ComponentMeta } from './types.ts';

export const BUILDER_STEP_DEFINITIONS = [
  welcomeBuilderStep,
  kycBuilderStep,
  videoBuilderStep,
  doneBuilderStep,
] as const satisfies readonly BuilderStepDefinition[];

export const BUILDER_STEPS_BY_EXECUTION_TYPE: Record<string, BuilderStepDefinition> = Object.fromEntries(
  BUILDER_STEP_DEFINITIONS.map((step) => [step.executionType, step]),
);

export const BUILDER_STEPS_BY_NODE_TYPE: Record<string, BuilderStepDefinition> = Object.fromEntries(
  BUILDER_STEP_DEFINITIONS.map((step) => [step.nodeType, step]),
);

export const COMPONENT_REGISTRY: Record<string, ComponentMeta> = Object.fromEntries(
  BUILDER_STEP_DEFINITIONS.map((step) => [
    step.executionType,
    {
      fields: step.fields,
      propKeys: step.propKeys,
      accentColor: step.accentColor,
    },
  ]),
);

export const EXECUTION_TYPE_TO_NODE: Record<string, string> = Object.fromEntries(
  BUILDER_STEP_DEFINITIONS.map((step) => [step.executionType, step.nodeType]),
);

export const NODE_TYPE_TO_EXECUTION: Record<string, string> = Object.fromEntries(
  BUILDER_STEP_DEFINITIONS.map((step) => [step.nodeType, step.executionType]),
);

export function getBuilderStepByExecutionType(executionType: string): BuilderStepDefinition | undefined {
  return BUILDER_STEPS_BY_EXECUTION_TYPE[executionType];
}

export function getBuilderStepByNodeType(nodeType: string): BuilderStepDefinition | undefined {
  return BUILDER_STEPS_BY_NODE_TYPE[nodeType];
}

export function createStepNodeData(step: BuilderStepDefinition, label = step.label): StepNodeData {
  return {
    label,
    fields: [...step.fields],
    props: Object.fromEntries(step.propKeys.map((key) => [key, step.defaultProps?.[key] ?? ''])),
    execution: { mode: 'FRONT', type: step.executionType },
    hideOutputs: step.hideOutputs ?? false,
    specs: step.defaultSpecs ? { ...step.defaultSpecs } : {},
  };
}

export type { OutputConfig, StepNodeData } from './builder/types.ts';
