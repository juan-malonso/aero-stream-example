import type { AeroStreamComponentParams } from 'aero-stream-pilot';
import type { ReactNode } from 'react';

export interface BuilderStepDefinition {
  id: string;
  label: string;
  toolboxLabel: string;
  nodeType: string;
  executionType: string;
  executionMode?: 'FINISH' | 'FRONT' | 'MAPPER' | 'REQUEST';
  fields: string[];
  propKeys: string[];
  accentColor: string;
  defaultProps?: Record<string, string>;
  defaultSpecs?: Record<string, unknown>;
  hideOutputs?: boolean;
}

export interface ComponentMeta {
  fields: string[];
  propKeys: string[];
  accentColor: string;
}

export interface LiveStepDefinition {
  executionType: string;
  render: (props: AeroStreamComponentParams) => ReactNode;
}
