export interface WorkflowExecution {
  mode: string;
  type: string;
}

export interface WorkflowTransition {
  condition: Record<string, (string | { var: string; })[]> | boolean;
  next: string;
}

export interface WorkflowStep {
  code?: {
    entrypoint?: string;
    language: "ts";
    source: string;
  };
  execution: WorkflowExecution;
  name: string;
  props: Record<string, string>;
  specs: Record<string, unknown>;
  transitions: WorkflowTransition[];
}

export interface WorkflowConfig {
  allowedOrigins: string[];
  expirationTimeout?: number;
  inactivityTimeout?: number;
  maxConnections?: number;
  resumeConnection?: boolean;
  secret: string;
}

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  allowedOrigins: ["http://localhost:3000"],
  secret: "my-super-secret-token",
};

export interface TowerWorkflow {
  id?: string;
  name: string;
  version: number;
  start: string;
  steps: Record<string, WorkflowStep>;
  globals: Record<string, unknown>;
  config: WorkflowConfig;
}

export interface WorkflowMetadata {
  id: string;
  name: string;
}
