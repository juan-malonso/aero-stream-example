export interface BuilderStepDefinition {
  id: string;
  label: string;
  toolboxLabel: string;
  nodeType: string;
  executionType: string;
  executionMode?: 'CLIENT' | 'FINISH' | 'SERVER';
  fields: string[];
  propKeys: string[];
  accentColor: string;
  defaultProps?: Record<string, string>;
  defaultCode?: {
    entrypoint?: string;
    language: 'ts';
    source: string;
  };
  defaultSpecs?: Record<string, unknown>;
  hideOutputs?: boolean;
}

export interface ComponentMeta {
  fields: string[];
  propKeys: string[];
  accentColor: string;
}
