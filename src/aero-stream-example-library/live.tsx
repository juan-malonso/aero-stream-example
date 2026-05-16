import type { AeroStreamLibrary } from 'aero-stream-pilot';
import type { ReactNode } from 'react';

import { doneLiveStep } from './steps/done/live';
import { kycLiveStep } from './steps/kyc/live';
import { videoLiveStep } from './steps/video/live';
import { welcomeLiveStep } from './steps/welcome/live';
import type { LiveStepDefinition } from './types';

export const LIVE_STEP_DEFINITIONS = [
  welcomeLiveStep,
  videoLiveStep,
  kycLiveStep,
  doneLiveStep,
] as const satisfies readonly LiveStepDefinition[];

export function createLiveStepLibrary(): AeroStreamLibrary<ReactNode> {
  return Object.fromEntries(
    LIVE_STEP_DEFINITIONS.map((step) => [step.executionType, step.render]),
  ) as AeroStreamLibrary<ReactNode>;
}
