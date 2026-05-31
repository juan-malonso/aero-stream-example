export interface OutputConfig {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface StepNodeData {
  code?: {
    entrypoint?: string;
    language: "ts";
    source: string;
  };
  label: string;
  stepName?: string;
  fields?: string[];
  outputs?: OutputConfig[];
  hideOutputs?: boolean;
  isNameDuplicated?: boolean;
  isOutputDisconnected?: boolean;
  props?: Record<string, string>;
  specs?: Record<string, unknown>;
  execution: { mode: string; type: string };
}

export interface StepNodeProperties {
  id: string;
  data: StepNodeData;
  accentColor?: string;
  children?: React.ReactNode;
}
