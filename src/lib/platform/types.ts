export type PlatformSessionStatus = 'ACTIVE' | 'FINISHED';
export type PlatformSessionResultType = 'COMPLETED' | 'TERMINATED' | 'ERROR';

export interface PlatformSessionResult {
  type: PlatformSessionResultType;
  reason: string;
}

export const PlatformEventType = {
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

export type PlatformEventType = (typeof PlatformEventType)[keyof typeof PlatformEventType];

export const SUPPORTED_EVENT_TYPES: ReadonlySet<string> = new Set<string>(
  Object.values(PlatformEventType),
);

export interface PlatformEventEnvelope {
  eventId: string;
  type: PlatformEventType;
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
  events: PlatformEventEnvelope[];
}

export interface PlatformSession {
  sessionId: string;
  workflowId: string;
  createdAt: string;
  lastActivityAt: string;
  eventCount: number;
  status: PlatformSessionStatus;
  result?: PlatformSessionResult;
  events: PlatformEventEnvelope[];
  connections: ConnectionGroup[];
}

export interface PlatformSessionSummary {
  sessionId: string;
  workflowId: string;
  createdAt: string;
  lastActivityAt: string;
  eventCount: number;
  status: PlatformSessionStatus;
  result?: PlatformSessionResult;
}
