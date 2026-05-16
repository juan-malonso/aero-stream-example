import type { ReactNode } from 'react';

import type { StepNodeData } from './builder/types.ts';

import { DoneNode, doneBuilderStep } from './steps/done/builder';
import { KYCNode, kycBuilderStep } from './steps/kyc/builder';
import { VideoNode, videoBuilderStep } from './steps/video/builder';
import { WelcomeNode, welcomeBuilderStep } from './steps/welcome/builder';
import type { BuilderStepDefinition, ComponentMeta } from './types.ts';

export type BuilderNodeComponent = (props: { id: string; data: StepNodeData }) => ReactNode;

export interface BuilderNodeDefinition {
  nodeType: string;
  component: BuilderNodeComponent;
}

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

export const BUILDER_NODE_DEFINITIONS = [
  { nodeType: welcomeBuilderStep.nodeType, component: WelcomeNode },
  { nodeType: kycBuilderStep.nodeType, component: KYCNode },
  { nodeType: videoBuilderStep.nodeType, component: VideoNode },
  { nodeType: doneBuilderStep.nodeType, component: DoneNode },
] as const satisfies readonly BuilderNodeDefinition[];

export const BUILDER_NODE_TYPES: Record<string, BuilderNodeComponent> = Object.fromEntries(
  BUILDER_NODE_DEFINITIONS.map((node) => [node.nodeType, node.component]),
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

export function getBuilderNodeByNodeType(nodeType: string): BuilderNodeComponent | undefined {
  return BUILDER_NODE_TYPES[nodeType];
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
