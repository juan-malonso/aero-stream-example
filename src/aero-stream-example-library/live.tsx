import type { AeroStreamComponent, AeroStreamLibrary } from 'aero-stream-pilot';
import type { ReactNode } from 'react';

import { DoneComponent, doneLiveStep } from './steps/done/live';
import { KYCComponent, kycLiveStep } from './steps/kyc/live';
import { VideoComponent, videoLiveStep } from './steps/video/live';
import { WelcomeComponent, welcomeLiveStep } from './steps/welcome/live';
import type { LiveStepDefinition } from './types';

export interface LiveComponentDefinition {
  executionType: string;
  component: AeroStreamComponent<ReactNode>;
}

export const LIVE_STEP_DEFINITIONS = [
  welcomeLiveStep,
  videoLiveStep,
  kycLiveStep,
  doneLiveStep,
] as const satisfies readonly LiveStepDefinition[];

export const LIVE_STEPS_BY_EXECUTION_TYPE: Record<string, LiveStepDefinition> = Object.fromEntries(
  LIVE_STEP_DEFINITIONS.map((step) => [step.executionType, step]),
);

export const LIVE_COMPONENT_DEFINITIONS = [
  { executionType: welcomeLiveStep.executionType, component: WelcomeComponent },
  { executionType: videoLiveStep.executionType, component: VideoComponent },
  { executionType: kycLiveStep.executionType, component: KYCComponent },
  { executionType: doneLiveStep.executionType, component: DoneComponent },
] as const satisfies readonly LiveComponentDefinition[];

export const LIVE_COMPONENTS_BY_EXECUTION_TYPE: Record<string, AeroStreamComponent<ReactNode>> = Object.fromEntries(
  LIVE_COMPONENT_DEFINITIONS.map((entry) => [entry.executionType, entry.component]),
);

export function getLiveStepByExecutionType(executionType: string): LiveStepDefinition | undefined {
  return LIVE_STEPS_BY_EXECUTION_TYPE[executionType];
}

export function getLiveComponentByExecutionType(executionType: string): AeroStreamComponent<ReactNode> | undefined {
  return LIVE_COMPONENTS_BY_EXECUTION_TYPE[executionType];
}

export function createLiveStepLibrary(): AeroStreamLibrary<ReactNode> {
  return Object.fromEntries(
    LIVE_STEP_DEFINITIONS.map((step) => [step.executionType, step.render]),
  ) as AeroStreamLibrary<ReactNode>;
}
