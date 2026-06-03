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

export function normalizeWorkflowConfig(config?: Partial<WorkflowConfig> | null): WorkflowConfig {
  return {
    allowedOrigins: Array.isArray(config?.allowedOrigins)
      ? config.allowedOrigins.filter((origin): origin is string => typeof origin === "string")
      : [...DEFAULT_WORKFLOW_CONFIG.allowedOrigins],
    expirationTimeout: config?.expirationTimeout,
    inactivityTimeout: config?.inactivityTimeout,
    maxConnections: config?.maxConnections,
    resumeConnection: config?.resumeConnection,
    secret: typeof config?.secret === "string" ? config.secret : DEFAULT_WORKFLOW_CONFIG.secret,
  };
}

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
