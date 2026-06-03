import { colors } from "../../../styles/tokens.ts";
import { type Session, type SessionEventEnvelope, SessionEventType } from "../lib/sessions/types.ts";

const COLLISION_THRESHOLD_PERCENT = 2.75;
export const TIMELINE_BUCKET_MS = 100;
export const CONNECTION_LANE_COLORS = [
  colors.cyan500,
  colors.emerald500,
  colors.violet500,
  colors.red500,
  colors.orange500,
  colors.blue500,
  colors.pink500,
] as const;

export interface TimelineMarker {
  event: SessionEventEnvelope;
  events: SessionEventEnvelope[];
  eventCount: number;
  elapsedMs: number;
  offsetPercent: number;
  stackIndex: number;
}

export interface TimelineLane {
  id: string;
  label: string;
  kind: "connection" | "main";
  color: string;
  connectionId?: string;
  endOffsetPercent: number;
  startOffsetPercent: number;
  markers: TimelineMarker[];
}

export interface SessionTimelineLayout {
  bucketMs: number;
  durationMs: number;
  startMs: number;
  endMs: number;
  lanes: TimelineLane[];
}

function parseEventTime(event: SessionEventEnvelope, fallbackIndex: number): number {
  const timestamp = new Date(event.occurredAt).getTime();
  return Number.isNaN(timestamp) ? fallbackIndex : timestamp;
}

function compareEvents(a: SessionEventEnvelope, b: SessionEventEnvelope): number {
  const timeDelta = parseEventTime(a, 0) - parseEventTime(b, 0);
  if (timeDelta !== 0) return timeDelta;
  return a.eventId.localeCompare(b.eventId);
}

function labelConnection(connectionId: string, index: number): string {
  const suffix = connectionId.length > 10 ? `${connectionId.slice(0, 10)}...` : connectionId;
  return `CONN #${index + 1} / ${suffix}`;
}

function isServerEvent(event: SessionEventEnvelope): boolean {
  return event.type === SessionEventType.STEP_START
    || event.type === SessionEventType.STEP_CONDITION
    || event.type === SessionEventType.STEP_RESPONSE;
}

function isCloseEvent(event: SessionEventEnvelope): boolean {
  return event.type === SessionEventType.TAILING_CLOSED
    || event.type === SessionEventType.SESSION_CLOSED;
}

function getLastCloseEvent(events: SessionEventEnvelope[]): SessionEventEnvelope | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (isCloseEvent(events[index])) return events[index];
  }
  return undefined;
}

function createMarkers(
  events: SessionEventEnvelope[],
  startMs: number,
  durationMs: number,
  bucketMs: number,
): TimelineMarker[] {
  const buckets = new Map<number, SessionEventEnvelope[]>();

  events.forEach((event) => {
    const elapsedMs = Math.max(0, parseEventTime(event, startMs) - startMs);
    const bucketStartMs = Math.floor(elapsedMs / bucketMs) * bucketMs;
    const bucketEvents = buckets.get(bucketStartMs) ?? [];
    bucketEvents.push(event);
    buckets.set(bucketStartMs, bucketEvents);
  });

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left - right)
    .map(([bucketStartMs, bucketEvents]) => {
      const offsetPercent = durationMs === 0 ? 0 : Math.min(100, (bucketStartMs / durationMs) * 100);
      return {
        event: bucketEvents[0],
        events: bucketEvents,
        eventCount: bucketEvents.length,
        elapsedMs: bucketStartMs,
        offsetPercent,
        stackIndex: 0,
      };
    });
}

function stackDenseMarkers(markers: TimelineMarker[]): TimelineMarker[] {
  const stackTails: number[] = [];

  return markers.map((marker) => {
    const stackIndex = stackTails.findIndex(
      (tail) => marker.offsetPercent - tail >= COLLISION_THRESHOLD_PERCENT,
    );
    const nextStackIndex = stackIndex === -1 ? stackTails.length : stackIndex;
    stackTails[nextStackIndex] = marker.offsetPercent;

    return { ...marker, stackIndex: nextStackIndex };
  });
}

export function createSessionTimelineLayout(
  session: Session,
  bucketMs: number = TIMELINE_BUCKET_MS,
): SessionTimelineLayout {
  const sortedEvents = [...session.events].sort(compareEvents);
  const startMs = sortedEvents.length > 0 ? parseEventTime(sortedEvents[0], 0) : 0;
  const lastCloseEvent = getLastCloseEvent(sortedEvents);
  const endMs = sortedEvents.length > 0
    ? parseEventTime(lastCloseEvent ?? sortedEvents.at(-1)!, startMs)
    : startMs;
  const durationMs = Math.max(0, endMs - startMs);

  const globalEvents = sortedEvents.filter((event) => !event.connectionId || isServerEvent(event));
  const mainMarkers = stackDenseMarkers(createMarkers(globalEvents, startMs, durationMs, bucketMs));

  const lanes: TimelineLane[] = [
    {
      id: "main",
      label: "Session",
      kind: "main",
      color: colors.yellow500,
      endOffsetPercent: 100,
      startOffsetPercent: 0,
      markers: mainMarkers,
    },
  ];

  session.connections.forEach((connection, index) => {
    const events = sortedEvents.filter(
      (event) => event.connectionId === connection.connectionId && !isServerEvent(event),
    );
    const markers = stackDenseMarkers(createMarkers(events, startMs, durationMs, bucketMs));

    lanes.push({
      id: connection.connectionId,
      label: labelConnection(connection.connectionId, index),
      kind: "connection",
      color: CONNECTION_LANE_COLORS[index % CONNECTION_LANE_COLORS.length],
      connectionId: connection.connectionId,
      endOffsetPercent: markers.at(-1)?.offsetPercent ?? markers[0]?.offsetPercent ?? 0,
      startOffsetPercent: markers[0]?.offsetPercent ?? 0,
      markers,
    });
  });

  return {
    bucketMs,
    durationMs,
    startMs,
    endMs,
    lanes,
  };
}
