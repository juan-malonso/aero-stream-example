export type PlatformSessionStatus = 'ACTIVE' | 'FINISHED';
export type PlatformSessionResultType = 'COMPLETED' | 'TERMINATED' | 'ERROR';

export interface PlatformSessionResult {
  type: PlatformSessionResultType;
  reason: string;
}

export enum PlatformEventType {
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_CONNECTED = 'SESSION_CONNECTED',
  STEP_RENDERED = 'STEP_RENDERED',
  STEP_SUBMITTED = 'STEP_SUBMITTED',
  SESSION_RESULT = 'SESSION_RESULT',
}

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
