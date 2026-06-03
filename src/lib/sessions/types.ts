export type SessionStatus = 'ACTIVE' | 'FINISHED';
export type SessionResultType = 'COMPLETED' | 'ERROR' | 'TERMINATED';

export interface SessionResult {
  type: SessionResultType;
  reason: string;
}

export const SessionEventType = {
  SESSION_CREATE: 'SESSION_CREATE',
  SESSION_CONNECTED: 'SESSION_CONNECTED',
  CONNECTION_REJECTED: 'CONNECTION_REJECTED',
  SESSION_REQUESTED: 'SESSION_REQUESTED',
  FINISH_RENDER: 'FINISH_RENDER',
  STEP_RENDERED: 'STEP_RENDERED',
  STEP_CONDITION: 'STEP_CONDITION',
  STEP_START: 'STEP_START',
  STEP_RESPONSE: 'STEP_RESPONSE',
  STEP_SUBMITTED: 'STEP_SUBMITTED',
  ALERT_RENDERED: 'ALERT_RENDERED',
  ALERT_SUBMITTED: 'ALERT_SUBMITTED',
  SESSION_RESULT: 'SESSION_RESULT',
  TAILING_RENDERED: 'TAILING_RENDERED',
  TAILING_CLOSED: 'TAILING_CLOSED',
  SESSION_CLOSED: 'SESSION_CLOSED',
} as const;

export type SessionEventType = (typeof SessionEventType)[keyof typeof SessionEventType];

export const SUPPORTED_EVENT_TYPES: ReadonlySet<string> = new Set<string>(
  Object.values(SessionEventType),
);

export interface SessionEventEnvelope {
  eventId: string;
  type: SessionEventType;
  occurredAt: string;
  sessionId: string;
  workflowId: string;
  connectionId?: string;
  source: string;
  payload: Record<string, unknown>;
}

export type PipeMetricKey =
  | 'browser.inbound_latency_ms'
  | 'browser.interaction_count'
  | 'browser.memory_used_bytes'
  | 'pipe.encrypted_bytes'
  | 'pipe.latency_ms'
  | 'pipe.message_count';

export type PipeMetricPoint = [number, number];

export type PipeMetrics = Record<PipeMetricKey, PipeMetricPoint[]>;

export interface ConnectionGroup {
  connectionId: string;
  connectedAt: string;
  device: Record<string, unknown> | null;
  events: SessionEventEnvelope[];
  metrics: PipeMetrics;
}

export interface Session {
  sessionId: string;
  workflowId: string;
  createdAt: string;
  lastActivityAt: string;
  eventCount: number;
  status: SessionStatus;
  result?: SessionResult;
  events: SessionEventEnvelope[];
  connections: ConnectionGroup[];
}

export interface SessionSummary {
  sessionId: string;
  workflowId: string;
  createdAt: string;
  lastActivityAt: string;
  eventCount: number;
  status: SessionStatus;
  result?: SessionResult;
}
