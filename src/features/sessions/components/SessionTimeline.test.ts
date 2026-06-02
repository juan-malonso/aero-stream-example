import assert from "node:assert/strict";
import test from "node:test";

import { type Session, type SessionEventEnvelope,SessionEventType } from "../../../lib/sessions/types.ts";

import { CONNECTION_LANE_COLORS, createSessionTimelineLayout } from "./SessionTimeline.layout.ts";

function event(overrides: Partial<SessionEventEnvelope>): SessionEventEnvelope {
  return {
    eventId: overrides.eventId ?? "event-1",
    type: overrides.type ?? SessionEventType.SESSION_CREATE,
    occurredAt: overrides.occurredAt ?? "2026-05-16T00:00:00.000Z",
    sessionId: "session-1",
    workflowId: "workflow-1",
    connectionId: overrides.connectionId,
    source: "test",
    payload: overrides.payload ?? {},
  };
}

function session(events: SessionEventEnvelope[]): Session {
  const connectionIds = Array.from(new Set(
    events.map((item) => item.connectionId).filter((connectionId): connectionId is string => Boolean(connectionId)),
  ));

  return {
    sessionId: "session-1",
    workflowId: "workflow-1",
    createdAt: events[0]?.occurredAt ?? "2026-05-16T00:00:00.000Z",
    lastActivityAt: events.at(-1)?.occurredAt ?? "2026-05-16T00:00:00.000Z",
    eventCount: events.length,
    status: "ACTIVE",
    events,
    connections: connectionIds.map((connectionId) => {
      const connectionEvents = events.filter((item) => item.connectionId === connectionId);
      return {
        connectionId,
        connectedAt: connectionEvents[0]?.occurredAt ?? events[0]?.occurredAt ?? "2026-05-16T00:00:00.000Z",
        device: null,
        events: connectionEvents,
      };
    }),
  };
}

test("positions markers proportionally by elapsed time", () => {
  const layout = createSessionTimelineLayout(session([
    event({ eventId: "start", occurredAt: "2026-05-16T00:00:00.000Z" }),
    event({
      eventId: "middle",
      occurredAt: "2026-05-16T00:01:00.000Z",
      connectionId: "connection-a",
      type: SessionEventType.SESSION_CONNECTED,
    }),
    event({ eventId: "end", occurredAt: "2026-05-16T00:04:00.000Z" }),
  ]));

  const branch = layout.lanes.find((lane) => lane.connectionId === "connection-a");

  assert.equal(layout.durationMs, 240_000);
  assert.equal(branch?.markers[0]?.offsetPercent, 25);
});

test("uses the last close event as the timeline end", () => {
  const layout = createSessionTimelineLayout(session([
    event({ eventId: "start", occurredAt: "2026-05-16T00:00:00.000Z" }),
    event({
      eventId: "close-a",
      occurredAt: "2026-05-16T00:00:01.000Z",
      connectionId: "connection-a",
      type: SessionEventType.TAILING_CLOSED,
    }),
    event({
      eventId: "later",
      occurredAt: "2026-05-16T00:00:02.000Z",
      connectionId: "connection-a",
      type: SessionEventType.SESSION_RESULT,
    }),
  ]));

  const connection = layout.lanes.find((lane) => lane.connectionId === "connection-a");

  assert.equal(layout.durationMs, 1_000);
  assert.equal(connection?.markers.at(-1)?.offsetPercent, 100);
});

test("creates one main lane and one connection lane per connection", () => {
  const layout = createSessionTimelineLayout(session([
    event({ eventId: "start", occurredAt: "2026-05-16T00:00:00.000Z" }),
    event({
      eventId: "a",
      occurredAt: "2026-05-16T00:01:00.000Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "b",
      occurredAt: "2026-05-16T00:03:00.000Z",
      connectionId: "connection-b",
    }),
  ]));

  assert.deepEqual(
    layout.lanes.map((lane) => lane.id),
    ["main", "connection-a", "connection-b"],
  );
});

test("groups events that occur in the same tenth-second bucket", () => {
  const layout = createSessionTimelineLayout(session([
    event({
      eventId: "a1",
      occurredAt: "2026-05-16T00:01:00.000Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a2",
      occurredAt: "2026-05-16T00:01:00.095Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a3",
      occurredAt: "2026-05-16T00:01:00.100Z",
      connectionId: "connection-a",
    }),
  ]));

  const connection = layout.lanes.find((lane) => lane.connectionId === "connection-a");

  assert.equal(connection?.markers.length, 2);
  assert.deepEqual(connection?.markers.map((marker) => marker.eventCount), [2, 1]);
  assert.deepEqual(connection?.markers[0]?.events.map((item) => item.eventId), ["a1", "a2"]);
});

test("uses the configured bucket size when grouping timeline markers", () => {
  const events = session([
    event({
      eventId: "a1",
      occurredAt: "2026-05-16T00:01:00.000Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a2",
      occurredAt: "2026-05-16T00:01:00.008Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a3",
      occurredAt: "2026-05-16T00:01:00.011Z",
      connectionId: "connection-a",
    }),
  ]);
  const coarseLayout = createSessionTimelineLayout(events, 10);
  const fineLayout = createSessionTimelineLayout(events, 5);
  const coarseConnection = coarseLayout.lanes.find((lane) => lane.connectionId === "connection-a");
  const fineConnection = fineLayout.lanes.find((lane) => lane.connectionId === "connection-a");

  assert.deepEqual(coarseConnection?.markers.map((marker) => marker.eventCount), [2, 1]);
  assert.deepEqual(fineConnection?.markers.map((marker) => marker.eventCount), [1, 1, 1]);
});

test("places server events on the shared session lane", () => {
  const layout = createSessionTimelineLayout(session([
    event({ eventId: "start", occurredAt: "2026-05-16T00:00:00.000Z" }),
    event({
      eventId: "server",
      occurredAt: "2026-05-16T00:00:00.100Z",
      connectionId: "connection-a",
      type: SessionEventType.STEP_RESPONSE,
    }),
    event({
      eventId: "client",
      occurredAt: "2026-05-16T00:00:00.200Z",
      connectionId: "connection-a",
      type: SessionEventType.STEP_SUBMITTED,
    }),
  ]));

  const main = layout.lanes.find((lane) => lane.kind === "main");
  const connection = layout.lanes.find((lane) => lane.connectionId === "connection-a");

  assert.deepEqual(
    main?.markers.flatMap((marker) => marker.events.map((item) => item.eventId)),
    ["start", "server"],
  );
  assert.deepEqual(
    connection?.markers.flatMap((marker) => marker.events.map((item) => item.eventId)),
    ["client"],
  );
});

test("assigns reusable contrasting colors to connection lanes", () => {
  const connectionEvents = Array.from({ length: CONNECTION_LANE_COLORS.length + 1 }, (_, index) =>
    event({
      eventId: `connection-${index}`,
      occurredAt: `2026-05-16T00:00:0${index}.000Z`,
      connectionId: `connection-${index}`,
      type: SessionEventType.SESSION_CONNECTED,
    }),
  );
  const layout = createSessionTimelineLayout(session(connectionEvents));
  const connectionColors = layout.lanes
    .filter((lane) => lane.kind === "connection")
    .map((lane) => lane.color);

  assert.deepEqual(connectionColors.slice(0, CONNECTION_LANE_COLORS.length), [...CONNECTION_LANE_COLORS]);
  assert.equal(connectionColors.at(-1), CONNECTION_LANE_COLORS[0]);
});
