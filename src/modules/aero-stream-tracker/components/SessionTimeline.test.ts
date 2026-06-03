import assert from "node:assert/strict";
import test from "node:test";

import { type Session, type SessionEventEnvelope, SessionEventType } from "../lib/sessions/types.ts";

import { CONNECTION_LANE_COLORS, createSessionTimelineLayout } from "./SessionTimeline.layout.ts";
import { createTrafficBucketMetrics } from "./SessionTimeline.metrics.ts";
import { createStepTimelineSegments } from "./SessionTimeline.steps.ts";

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

test("derives traffic buckets from the same grouping range as timeline markers", () => {
  const events = session([
    event({
      eventId: "a1",
      occurredAt: "2026-05-16T00:00:00.000Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a2",
      occurredAt: "2026-05-16T00:00:00.200Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a3",
      occurredAt: "2026-05-16T00:00:00.500Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a4",
      occurredAt: "2026-05-16T00:00:01.000Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a5",
      occurredAt: "2026-05-16T00:00:02.000Z",
      connectionId: "connection-a",
    }),
  ]);
  const layout = createSessionTimelineLayout(events, 500);
  const connection = layout.lanes.find((lane) => lane.connectionId === "connection-a");
  const mebibyte = 1024 * 1024;
  const { dashedPoints, eventCountBars, points } = createTrafficBucketMetrics([
    [layout.startMs, mebibyte],
    [layout.startMs + 200, 2 * mebibyte],
    [layout.startMs + 500, mebibyte],
    [layout.startMs + 1000, mebibyte],
    [layout.startMs + 2000, mebibyte],
  ], layout);

  assert.deepEqual(
    dashedPoints.map((point) => point.offsetPercent),
    connection?.markers.map((marker) => marker.offsetPercent),
  );
  assert.deepEqual(eventCountBars.map((bar) => bar.value), [2, 1, 1, 1]);
  assert.deepEqual(dashedPoints.map((point) => point.value), [3, 1, 1, 1]);
  assert.deepEqual(points.map((point) => Number(point.value.toFixed(3))), [3, 4, 5, 2]);
});

test("uses real elapsed time, normalizes coarse traffic buckets, and ignores out-of-range samples", () => {
  const events = session([
    event({
      eventId: "a1",
      occurredAt: "2026-05-16T00:00:00.000Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a2",
      occurredAt: "2026-05-16T00:00:20.000Z",
      connectionId: "connection-a",
    }),
  ]);
  const layout = createSessionTimelineLayout(events, 5000);
  const mebibyte = 1024 * 1024;
  const { dashedPoints, points } = createTrafficBucketMetrics([
    [layout.startMs, 5 * mebibyte],
    [layout.startMs + 20_000, 5 * mebibyte],
    [layout.startMs + 30_000, 100 * mebibyte],
  ], layout);

  assert.deepEqual(dashedPoints.map((point) => point.offsetPercent), [0, 100]);
  assert.deepEqual(dashedPoints.map((point) => point.value), [5, 5]);
  assert.deepEqual(points.map((point) => Number(point.value.toFixed(3))), [1, 1]);
});

test("keeps the first traffic rate stable when zooming into smaller buckets", () => {
  const events = session([
    event({
      eventId: "a1",
      occurredAt: "2026-05-16T00:00:00.000Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a2",
      occurredAt: "2026-05-16T00:00:10.000Z",
      connectionId: "connection-a",
    }),
  ]);
  const mebibyte = 1024 * 1024;
  const samples: [number, number][] = [
    [new Date("2026-05-16T00:00:00.000Z").getTime(), 5 * mebibyte],
  ];
  const coarseLayout = createSessionTimelineLayout(events, 5000);
  const fineLayout = createSessionTimelineLayout(events, 5);
  const coarsePoint = createTrafficBucketMetrics(samples, coarseLayout).points[0];
  const finePoint = createTrafficBucketMetrics(samples, fineLayout).points[0];

  assert.equal(coarsePoint?.value, 1);
  assert.equal(finePoint?.value, 5);
});

test("includes the current grouped bucket in the traffic average", () => {
  const events = session([
    event({
      eventId: "a1",
      occurredAt: "2026-05-16T00:00:00.000Z",
      connectionId: "connection-a",
    }),
    event({
      eventId: "a2",
      occurredAt: "2026-05-16T00:00:01.000Z",
      connectionId: "connection-a",
    }),
  ]);
  const layout = createSessionTimelineLayout(events, 1000);
  const mebibyte = 1024 * 1024;
  const { points } = createTrafficBucketMetrics([
    [layout.startMs, 2 * mebibyte],
    [layout.startMs + 1000, 3 * mebibyte],
  ], layout);

  assert.deepEqual(points.map((point) => point.value), [2, 5]);
});

test("creates step timeline segments from step start and ignores repeated renders of the same step", () => {
  const events = session([
    event({ eventId: "start", occurredAt: "2026-05-16T00:00:00.000Z" }),
    event({
      eventId: "step-a-start",
      occurredAt: "2026-05-16T00:00:00.500Z",
      payload: { step: { id: "step-a", name: "Step A", type: "form" } },
      type: SessionEventType.STEP_START,
    }),
    event({
      eventId: "step-a",
      occurredAt: "2026-05-16T00:00:01.000Z",
      payload: { step: { id: "step-a", name: "Step A", type: "form" } },
      type: SessionEventType.STEP_RENDERED,
    }),
    event({
      eventId: "step-a-rerender",
      occurredAt: "2026-05-16T00:00:02.000Z",
      payload: { step: { id: "step-a", name: "Step A", type: "form" } },
      type: SessionEventType.STEP_RENDERED,
    }),
    event({
      eventId: "step-b",
      occurredAt: "2026-05-16T00:00:03.000Z",
      payload: { step: { id: "step-b", name: "Step B", type: "BackendComponent" } },
      type: SessionEventType.STEP_START,
    }),
    event({
      eventId: "closed",
      occurredAt: "2026-05-16T00:00:05.000Z",
      type: SessionEventType.SESSION_CLOSED,
    }),
  ]);
  const layout = createSessionTimelineLayout(events, 1000);
  const segments = createStepTimelineSegments(events.events, layout);

  assert.deepEqual(segments.map((segment) => segment.stepId), ["step-a", "step-b"]);
  assert.deepEqual(segments.map((segment) => segment.label), ["Step A", "Step B"]);
  assert.deepEqual(segments.map((segment) => segment.startOffsetPercent), [0, 60]);
  assert.deepEqual(segments.map((segment) => segment.endOffsetPercent), [60, 100]);
  assert.deepEqual(segments.map((segment) => segment.startTimeMs), [
    new Date("2026-05-16T00:00:00.000Z").getTime(),
    new Date("2026-05-16T00:00:03.000Z").getTime(),
  ]);
  assert.deepEqual(segments.map((segment) => segment.endTimeMs), [
    new Date("2026-05-16T00:00:03.000Z").getTime(),
    new Date("2026-05-16T00:00:05.000Z").getTime(),
  ]);
});
