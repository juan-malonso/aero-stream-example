import type { Session } from "../../../lib/sessions/types.ts";

import type { SessionTimelineLayout } from "./SessionTimeline.layout.ts";

const BYTES_PER_MEBIBYTE = 1024 * 1024;
const TRAFFIC_AVERAGE_WINDOW_MS = 1000;

export interface MetricPoint {
  offsetPercent: number;
  timestampMs?: number;
  value: number;
}

export interface MetricBar {
  endOffsetPercent: number;
  offsetPercent: number;
  startOffsetPercent: number;
  timestampMs: number;
  value: number;
}

export interface MetricSeries {
  color: string;
  dashedPoints?: MetricPoint[];
  eventCountBars?: MetricBar[];
  id: string;
  label: string;
  lineStyle?: "dashed" | "solid";
  points: MetricPoint[];
}

interface TrafficBucket {
  bucketStartMs: number;
  count: number;
  totalBytes: number;
}

export function connectionMetricLabel(index: number): string {
  return `CONN #${index + 1}`;
}

export function metricOffsetPercent(timestampMs: number, layout: SessionTimelineLayout): number {
  if (layout.durationMs <= 0) return 0;
  return Math.max(0, Math.min(100, ((timestampMs - layout.startMs) / layout.durationMs) * 100));
}

export function createTrafficSeries(session: Session, layout: SessionTimelineLayout): MetricSeries[] {
  return layout.lanes
    .filter((lane) => lane.kind === "connection")
    .flatMap((lane, connectionIndex) => {
      const connection = session.connections.find((item) => item.connectionId === lane.connectionId);
      const samples = [...connection?.metrics["pipe.encrypted_bytes"] ?? []]
        .sort(([left], [right]) => left - right);
      if (samples.length === 0) return [];

      const { dashedPoints, eventCountBars, points } = createTrafficBucketMetrics(samples, layout);
      if (points.length === 0 && dashedPoints.length === 0) return [];

      return [{
        color: lane.color,
        dashedPoints,
        eventCountBars,
        id: lane.id,
        label: connectionMetricLabel(connectionIndex),
        points,
      }];
    });
}

export function createTrafficBucketMetrics(
  samples: [number, number][],
  layout: SessionTimelineLayout,
): { dashedPoints: MetricPoint[]; eventCountBars: MetricBar[]; points: MetricPoint[] } {
  const bucketTotals = new Map<number, TrafficBucket>();
  const visibleSamples = samples.filter(([timestampMs]) =>
    timestampMs >= layout.startMs && timestampMs <= layout.endMs,
  );

  visibleSamples.forEach(([timestampMs, bytes]) => {
    const elapsedMs = Math.max(0, timestampMs - layout.startMs);
    const bucketStartMs = layout.startMs + Math.floor(elapsedMs / layout.bucketMs) * layout.bucketMs;
    const bucket = bucketTotals.get(bucketStartMs) ?? {
      bucketStartMs,
      count: 0,
      totalBytes: 0,
    };
    bucket.count += 1;
    bucket.totalBytes += bytes;
    bucketTotals.set(bucketStartMs, bucket);
  });

  const buckets = Array.from(bucketTotals.values())
    .sort((left, right) => left.bucketStartMs - right.bucketStartMs);

  const eventCountBars = buckets.map((bucket) => {
    const bucketEndMs = Math.min(layout.endMs, bucket.bucketStartMs + layout.bucketMs);

    return {
      endOffsetPercent: metricOffsetPercent(bucketEndMs, layout),
      offsetPercent: metricOffsetPercent(bucket.bucketStartMs, layout),
      startOffsetPercent: metricOffsetPercent(bucket.bucketStartMs, layout),
      timestampMs: bucket.bucketStartMs,
      value: bucket.count,
    };
  });

  const dashedPoints = buckets.map((bucket) => ({
    offsetPercent: metricOffsetPercent(bucket.bucketStartMs, layout),
    timestampMs: bucket.bucketStartMs,
    value: bucket.totalBytes / BYTES_PER_MEBIBYTE,
  }));

  const points = buckets.map((bucket) => {
    const windowStartMs = bucket.bucketStartMs - TRAFFIC_AVERAGE_WINDOW_MS;
    const previousSecondBytes = visibleSamples
      .filter(([timestampMs]) => timestampMs >= windowStartMs && timestampMs < bucket.bucketStartMs)
      .reduce((total, [, bytes]) => total + bytes, 0);
    const secondsPerBucket = Math.max(1, layout.bucketMs / 1000);

    return {
      offsetPercent: metricOffsetPercent(bucket.bucketStartMs, layout),
      timestampMs: bucket.bucketStartMs,
      value: ((previousSecondBytes + bucket.totalBytes) / BYTES_PER_MEBIBYTE) / secondsPerBucket,
    };
  });

  return { dashedPoints, eventCountBars, points };
}
