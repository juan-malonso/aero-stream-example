export type SessionStatus = 'ACTIVE' | 'FINISHED';
export type SessionResultType = 'COMPLETED' | 'TERMINATED' | 'ERROR';

export interface SessionResult {
  type: SessionResultType;
  reason: string;
}

export const SessionEventType = {
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_CONNECTED: 'SESSION_CONNECTED',
  SESSION_REQUESTED: 'SESSION_REQUESTED',
  STEP_RENDERED: 'STEP_RENDERED',
  STEP_SUBMITTED: 'STEP_SUBMITTED',
  ALERT_RENDERED: 'ALERT_RENDERED',
  ALERT_RESPONDED: 'ALERT_RESPONDED',
  SESSION_RESULT: 'SESSION_RESULT',
  TAILING_STEP: 'TAILING_STEP',
  TAILING_END: 'TAILING_END',
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

export interface ConnectionGroup {
  connectionId: string;
  connectedAt: string;
  device: Record<string, unknown> | null;
  events: SessionEventEnvelope[];
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
