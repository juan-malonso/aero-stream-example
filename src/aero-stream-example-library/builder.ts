import type { ReactNode } from 'react';

import type { StepNodeData } from './builder/types.ts';
import { backendBuilderStep, BackendNode } from './steps/code/builder';
import { finishBuilderStep, FinishNode } from './steps/finish/builder';
import { kycBuilderStep, KYCNode } from './steps/kyc/builder';
import { videoBuilderStep, VideoNode } from './steps/video/builder';
import { welcomeBuilderStep, WelcomeNode } from './steps/welcome/builder';
import type { BuilderStepDefinition, ComponentMeta } from './types.ts';

export type BuilderNodeComponent = (properties: { id: string; data: StepNodeData }) => ReactNode;

export interface BuilderNodeDefinition {
  nodeType: string;
  component: BuilderNodeComponent;
}

export const BUILDER_STEP_DEFINITIONS = [
  welcomeBuilderStep,
  backendBuilderStep,
  kycBuilderStep,
  videoBuilderStep,
  finishBuilderStep,
] as const satisfies readonly BuilderStepDefinition[];

export const BUILDER_STEPS_BY_EXECUTION_TYPE: Record<string, BuilderStepDefinition> = Object.fromEntries(
  BUILDER_STEP_DEFINITIONS.map((step) => [step.executionType, step]),
);

export const BUILDER_STEPS_BY_NODE_TYPE: Record<string, BuilderStepDefinition> = Object.fromEntries(
  BUILDER_STEP_DEFINITIONS.map((step) => [step.nodeType, step]),
);

export const BUILDER_NODE_DEFINITIONS = [
  { nodeType: welcomeBuilderStep.nodeType, component: WelcomeNode },
  { nodeType: backendBuilderStep.nodeType, component: BackendNode },
  { nodeType: kycBuilderStep.nodeType, component: KYCNode },
  { nodeType: videoBuilderStep.nodeType, component: VideoNode },
  { nodeType: finishBuilderStep.nodeType, component: FinishNode },
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
    code: step.defaultCode ? { ...step.defaultCode } : undefined,
    fields: [...step.fields],
    props: Object.fromEntries(step.propKeys.map((key) => [key, step.defaultProps?.[key] ?? ''])),
    execution: { mode: step.executionMode ?? 'CLIENT', type: step.executionType },
    hideOutputs: step.hideOutputs ?? false,
    specs: step.defaultSpecs ? { ...step.defaultSpecs } : {},
  };
}

export type { OutputConfig, StepNodeData } from './builder/types.ts';
