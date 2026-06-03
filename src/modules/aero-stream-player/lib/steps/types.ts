import type { AeroStreamComponentParameters } from 'aero-stream-pilot';
import type { ReactNode } from 'react';

export interface LiveStepDefinition {
  executionType: string;
  render: (properties: AeroStreamComponentParameters) => ReactNode;
}
