export enum PlatformEventType {
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_CONNECTED = 'SESSION_CONNECTED',
  STEP_RENDERED = 'STEP_RENDERED',
  STEP_SUBMITTED = 'STEP_SUBMITTED',
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
  source: string;
  payload: Record<string, unknown>;
}

export interface PlatformSession {
  sessionId: string;
  workflowId: string;
  createdAt: string;
  lastActivityAt: string;
  eventCount: number;
  events: PlatformEventEnvelope[];
}

export interface PlatformSessionSummary {
  sessionId: string;
  workflowId: string;
  createdAt: string;
  lastActivityAt: string;
  eventCount: number;
}
