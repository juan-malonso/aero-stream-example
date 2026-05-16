export interface OutputConfig {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface StepNodeData {
  label: string;
  stepName?: string;
  fields?: string[];
  outputs?: OutputConfig[];
  hideOutputs?: boolean;
  props?: Record<string, string>;
  specs?: Record<string, unknown>;
  execution: { mode: string; type: string };
}

export interface StepNodeProps {
  id: string;
  data: StepNodeData;
  accentColor?: string;
  children?: React.ReactNode;
}
