export interface WorkflowExecution {
  mode: string;
  type: string;
}

export interface WorkflowTransition {
  condition: boolean | { [x: string]: (string | { var: string; })[]; };
  next: string;
}

export interface WorkflowStep {
  execution: WorkflowExecution;
  name: string;
  props: Record<string, string>;
  specs: Record<string, unknown>;
  transitions: WorkflowTransition[];
}

export interface TowerWorkflow {
  id?: string;
  name: string;
  version: number;
  start: string;
  steps: Record<string, WorkflowStep>;
  globals: Record<string, unknown>;
}

export interface WorkflowMetadata {
  id: string;
  name: string;
}