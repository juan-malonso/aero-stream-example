"use client";

import { type MouseEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type WheelEvent } from "react";

import { type Session, type SessionEventEnvelope, SessionEventType } from "@/lib/sessions/types";
import { openVideo } from "@/lib/shared/video/downloadService";
import { colors, radii, shadows, typography } from "@/styles/tokens";

import { EventCard } from "./EventCard";
import type { SessionTimelineLayout, TimelineLane, TimelineMarker } from "./SessionTimeline.layout";
import { createSessionTimelineLayout } from "./SessionTimeline.layout";
import {
  connectionMetricLabel,
  createTrafficSeries,
  metricOffsetPercent,
  type MetricPoint,
  type MetricSeries,
} from "./SessionTimeline.metrics";

const MIN_CANVAS_WIDTH = 1180;
const MAX_CANVAS_WIDTH = 80000;
const PIXELS_PER_EVENT = 42;
const PIXELS_PER_MINUTE = 220;
const TRAFFIC_HEIGHT = 210;
const BYTES_PER_MEBIBYTE = 1024 * 1024;
const LABEL_COLUMN_WIDTH_REM = 12.5;
const LABEL_COLUMN_WIDTH = `${LABEL_COLUMN_WIDTH_REM}rem`;
const LABEL_COLUMN_WIDTH_PX = LABEL_COLUMN_WIDTH_REM * 16;
const EVENT_CARD_WIDTH_REM = 24;
const EVENT_CARD_WIDTH = `${EVENT_CARD_WIDTH_REM}rem`;
const EVENT_CARD_TRAILING_SPACE = "0rem";
const EVENT_CARD_ROW_HEIGHT_REM = 5.75;
const EVENT_CARD_ASSUMED_ROOT_FONT_SIZE_PX = 16;
const EVENT_CARD_COLLISION_GAP_PX = 16;
const EVENT_CARD_ROW_GAP_PX = 12;
const EVENT_CARD_STRIP_TOP_PADDING_PX = 12;
const EVENT_CARD_STRIP_BOTTOM_PADDING_PX = 24;
const TIMELINE_LANE_GAP = "0.5rem";
const TIMELINE_LANE_HEIGHT = "2.1rem";
const FLOATING_BODY_CONTROL_TOP = "0.5rem";
const FLOATING_CONTROL_PADDING = "0.2rem";
const FLOATING_ICON_BUTTON_SIZE = "1.65rem";
const FLOATING_TEXT_BUTTON_HEIGHT = "1.65rem";
const GRID_COLUMN_GAP_PX = 12;
const MIN_CLOCK_LABEL_SPACING_PX = 112;
const MIN_ELAPSED_LABEL_SPACING_PX = 76;
const MIN_INTERMEDIATE_TICK_SPACING_PX = 14;
const INTERMEDIATE_TICK_MIN_MAJOR_SPACING_PX = 86;
const POST_SESSION_VISUAL_SPACE_PX = 512;
const MINIMUM_ALLOWED_ZOOM_BUCKET_MS = 5;

interface TimelineZoomLevel {
  bucketMs: number;
  clockLabelIntervalMs: number;
  elapsedLabelIntervalMs: number;
  label: string;
  pixelsPerTick: number;
  tickMs: number;
}

const TIMELINE_ZOOM_LEVELS: TimelineZoomLevel[] = [
  {
    bucketMs: 20_000,
    clockLabelIntervalMs: 60_000,
    elapsedLabelIntervalMs: 20_000,
    label: "20s",
    pixelsPerTick: 54,
    tickMs: 20_000,
  },
  {
    bucketMs: 10_000,
    clockLabelIntervalMs: 30_000,
    elapsedLabelIntervalMs: 10_000,
    label: "10s",
    pixelsPerTick: 48,
    tickMs: 10_000,
  },
  {
    bucketMs: 5000,
    clockLabelIntervalMs: 10_000,
    elapsedLabelIntervalMs: 5000,
    label: "5s",
    pixelsPerTick: 44,
    tickMs: 5000,
  },
  {
    bucketMs: 2000,
    clockLabelIntervalMs: 10_000,
    elapsedLabelIntervalMs: 2000,
    label: "2s",
    pixelsPerTick: 42,
    tickMs: 2000,
  },
  {
    bucketMs: 1000,
    clockLabelIntervalMs: 5000,
    elapsedLabelIntervalMs: 1000,
    label: "1s",
    pixelsPerTick: 42,
    tickMs: 1000,
  },
  {
    bucketMs: 500,
    clockLabelIntervalMs: 2000,
    elapsedLabelIntervalMs: 500,
    label: "500ms",
    pixelsPerTick: 34,
    tickMs: 500,
  },
  {
    bucketMs: 250,
    clockLabelIntervalMs: 1000,
    elapsedLabelIntervalMs: 500,
    label: "250ms",
    pixelsPerTick: 28,
    tickMs: 250,
  },
  {
    bucketMs: 100,
    clockLabelIntervalMs: 1000,
    elapsedLabelIntervalMs: 500,
    label: "100ms",
    pixelsPerTick: 26,
    tickMs: 100,
  },
  {
    bucketMs: 50,
    clockLabelIntervalMs: 1000,
    elapsedLabelIntervalMs: 250,
    label: "50ms",
    pixelsPerTick: 21,
    tickMs: 50,
  },
  {
    bucketMs: 25,
    clockLabelIntervalMs: 1000,
    elapsedLabelIntervalMs: 100,
    label: "25ms",
    pixelsPerTick: 18,
    tickMs: 25,
  },
  {
    bucketMs: 10,
    clockLabelIntervalMs: 1000,
    elapsedLabelIntervalMs: 50,
    label: "10ms",
    pixelsPerTick: 15,
    tickMs: 10,
  },
  {
    bucketMs: 5,
    clockLabelIntervalMs: 1000,
    elapsedLabelIntervalMs: 50,
    label: "5ms",
    pixelsPerTick: 12,
    tickMs: 5,
  },
];

const panelColors = {
  border: colors.gray200,
  card: colors.white,
  cardSoft: colors.gray50,
  control: "color-mix(in srgb, var(--color-white) 88%, transparent)",
  controlDisabled: "color-mix(in srgb, var(--color-gray100) 72%, transparent)",
  controlMuted: "color-mix(in srgb, var(--color-gray500) 62%, transparent)",
  line: "color-mix(in srgb, var(--color-gray400) 54%, transparent)",
  muted: colors.gray500,
  panel: `linear-gradient(135deg, ${colors.white}, ${colors.gray50})`,
  primarySoft: "color-mix(in srgb, var(--color-yellow500) 18%, transparent)",
  primaryStroke: "color-mix(in srgb, var(--color-yellow500) 52%, transparent)",
  text: colors.gray900,
};

type ChartMode = "latency" | "memory" | "traffic";

const CHART_MODES: ChartMode[] = ["traffic", "latency", "memory"];

interface ChartHoverState {
  leftPercent: number;
  rows: {
    color: string;
    label: string;
    style: "bar" | "dashed" | "solid";
    value: string;
  }[];
  timeLabel: string;
}

interface EventCardEntry {
  accentColor?: string;
  event: SessionEventEnvelope;
  offsetPercent: number;
  rowIndex?: number;
}

interface PlacedEventCardEntry extends EventCardEntry {
  rowIndex: number;
}

interface HoveredTimelinePoint {
  eventIds: ReadonlySet<string>;
  markerId: string;
}

function formatElapsed(milliseconds: number): string {
  if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
  const seconds = milliseconds / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatClockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatClockTimeWithMilliseconds(timestamp: number): string {
  const date = new Date(timestamp);
  const milliseconds = `${date.getMilliseconds()}`.padStart(3, "0");
  return `${formatClockTime(timestamp)}.${milliseconds}`;
}

function formatTimelineDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return milliseconds % 1 === 0 ? `${milliseconds}ms` : `${milliseconds.toFixed(1)}ms`;
  }
  const seconds = milliseconds / 1000;
  return `${seconds.toFixed(Number.isInteger(seconds) ? 0 : 3)}s`;
}

function eventLabel(type: SessionEventType): string {
  return type
    .split("_")
    .map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function maxAllowedZoomBucketMs(durationMs: number): number {
  return Math.max(MINIMUM_ALLOWED_ZOOM_BUCKET_MS, durationMs / 20);
}

function coarsestAllowedZoomIndex(durationMs: number): number {
  const maxBucketMs = maxAllowedZoomBucketMs(durationMs);
  const allowedIndex = TIMELINE_ZOOM_LEVELS.findIndex((zoomLevel) => zoomLevel.bucketMs <= maxBucketMs);

  return allowedIndex === -1 ? TIMELINE_ZOOM_LEVELS.length - 1 : allowedIndex;
}

function canvasWidth(layout: SessionTimelineLayout, eventCount: number, zoomLevel: TimelineZoomLevel): number {
  const durationMinutes = layout.durationMs / 60_000;
  const durationWidth = MIN_CANVAS_WIDTH + durationMinutes * PIXELS_PER_MINUTE;
  const densityWidth = MIN_CANVAS_WIDTH + eventCount * PIXELS_PER_EVENT;
  const bucketCount = Math.ceil(layout.durationMs / zoomLevel.tickMs);
  const bucketWidth = MIN_CANVAS_WIDTH + bucketCount * zoomLevel.pixelsPerTick;
  return Math.min(MAX_CANVAS_WIDTH, Math.max(MIN_CANVAS_WIDTH, durationWidth, densityWidth, bucketWidth));
}

function visualTimelineDuration(durationMs: number, activeWidth: number, visualWidth: number): number {
  if (durationMs <= 0 || activeWidth <= 0) return durationMs;
  return Math.max(durationMs, Math.ceil((durationMs * visualWidth) / activeWidth));
}

function createMemorySeries(session: Session, layout: SessionTimelineLayout): MetricSeries[] {
  return layout.lanes
    .filter((lane) => lane.kind === "connection")
    .flatMap((lane, connectionIndex) => {
      const connection = session.connections.find((item) => item.connectionId === lane.connectionId);
      const samples = connection?.metrics["browser.memory_used_bytes"] ?? [];
      if (samples.length === 0) return [];
      const points = samples
        .slice()
        .sort(([left], [right]) => left - right)
        .map(([timestampMs, bytes]) => ({
          offsetPercent: metricOffsetPercent(timestampMs, layout),
          timestampMs,
          value: bytes / BYTES_PER_MEBIBYTE,
        }));

      return [{
        color: lane.color,
        id: lane.id,
        label: connectionMetricLabel(connectionIndex),
        points,
      }];
    });
}

function createLatencySeries(session: Session, layout: SessionTimelineLayout): MetricSeries[] {
  return layout.lanes
    .filter((lane) => lane.kind === "connection")
    .flatMap((lane, connectionIndex) => {
      const connection = session.connections.find((item) => item.connectionId === lane.connectionId);
      const samples = connection?.metrics["pipe.latency_ms"] ?? [];
      if (samples.length === 0) return [];
      const points = samples
        .slice()
        .sort(([left], [right]) => left - right)
        .map(([timestampMs, value]) => ({
          offsetPercent: metricOffsetPercent(timestampMs, layout),
          timestampMs,
          value,
        }));

      return [{
        color: lane.color,
        id: lane.id,
        label: connectionMetricLabel(connectionIndex),
        points,
      }];
    });
}

function metricPath(
  points: MetricPoint[],
  width: number,
  height: number,
  activeEndPercent: number,
  valueMax: number,
): string {
  return points
    .map((point, index) => {
      const x = (scaleOffsetPercent(point.offsetPercent, activeEndPercent) / 100) * width;
      const y = height - (point.value / valueMax) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function scaleOffsetPercent(offsetPercent: number, activeEndPercent: number): number {
  return (offsetPercent * activeEndPercent) / 100;
}

function metricAreaPath(
  points: MetricPoint[],
  width: number,
  height: number,
  activeEndPercent: number,
  valueMax: number,
): string {
  const line = metricPath(points, width, height, activeEndPercent, valueMax);
  const last = points.at(-1);
  const first = points[0];
  const lastX = last ? (scaleOffsetPercent(last.offsetPercent, activeEndPercent) / 100) * width : 0;
  const firstX = first ? (scaleOffsetPercent(first.offsetPercent, activeEndPercent) / 100) * width : 0;
  return `${line} L ${lastX.toFixed(2)} ${height} L ${firstX.toFixed(2)} ${height} Z`;
}

function chartValueMax(mode: ChartMode, observedMax: number): number {
  const padded = observedMax * 1.2;
  if (mode === "latency") return Math.max(8, padded);
  if (mode === "memory") return Math.max(16, padded);
  return Math.max(0.5, padded);
}

function chartAxisLabels(mode: ChartMode, height: number, valueMax: number) {
  const usableHeight = height - 18;
  return [valueMax, valueMax * 0.66, valueMax * 0.33, 0].map((value) => ({
    label: formatMetricValue(mode, value),
    offsetPercent: value === 0
      ? ((height - 18) / height) * 100
      : ((usableHeight - (value / valueMax) * usableHeight) / height) * 100,
  }));
}

function chartModeLabel(mode: ChartMode): string {
  if (mode === "latency") return "Pipe Latency";
  if (mode === "memory") return "Browser Memory";
  return "Pipe Traffic";
}

function formatMetricValue(mode: ChartMode, value: number): string {
  if (mode === "latency") return value <= 0 ? "0" : `${value < 10 ? value.toFixed(1) : Math.round(value)} ms`;
  if (mode === "memory") return value <= 0 ? "0" : `${value < 100 ? value.toFixed(1) : Math.round(value)} MiB`;
  if (value <= 0) return "0";
  return value < 1 ? `${Math.round(value * 1024)} KiB/s` : `${value.toFixed(2)} MiB/s`;
}

function formatTrafficEventValue(value: number): string {
  if (value <= 0) return "0";
  return value < 1 ? `${Math.round(value * 1024)} KiB` : `${value.toFixed(2)} MiB`;
}

function formatEventCountValue(value: number): string {
  return `${Math.round(value)} ${value === 1 ? "event" : "events"}`;
}

function nearestChartHover(
  series: MetricSeries[],
  hoverPercent: number,
  mode: ChartMode,
  activeEndPercent: number,
): ChartHoverState | null {
  const candidates = series.flatMap((metricSeries) =>
    [...metricSeries.points, ...(metricSeries.dashedPoints ?? [])].map((point) => ({
      point,
      xPercent: scaleOffsetPercent(point.offsetPercent, activeEndPercent),
    })),
  );
  if (candidates.length === 0) return null;

  const nearest = candidates.reduce((best, candidate) =>
    Math.abs(candidate.xPercent - hoverPercent) < Math.abs(best.xPercent - hoverPercent) ? candidate : best,
  );
  const timestampMs = nearest.point.timestampMs;
  const rows = series.map((metricSeries) => {
    const point = nearestPointAtTime(metricSeries.points, timestampMs, hoverPercent, activeEndPercent);
    return {
      color: metricSeries.color,
      label: metricSeries.label,
      style: mode === "traffic" ? "bar" as const : "solid" as const,
      value: point ? formatMetricValue(mode, point.value) : "No data",
    };
  }).flatMap((row, index) => {
    if (mode !== "traffic") return [row];
    const metricSeries = series[index];
    const dashedPoint = nearestPointAtTime(metricSeries.dashedPoints ?? [], timestampMs, hoverPercent, activeEndPercent);
    const eventCountPoint = nearestPointAtTime(metricSeries.eventCountBars ?? [], timestampMs, hoverPercent, activeEndPercent);
    return [
      {
        ...row,
        label: `${row.label} · average`,
      },
      {
        color: row.color,
        label: `${row.label} · total weight`,
        style: "dashed" as const,
        value: dashedPoint ? formatTrafficEventValue(dashedPoint.value) : "No data",
      },
      {
        color: row.color,
        label: `${row.label} · events`,
        style: "bar" as const,
        value: eventCountPoint ? formatEventCountValue(eventCountPoint.value) : "No data",
      },
    ];
  });

  return {
    leftPercent: nearest.xPercent,
    rows,
    timeLabel: timestampMs ? formatClockTimeWithMilliseconds(timestampMs) : `${Math.round(nearest.point.offsetPercent)}%`,
  };
}

function nearestPointAtTime(
  points: MetricPoint[],
  timestampMs: number | undefined,
  hoverPercent: number,
  activeEndPercent: number,
): MetricPoint | undefined {
  if (points.length === 0) return undefined;
  if (timestampMs !== undefined) {
    return points.reduce((best, point) =>
      Math.abs((point.timestampMs ?? 0) - timestampMs) < Math.abs((best.timestampMs ?? 0) - timestampMs) ? point : best,
    );
  }

  return points.reduce((best, point) =>
    Math.abs(scaleOffsetPercent(point.offsetPercent, activeEndPercent) - hoverPercent)
      < Math.abs(scaleOffsetPercent(best.offsetPercent, activeEndPercent) - hoverPercent) ? point : best,
  );
}

function colorWithAlpha(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}

function markerLabel(eventCount: number): string {
  return eventCount > 99 ? "99+" : `${eventCount}`;
}

function markerTitle(eventCount: number, type: SessionEventType, bucketMs: number): string {
  const suffix = eventCount === 1 ? "event" : "events";
  return `${eventCount} ${suffix} in ${formatTimelineDuration(bucketMs)} · ${eventLabel(type)}`;
}

function assignEventCardRows(entries: EventCardEntry[], timelineWidth: number): PlacedEventCardEntry[] {
  const rowEnds: number[] = [];
  const cardWidthPx = EVENT_CARD_WIDTH_REM * EVENT_CARD_ASSUMED_ROOT_FONT_SIZE_PX;

  return entries.map((entry) => {
    const leftPx = (entry.offsetPercent / 100) * timelineWidth;
    const rightPx = leftPx + cardWidthPx + EVENT_CARD_COLLISION_GAP_PX;
    const availableRowIndex = rowEnds.findIndex((rowEnd) => rowEnd <= leftPx);
    const rowIndex = availableRowIndex === -1 ? rowEnds.length : availableRowIndex;
    rowEnds[rowIndex] = rightPx;

    return { ...entry, rowIndex };
  });
}

function calculateRowLayout(entries: PlacedEventCardEntry[], cardHeights: Record<string, number>) {
  const rowCount = entries.reduce((max, entry) => Math.max(max, entry.rowIndex + 1), 0);
  const fallbackHeight = EVENT_CARD_ROW_HEIGHT_REM * EVENT_CARD_ASSUMED_ROOT_FONT_SIZE_PX;
  const rowHeights = Array.from({ length: rowCount }, () => 0);

  entries.forEach((entry) => {
    const measuredHeight = cardHeights[entry.event.eventId] ?? fallbackHeight;
    rowHeights[entry.rowIndex] = Math.max(rowHeights[entry.rowIndex], measuredHeight);
  });

  let nextTop = EVENT_CARD_STRIP_TOP_PADDING_PX;
  const rowOffsets = rowHeights.map((height) => {
    const top = nextTop;
    nextTop += height + EVENT_CARD_ROW_GAP_PX;
    return top;
  });

  return {
    minHeight: Math.max(
      EVENT_CARD_ROW_HEIGHT_REM * EVENT_CARD_ASSUMED_ROOT_FONT_SIZE_PX + EVENT_CARD_STRIP_TOP_PADDING_PX,
      nextTop - EVENT_CARD_ROW_GAP_PX + EVENT_CARD_STRIP_BOTTOM_PADDING_PX,
    ),
    rowOffsets,
  };
}

function eventCardId(eventId: string): string {
  return `session-event-card-${eventId}`;
}

function TimelineHeader({
  eventCount,
  layout,
  metricSummary,
  session,
}: {
  eventCount: number;
  layout: SessionTimelineLayout;
  metricSummary: string;
  session: Session;
}) {
  const connectionCount = Math.max(0, layout.lanes.length - 1);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "1.25rem",
        padding: "1rem 1.25rem 0.95rem",
        borderBottom: `1px solid ${panelColors.border}`,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: panelColors.muted,
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.bold,
            textTransform: "uppercase",
          }}
        >
          Session
        </div>
        <div
          style={{
            color: panelColors.text,
            fontFamily: "monospace",
            fontSize: typography.sizes.base,
            fontWeight: typography.weights.bold,
            maxWidth: "52rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={session.sessionId}
        >
          {session.sessionId}
        </div>
        <div
          style={{
            color: panelColors.muted,
            fontFamily: "monospace",
            fontSize: typography.sizes.xs,
            marginTop: "0.25rem",
          }}
        >
          {session.workflowId}
        </div>
      </div>
      <div
        style={{
          alignItems: "center",
          color: panelColors.text,
          display: "flex",
          flexWrap: "wrap",
          fontSize: typography.sizes.xs,
          gap: "0.75rem",
        }}
      >
        <HeaderMetric label="Started" value={formatDateTime(layout.startMs)} />
        <HeaderMetric label="Duration" value={formatElapsed(layout.durationMs)} />
        <HeaderMetric label="Events" value={`${eventCount}`} />
        <HeaderMetric label="Connections" value={`${connectionCount}`} />
        <span style={{ color: colors.blue400 }}>● Sent</span>
        <span style={{ color: colors.violet400 }}>● Received</span>
        <span style={{ color: panelColors.muted }}>{metricSummary}</span>
      </div>
    </div>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        background: panelColors.cardSoft,
        border: `1px solid ${panelColors.border}`,
        borderRadius: radii.md,
        display: "grid",
        gap: "0.125rem",
        padding: "0.45rem 0.65rem",
      }}
    >
      <span
        style={{
          color: panelColors.muted,
          fontSize: typography.sizes["2xs"],
          fontWeight: typography.weights.bold,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: panelColors.text,
          fontFamily: label === "Started" ? "monospace" : undefined,
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.semibold,
        }}
      >
        {value}
      </span>
    </span>
  );
}

function ZoomControls({
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  zoomLabel,
}: {
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomLabel: string;
}) {
  return (
    <div
      aria-label="Timeline zoom controls"
      style={{
        alignItems: "center",
        background: panelColors.control,
        border: `1px solid ${panelColors.border}`,
        borderRadius: radii.full,
        boxShadow: shadows.md,
        color: panelColors.text,
        display: "flex",
        gap: "0.25rem",
        padding: FLOATING_CONTROL_PADDING,
        position: "absolute",
        right: "1rem",
        top: FLOATING_BODY_CONTROL_TOP,
        zIndex: 50,
      }}
    >
      <button
        aria-label="Zoom out timeline"
        disabled={!canZoomOut}
        onClick={onZoomOut}
        style={{
          alignItems: "center",
          background: canZoomOut ? panelColors.card : panelColors.controlDisabled,
          border: `1px solid ${panelColors.border}`,
          borderRadius: radii.full,
          color: canZoomOut ? panelColors.text : panelColors.controlMuted,
          cursor: canZoomOut ? "pointer" : "not-allowed",
          display: "flex",
          fontSize: typography.sizes.base,
          fontWeight: typography.weights.bold,
          height: FLOATING_ICON_BUTTON_SIZE,
          justifyContent: "center",
          lineHeight: 1,
          padding: 0,
          width: FLOATING_ICON_BUTTON_SIZE,
        }}
        title="Zoom out"
        type="button"
      >
        -
      </button>
      <span
        style={{
          color: panelColors.muted,
          fontFamily: "monospace",
          fontSize: typography.sizes["2xs"],
          fontWeight: typography.weights.bold,
          minWidth: "2.55rem",
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {zoomLabel}
      </span>
      <button
        aria-label="Zoom in timeline"
        disabled={!canZoomIn}
        onClick={onZoomIn}
        style={{
          alignItems: "center",
          background: canZoomIn ? panelColors.primarySoft : panelColors.controlDisabled,
          border: `1px solid ${canZoomIn ? panelColors.primaryStroke : panelColors.border}`,
          borderRadius: radii.full,
          color: canZoomIn ? colors.yellow500 : panelColors.controlMuted,
          cursor: canZoomIn ? "pointer" : "not-allowed",
          display: "flex",
          fontSize: typography.sizes.base,
          fontWeight: typography.weights.bold,
          height: FLOATING_ICON_BUTTON_SIZE,
          justifyContent: "center",
          lineHeight: 1,
          padding: 0,
          width: FLOATING_ICON_BUTTON_SIZE,
        }}
        title="Zoom in"
        type="button"
      >
        +
      </button>
    </div>
  );
}

function TrafficCollapseIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="15"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
      viewBox="0 0 24 24"
      width="15"
    >
      {isCollapsed
        ? <polyline points="6 9 12 15 18 9" />
        : <polyline points="18 15 12 9 6 15" />}
    </svg>
  );
}

function PlayVideoIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
      width="26"
    >
      <rect height="13" rx="2.2" width="18" x="3" y="5.5" />
      <path d="M10 9.25v5.5l4.5-2.75L10 9.25Z" />
    </svg>
  );
}

function TrafficCollapseButton({
  isCollapsed,
  mode,
  onCollapsedChange,
}: {
  isCollapsed: boolean;
  mode: ChartMode;
  onCollapsedChange: (isCollapsed: boolean) => void;
}) {
  const label = chartModeLabel(mode);

  return (
    <div
      style={{
        alignItems: "center",
        background: panelColors.control,
        border: `1px solid ${panelColors.border}`,
        borderRadius: radii.full,
        boxShadow: shadows.md,
        display: "flex",
        left: "1rem",
        padding: FLOATING_CONTROL_PADDING,
        position: "absolute",
        top: FLOATING_BODY_CONTROL_TOP,
        zIndex: 60,
      }}
    >
      <button
        aria-label={isCollapsed ? `Expand ${label} chart` : `Collapse ${label} chart`}
        onClick={() => { onCollapsedChange(!isCollapsed); }}
        style={{
          alignItems: "center",
          background: isCollapsed ? panelColors.primarySoft : panelColors.card,
          border: `1px solid ${isCollapsed ? panelColors.primaryStroke : panelColors.border}`,
          borderRadius: radii.full,
          color: isCollapsed ? colors.yellow500 : panelColors.text,
          cursor: "pointer",
          display: "flex",
          fontSize: typography.sizes.base,
          fontWeight: typography.weights.bold,
          height: FLOATING_ICON_BUTTON_SIZE,
          justifyContent: "center",
          lineHeight: 1,
          padding: 0,
          width: FLOATING_ICON_BUTTON_SIZE,
        }}
        title={isCollapsed ? `Expand ${label} chart` : `Collapse ${label} chart`}
        type="button"
      >
        <TrafficCollapseIcon isCollapsed={isCollapsed} />
      </button>
    </div>
  );
}

function ChartModeSelector({
  mode,
  onModeChange,
}: {
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentMouseDown = (event: globalThis.MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [isOpen]);

  return (
    <div
      aria-label="Chart selector"
      ref={containerRef}
      style={{
        alignItems: "center",
        background: panelColors.card,
        border: `1px solid ${panelColors.border}`,
        borderRadius: radii.full,
        boxShadow: shadows.md,
        color: colors.yellow500,
        right: "8.25rem",
        padding: FLOATING_CONTROL_PADDING,
        position: "absolute",
        top: FLOATING_BODY_CONTROL_TOP,
        zIndex: 60,
      }}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Chart metric"
        onClick={() => { setIsOpen((current) => !current); }}
        style={{
          alignItems: "center",
          background: panelColors.primarySoft,
          border: `1px solid ${panelColors.primaryStroke}`,
          borderRadius: radii.full,
          color: colors.yellow500,
          cursor: "pointer",
          display: "flex",
          fontSize: typography.sizes["2xs"],
          fontWeight: typography.weights.bold,
          gap: "0.45rem",
          height: FLOATING_TEXT_BUTTON_HEIGHT,
          lineHeight: 1,
          padding: "0 0.65rem",
          textTransform: "uppercase",
        }}
        title="Chart metric"
        type="button"
      >
        <span>{chartModeLabel(mode)}</span>
        <span aria-hidden="true" style={{ fontSize: typography.sizes["2xs"], transform: isOpen ? "rotate(180deg)" : "none" }}>
          ▾
        </span>
      </button>
      {isOpen && (
        <div
          role="listbox"
          style={{
            background: panelColors.card,
            border: `1px solid ${panelColors.border}`,
            borderRadius: radii.md,
            boxShadow: shadows.lg,
            display: "grid",
            gap: "0.25rem",
            left: 0,
            minWidth: "8.5rem",
            padding: "0.3rem",
            position: "absolute",
            top: "calc(100% + 0.35rem)",
          }}
        >
          {CHART_MODES.map((chartMode) => {
            const isSelected = chartMode === mode;
            return (
              <button
                aria-selected={isSelected}
                key={chartMode}
                onClick={() => {
                  onModeChange(chartMode);
                  setIsOpen(false);
                }}
                role="option"
                style={{
                  background: isSelected ? panelColors.primarySoft : panelColors.card,
                  border: `1px solid ${isSelected ? panelColors.primaryStroke : "transparent"}`,
                  borderRadius: radii.sm,
                  color: isSelected ? colors.yellow500 : panelColors.text,
                  cursor: "pointer",
                  fontSize: typography.sizes["2xs"],
                  fontWeight: typography.weights.bold,
                  height: FLOATING_TEXT_BUTTON_HEIGHT,
                  padding: "0 0.65rem",
                  textAlign: "left",
                  textTransform: "uppercase",
                }}
                type="button"
              >
                {chartModeLabel(chartMode)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChartFloatingControls({
  isCollapsed,
  mode,
  onCollapsedChange,
}: {
  isCollapsed: boolean;
  mode: ChartMode;
  onCollapsedChange: (isCollapsed: boolean) => void;
}) {
  return (
    <TrafficCollapseButton
      isCollapsed={isCollapsed}
      mode={mode}
      onCollapsedChange={onCollapsedChange}
    />
  );
}

function MetricChart({
  activeEndPercent,
  isCollapsed,
  mode,
  series,
}: {
  activeEndPercent: number;
  isCollapsed: boolean;
  mode: ChartMode;
  series: MetricSeries[];
}) {
  const [hover, setHover] = useState<ChartHoverState | null>(null);
  const width = 1000;
  const height = TRAFFIC_HEIGHT;
  const chartHeight = isCollapsed ? 40 : TRAFFIC_HEIGHT;
  const observedMax = Math.max(0, ...series.flatMap((metricSeries) => [
    ...metricSeries.points.map((point) => point.value),
    ...(metricSeries.dashedPoints ?? []).map((point) => point.value),
  ]));
  const eventCountMax = Math.max(1, ...series.flatMap((metricSeries) =>
    (metricSeries.eventCountBars ?? []).map((bar) => bar.value),
  ));
  const valueMax = chartValueMax(mode, observedMax);
  const yAxisLabels = chartAxisLabels(mode, height, valueMax);

  const handlePointerMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const leftPercent = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    setHover(nearestChartHover(series, leftPercent, mode, activeEndPercent));
  }, [activeEndPercent, mode, series]);

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        gridTemplateColumns: `${LABEL_COLUMN_WIDTH} minmax(0, 1fr)`,
      }}
    >
      <div
        style={{
          background: `linear-gradient(90deg, ${panelColors.card} 0%, ${colorWithAlpha(colors.white, 0.92)} 82%, transparent)`,
          color: panelColors.muted,
          fontSize: typography.sizes.xs,
          left: 0,
          minHeight: `${chartHeight}px`,
          paddingLeft: "1.5rem",
          paddingRight: "0.75rem",
          position: "sticky",
          textAlign: "right",
          zIndex: 20,
        }}
      >
        {!isCollapsed && yAxisLabels.map((item) => (
          <span
            key={item.label}
            style={{
              position: "absolute",
              right: "0.75rem",
              top: `${item.offsetPercent}%`,
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </span>
        ))}
      </div>
      <div
        onMouseLeave={() => { setHover(null); }}
        onMouseMove={handlePointerMove}
        style={{ position: "relative", height: `${chartHeight}px` }}
      >
        <svg
          aria-label={`${mode} chart`}
          preserveAspectRatio="none"
          style={{ display: "block", height: "100%", width: "100%" }}
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            {series.map((trafficSeries) => (
              <linearGradient
                id={`trafficFill-${trafficSeries.id}`}
                key={trafficSeries.id}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={colorWithAlpha(trafficSeries.color, 0.58)} />
                <stop offset="100%" stopColor={colorWithAlpha(trafficSeries.color, 0.05)} />
              </linearGradient>
            ))}
          </defs>
          {yAxisLabels.slice(1).map((item) => (
            <line
              key={item.label}
              stroke={colorWithAlpha(colors.gray400, 0.18)}
              x1="0"
              x2={width}
              y1={(item.offsetPercent / 100) * height}
              y2={(item.offsetPercent / 100) * height}
            />
          ))}
          {!isCollapsed && (
            <>
              {mode === "traffic" && series.flatMap((trafficSeries) => (trafficSeries.eventCountBars ?? []).map((bar, index) => {
                const centerX = (scaleOffsetPercent(bar.offsetPercent, activeEndPercent) / 100) * width;
                const barHeight = 12 + (bar.value / eventCountMax) * 30;
                const y = (height - 18) - barHeight;

                return (
                  <line
                    key={`traffic-event-count-${trafficSeries.id}-${bar.timestampMs}-${index}`}
                    stroke={colorWithAlpha(trafficSeries.color, 0.28)}
                    strokeLinecap="round"
                    strokeWidth="6"
                    vectorEffect="non-scaling-stroke"
                    x1={centerX}
                    x2={centerX}
                    y1={y}
                    y2={height - 18}
                  />
                );
              }))}
              {series.map((trafficSeries) => (
                <path
                  d={metricAreaPath(trafficSeries.points, width, height - 18, activeEndPercent, valueMax)}
                  fill={`url(#trafficFill-${trafficSeries.id})`}
                  key={`traffic-area-${trafficSeries.id}`}
                />
              ))}
              {series.flatMap((trafficSeries) => (trafficSeries.dashedPoints ?? []).length === 0 ? [] : [
                <path
                  d={metricPath(trafficSeries.dashedPoints ?? [], width, height - 18, activeEndPercent, valueMax)}
                  fill="none"
                  key={`traffic-raw-line-${trafficSeries.id}`}
                  opacity="0.34"
                  stroke={trafficSeries.color}
                  strokeDasharray="5 6"
                  strokeWidth="1.6"
                  vectorEffect="non-scaling-stroke"
                />,
              ])}
              {series.map((trafficSeries) => (
                <path
                  d={metricPath(trafficSeries.points, width, height - 18, activeEndPercent, valueMax)}
                  fill="none"
                  key={`traffic-line-${trafficSeries.id}`}
                  stroke={trafficSeries.color}
                  strokeWidth="2.4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {hover && (
                <line
                  stroke={colorWithAlpha(colors.gray700, 0.36)}
                  strokeDasharray="4 5"
                  vectorEffect="non-scaling-stroke"
                  x1={(hover.leftPercent / 100) * width}
                  x2={(hover.leftPercent / 100) * width}
                  y1="0"
                  y2={height}
                />
              )}
            </>
          )}
        </svg>
        {!isCollapsed && hover && (
          <div
            style={{
              background: colorWithAlpha(colors.gray900, 0.92),
              border: `1px solid ${colorWithAlpha(colors.white, 0.2)}`,
              borderRadius: radii.md,
              boxShadow: shadows.md,
              color: colors.white,
              fontSize: typography.sizes.xs,
              left: `${hover.leftPercent}%`,
              maxWidth: "15rem",
              minWidth: "11rem",
              padding: "0.55rem 0.65rem",
              pointerEvents: "none",
              position: "absolute",
              top: "0.5rem",
              transform: hover.leftPercent > 78 ? "translateX(-100%)" : "translateX(0.5rem)",
              zIndex: 30,
            }}
          >
            <div style={{ color: colorWithAlpha(colors.white, 0.72), marginBottom: "0.35rem" }}>
              {hover.timeLabel}
            </div>
            <div style={{ display: "grid", gap: "0.25rem" }}>
              {hover.rows.map((row) => (
                <div
                  key={row.label}
                  style={{ alignItems: "center", display: "grid", gap: "0.4rem", gridTemplateColumns: "0.85rem 1fr auto" }}
                >
                  {row.style === "bar"
                    ? (
                      <span
                        style={{
                          background: colorWithAlpha(row.color, 0.34),
                          borderRadius: "2px",
                          display: "block",
                          height: "0.6rem",
                          width: "0.85rem",
                        }}
                      />
                    )
                    : (
                      <span
                        style={{
                          borderTop: `2px ${row.style === "dashed" ? "dashed" : "solid"} ${row.color}`,
                          display: "block",
                          width: "0.85rem",
                        }}
                      />
                    )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.label}</span>
                  <span style={{ fontFamily: "monospace" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function createTimelineTicks(durationMs: number, tickMs: number): number[] {
  if (durationMs <= 0) return [];
  const count = Math.ceil(durationMs / tickMs);
  return Array.from({ length: count + 1 }, (_, index) =>
    Math.min(durationMs, index * tickMs),
  );
}

function createIntermediateTimelineTicks(durationMs: number, majorTickMs: number, timelineWidth: number): number[] {
  if (durationMs <= 0 || majorTickMs <= MINIMUM_ALLOWED_ZOOM_BUCKET_MS) return [];

  const majorTickSpacingPx = (majorTickMs / durationMs) * timelineWidth;
  if (majorTickSpacingPx < INTERMEDIATE_TICK_MIN_MAJOR_SPACING_PX) return [];

  const subdivision = [10, 5, 4, 2].find((value) =>
    majorTickMs / value >= MINIMUM_ALLOWED_ZOOM_BUCKET_MS
    && majorTickSpacingPx / value >= MIN_INTERMEDIATE_TICK_SPACING_PX,
  );
  if (!subdivision) return [];

  const intermediateTickMs = majorTickMs / subdivision;
  const count = Math.ceil(durationMs / intermediateTickMs);

  return Array.from({ length: count + 1 }, (_, index) => Math.min(durationMs, index * intermediateTickMs))
    .filter((tick) => Math.abs(tick / majorTickMs - Math.round(tick / majorTickMs)) > 0.001);
}

function createElapsedLabelTicks(durationMs: number, intervalMs: number): number[] {
  if (durationMs <= 0) return [0];
  const count = Math.floor(durationMs / intervalMs);
  return Array.from({ length: count + 1 }, (_, index) => index * intervalMs);
}

function createClockSecondTicks(durationMs: number, startMs: number, intervalMs: number): number[] {
  if (durationMs <= 0) return [];
  const firstClockSecondMs = Math.ceil(startMs / 1000) * 1000;
  const firstElapsedMs = firstClockSecondMs - startMs;
  const ticks: number[] = [];

  for (let tick = firstElapsedMs; tick <= durationMs; tick += 1000) {
    const clockTimestamp = startMs + tick;
    if (clockTimestamp % intervalMs === 0) {
      ticks.push(tick);
    }
  }

  return ticks;
}

function tickOffsetPercent(tick: number, axisDurationMs: number): number {
  return axisDurationMs === 0 ? 0 : Math.min(100, (tick / axisDurationMs) * 100);
}

function scaleTrackWidth(timelineWidth: number): number {
  return Math.max(1, timelineWidth - LABEL_COLUMN_WIDTH_PX - GRID_COLUMN_GAP_PX);
}

function filterTicksByPixelSpacing(
  ticks: number[],
  axisDurationMs: number,
  timelineWidth: number,
  minSpacingPx: number,
): number[] {
  let lastTickX = -Infinity;

  return ticks.filter((tick) => {
    const tickX = (tickOffsetPercent(tick, axisDurationMs) / 100) * timelineWidth;
    if (tickX - lastTickX < minSpacingPx) return false;
    lastTickX = tickX;
    return true;
  });
}

function timelineLabelPlacement(offsetPercent: number) {
  if (offsetPercent <= 1) {
    return { textAlign: "left" as const, transform: "none" };
  }
  if (offsetPercent >= 99) {
    return { textAlign: "right" as const, transform: "translateX(-100%)" };
  }
  return { textAlign: "center" as const, transform: "translateX(-50%)" };
}

function RailScale({
  durationMs,
  startMs,
  timelineWidth,
  visualDurationMs,
  zoomLevel,
}: {
  durationMs: number;
  startMs: number;
  timelineWidth: number;
  visualDurationMs: number;
  zoomLevel: TimelineZoomLevel;
}) {
  const trackWidth = scaleTrackWidth(timelineWidth);
  const intermediateTicks = createIntermediateTimelineTicks(visualDurationMs, zoomLevel.tickMs, trackWidth);
  const timelineTicks = createTimelineTicks(visualDurationMs, zoomLevel.tickMs);
  const elapsedLabelTicks = filterTicksByPixelSpacing(
    createElapsedLabelTicks(visualDurationMs, zoomLevel.elapsedLabelIntervalMs),
    visualDurationMs,
    trackWidth,
    MIN_ELAPSED_LABEL_SPACING_PX,
  );
  const clockSecondTicks = filterTicksByPixelSpacing(
    createClockSecondTicks(visualDurationMs, startMs, zoomLevel.clockLabelIntervalMs),
    visualDurationMs,
    trackWidth,
    MIN_CLOCK_LABEL_SPACING_PX,
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${LABEL_COLUMN_WIDTH} minmax(0, 1fr)`,
        gap: "0.75rem",
      }}
    >
      <div />
      <div
        style={{
          color: panelColors.muted,
          height: "4rem",
          fontSize: typography.sizes["2xs"],
          position: "relative",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            background: colorWithAlpha(colors.gray400, 0.34),
            height: "1px",
            left: 0,
            position: "absolute",
            right: 0,
            top: "1.65rem",
          }}
        />
        {clockSecondTicks.map((tick) => {
          const offsetPercent = tickOffsetPercent(tick, visualDurationMs);
          const isAfterClose = tick > durationMs;
          const placement = timelineLabelPlacement(offsetPercent);
          return (
            <span
              key={`clock-${tick}`}
              style={{
                color: colorWithAlpha(colors.gray700, 0.78),
                fontFamily: "monospace",
                fontSize: typography.sizes["2xs"],
                fontWeight: typography.weights.semibold,
                left: `${offsetPercent}%`,
                opacity: isAfterClose ? 0.66 : 1,
                position: "absolute",
                textAlign: placement.textAlign,
                top: 0,
                transform: placement.transform,
                whiteSpace: "nowrap",
              }}
            >
              {formatClockTime(startMs + tick)}
            </span>
          );
        })}
        {clockSecondTicks.map((tick) => {
          const isAfterClose = tick > durationMs;
          return (
            <span
              key={`clock-marker-${tick}`}
              aria-hidden="true"
              style={{
                borderBottom: `0.35rem solid ${colorWithAlpha(colors.gray700, 0.78)}`,
                borderLeft: "0.25rem solid transparent",
                borderRight: "0.25rem solid transparent",
                height: 0,
                left: `${tickOffsetPercent(tick, visualDurationMs)}%`,
                opacity: isAfterClose ? 0.64 : 1,
                position: "absolute",
                top: "1.28rem",
                transform: "translateX(-50%)",
                width: 0,
              }}
            />
          );
        })}
        {intermediateTicks.map((tick) => {
          const offsetPercent = tickOffsetPercent(tick, visualDurationMs);
          const isAfterClose = tick > durationMs;
          return (
            <span
              key={`scale-subtick-${tick}`}
              aria-hidden="true"
              style={{
                background: colorWithAlpha(colors.gray400, 0.28),
                height: "0.34rem",
                left: `${offsetPercent}%`,
                opacity: isAfterClose ? 0.42 : 0.76,
                position: "absolute",
                top: "1.65rem",
                transform: "translateX(-50%)",
                width: "1px",
              }}
            />
          );
        })}
        {timelineTicks.map((tick) => {
          const offsetPercent = tickOffsetPercent(tick, visualDurationMs);
          const isAfterClose = tick > durationMs;
          const isSecond = tick % 1000 === 0;
          const isHalfSecond = tick % 500 === 0;
          const isElapsedLabel = tick % zoomLevel.elapsedLabelIntervalMs === 0;
          return (
            <span
              key={`scale-tick-${tick}`}
              aria-hidden="true"
              style={{
                background: isSecond
                  ? colorWithAlpha(colors.yellow500, 0.72)
                  : isHalfSecond
                    ? colorWithAlpha(colors.gray600, 0.54)
                    : colorWithAlpha(colors.gray400, 0.36),
                height: isSecond ? "1.05rem" : isElapsedLabel ? "0.8rem" : "0.48rem",
                left: `${offsetPercent}%`,
                opacity: isAfterClose ? 0.58 : 1,
                position: "absolute",
                top: "1.65rem",
                transform: "translateX(-50%)",
                width: "1px",
              }}
            />
          );
        })}
        {elapsedLabelTicks.map((tick) => {
          const offsetPercent = tickOffsetPercent(tick, visualDurationMs);
          const isAfterClose = tick > durationMs;
          const placement = timelineLabelPlacement(offsetPercent);
          return (
            <span
              key={`half-${tick}`}
              style={{
                color: tick % 1000 === 0 ? colorWithAlpha(colors.gray800, 0.88) : panelColors.muted,
                fontWeight: tick % 1000 === 0 ? typography.weights.semibold : typography.weights.medium,
                left: `${offsetPercent}%`,
                opacity: isAfterClose ? 0.64 : 1,
                position: "absolute",
                textAlign: placement.textAlign,
                top: "2.75rem",
                transform: placement.transform,
                whiteSpace: "nowrap",
              }}
            >
              {formatTimelineDuration(tick)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TimelineMarkerGuide({
  activeEndPercent,
  hoveredPoint,
  marker,
}: {
  activeEndPercent: number;
  hoveredPoint: HoveredTimelinePoint | null;
  marker: TimelineMarker;
}) {
  const isHovered = hoveredPoint?.markerId === marker.event.eventId;
  const isMuted = Boolean(hoveredPoint) && !isHovered;

  return (
    <div
      style={{
        background: colorWithAlpha(colors.gray500, 0.56),
        bottom: 0,
        left: `${scaleOffsetPercent(marker.offsetPercent, activeEndPercent)}%`,
        opacity: isHovered ? 0.78 : isMuted ? 0.35 : 0.5,
        position: "absolute",
        top: 0,
        transition: "opacity 140ms ease",
        width: "1px",
        zIndex: isHovered ? 12 : 1,
      }}
    />
  );
}

function hasConnectionVideo(lane: SessionTimelineLayout["lanes"][number]): boolean {
  return lane.kind === "connection" && lane.markers.some((marker) =>
    marker.events.some((event) => event.type === SessionEventType.SESSION_CONNECTED),
  );
}

function TimelineLaneLabel({ lane, sessionId }: { lane: TimelineLane; sessionId: string }) {
  const [name, fallbackId] = lane.label.split("/").map((value) => value.trim());
  const canOpenVideo = hasConnectionVideo(lane);
  const titleStyle = {
    color: panelColors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.extrabold,
    textShadow: `0 1px 8px ${colorWithAlpha(colors.black, 0.18)}`,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };

  if (lane.kind !== "connection") {
    return (
      <span
        style={{
          alignSelf: "center",
          display: "grid",
          gap: "0.125rem",
          minWidth: 0,
        }}
      >
        <span style={titleStyle}>Session</span>
      </span>
    );
  }

  return (
    <span
      style={{
        alignItems: "center",
        alignSelf: "center",
        display: "grid",
        columnGap: "0.45rem",
        gridTemplateColumns: "2.15rem minmax(0, 1fr)",
        minWidth: 0,
      }}
    >
      <button
        aria-label={`Open ${name} video`}
        disabled={!canOpenVideo}
        onClick={() => {
          if (!lane.connectionId || !canOpenVideo) return;
          openVideo(sessionId, lane.connectionId);
        }}
        style={{
          alignItems: "center",
          background: canOpenVideo ? panelColors.primarySoft : colorWithAlpha(colors.gray300, 0.18),
          border: `1px solid ${canOpenVideo ? panelColors.primaryStroke : colorWithAlpha(colors.gray400, 0.24)}`,
          borderRadius: radii.md,
          color: canOpenVideo ? colors.yellow500 : colorWithAlpha(colors.gray500, 0.34),
          cursor: canOpenVideo ? "pointer" : "not-allowed",
          display: "flex",
          flexShrink: 0,
          height: "1.45rem",
          justifyContent: "center",
          opacity: canOpenVideo ? 1 : 0.52,
          padding: 0,
          width: "2.15rem",
        }}
        title={canOpenVideo ? `Open ${name} video` : "Waiting for connection video"}
        type="button"
      >
        <PlayVideoIcon />
      </button>
      <span style={{ display: "grid", gap: "0.125rem", minWidth: 0 }}>
        <span style={titleStyle}>{name}</span>
        <span
          style={{
            color: panelColors.muted,
            fontFamily: "monospace",
            fontSize: typography.sizes["2xs"],
            fontWeight: typography.weights.semibold,
            overflow: "hidden",
            textShadow: `0 1px 6px ${colorWithAlpha(colors.black, 0.16)}`,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={lane.connectionId}
        >
          {lane.connectionId ?? fallbackId}
        </span>
      </span>
    </span>
  );
}

function TimelineRails({
  activeEndPercent,
  hoveredPoint,
  layout,
  onHoverPoint,
  onSelect,
  sessionId,
  zoomLevel,
}: {
  activeEndPercent: number;
  hoveredPoint: HoveredTimelinePoint | null;
  layout: SessionTimelineLayout;
  onHoverPoint: (markerId: string, events: SessionEventEnvelope[]) => void;
  onSelect: (eventId: string) => void;
  sessionId: string;
  zoomLevel: TimelineZoomLevel;
}) {
  return (
    <div style={{ display: "grid", gap: TIMELINE_LANE_GAP, gridTemplateColumns: `${LABEL_COLUMN_WIDTH} minmax(0, 1fr)` }}>
      <div
        style={{
          background: `linear-gradient(90deg, ${panelColors.card} 0%, ${colorWithAlpha(colors.white, 0.92)} 82%, transparent)`,
          display: "grid",
          gap: TIMELINE_LANE_GAP,
          gridTemplateRows: `repeat(${layout.lanes.length}, ${TIMELINE_LANE_HEIGHT})`,
          left: 0,
          paddingLeft: "1.5rem",
          paddingRight: "0.75rem",
          position: "sticky",
          zIndex: 20,
        }}
      >
        {layout.lanes.map((lane) => (
          <TimelineLaneLabel key={lane.id} lane={lane} sessionId={sessionId} />
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gap: TIMELINE_LANE_GAP,
          gridTemplateRows: `repeat(${layout.lanes.length}, ${TIMELINE_LANE_HEIGHT})`,
          position: "relative",
        }}
      >
        {layout.lanes.map((lane) => (
          <div key={lane.id} style={{ position: "relative" }}>
            {(() => {
              const startOffsetPercent = scaleOffsetPercent(lane.startOffsetPercent, activeEndPercent);
              const endOffsetPercent = scaleOffsetPercent(lane.endOffsetPercent, activeEndPercent);
              return (
                <>
            <div
              style={{
                background: colorWithAlpha(colors.gray400, 0.32),
                height: "2px",
                left: 0,
                position: "absolute",
                right: 0,
                top: "50%",
              }}
            />
            <div
              style={{
                background: lane.color,
                boxShadow: `0 0 14px ${colorWithAlpha(lane.color, 0.32)}`,
                height: "5px",
                left: `${startOffsetPercent}%`,
                position: "absolute",
                right: `${100 - endOffsetPercent}%`,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <span
              style={{
                alignItems: "center",
                background: panelColors.cardSoft,
                border: `1px solid ${lane.color}`,
                borderRadius: radii.full,
                color: panelColors.text,
                display: "flex",
                fontSize: typography.sizes.base,
                height: "1.35rem",
                justifyContent: "center",
                left: `${startOffsetPercent}%`,
                position: "absolute",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "1.35rem",
              }}
            >
              +
            </span>
                </>
              );
            })()}
            {lane.markers.map((marker) => {
              const offsetPercent = scaleOffsetPercent(marker.offsetPercent, activeEndPercent);
              const isHovered = hoveredPoint?.markerId === marker.event.eventId;
              const isMuted = Boolean(hoveredPoint) && !isHovered;
              return (
                <button
                  key={marker.event.eventId}
                  type="button"
                  onClick={() => { onSelect(marker.event.eventId); }}
                  onMouseEnter={() => { onHoverPoint(marker.event.eventId, marker.events); }}
                  onMouseLeave={() => { onHoverPoint("", []); }}
                  style={{
                    alignItems: "center",
                    background: panelColors.card,
                    border: `2px solid ${colors.gray100}`,
                    borderRadius: radii.full,
                    boxShadow: shadows.xs,
                    color: colors.gray900,
                    cursor: "pointer",
                    display: "flex",
                    height: "1.75rem",
                    justifyContent: "center",
                    left: `${offsetPercent}%`,
                    opacity: isMuted ? 0.4 : 1,
                    padding: 0,
                    position: "absolute",
                    top: "50%",
                    transition: "opacity 140ms ease, z-index 140ms ease, box-shadow 140ms ease",
                    transform: "translate(-50%, -50%)",
                    width: "1.75rem",
                    zIndex: isHovered ? 30 : 8,
                  }}
                  title={markerTitle(marker.eventCount, marker.event.type, zoomLevel.bucketMs)}
                >
                  <span
                    style={{
                      fontSize: typography.sizes.sm,
                      fontWeight: typography.weights.extrabold,
                      lineHeight: 1,
                    }}
                  >
                    {markerLabel(marker.eventCount)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {layout.lanes.flatMap((lane) =>
          lane.markers.map((marker) => (
            <TimelineMarkerGuide
              activeEndPercent={activeEndPercent}
              hoveredPoint={hoveredPoint}
              key={`vertical-${marker.event.eventId}`}
              marker={marker}
            />
          )),
        )}
      </div>
    </div>
  );
}

function MeasuredEventCard({
  entry,
  index,
  isBodyExpanded,
  isMuted,
  onBodyExpandedChange,
  onHeightChange,
  top,
}: {
  entry: PlacedEventCardEntry;
  index: number;
  isBodyExpanded: boolean;
  isMuted: boolean;
  onBodyExpandedChange: (eventId: string, isExpanded: boolean) => void;
  onHeightChange: (eventId: string, height: number) => void;
  top: number;
}) {
  const cardReference = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = cardReference.current;
    if (!node) return undefined;

    const updateHeight = () => {
      onHeightChange(entry.event.eventId, node.getBoundingClientRect().height);
    };
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [entry.event.eventId, isBodyExpanded, onHeightChange]);

  return (
    <div
      id={eventCardId(entry.event.eventId)}
      ref={cardReference}
      style={{
        left: `${entry.offsetPercent}%`,
        opacity: isMuted ? 0.4 : 1,
        position: "absolute",
        scrollMarginInlineStart: LABEL_COLUMN_WIDTH,
        top: `${top}px`,
        transition: "opacity 140ms ease",
        width: EVENT_CARD_WIDTH,
        zIndex: isMuted ? 1 : 3,
      }}
    >
      <EventCard
        accentColor={entry.accentColor}
        bodyExpanded={isBodyExpanded}
        defaultBodyExpanded={false}
        event={entry.event}
        index={index}
        onBodyExpandedChange={(nextBodyExpanded) => {
          onBodyExpandedChange(entry.event.eventId, nextBodyExpanded);
        }}
      />
    </div>
  );
}

function EventCardStrip({
  activeEndPercent,
  hoveredPoint,
  layout,
  sessionEvents,
  timelineWidth,
}: {
  activeEndPercent: number;
  hoveredPoint: HoveredTimelinePoint | null;
  layout: SessionTimelineLayout;
  sessionEvents: SessionEventEnvelope[];
  timelineWidth: number;
}) {
  const connectionColors = new Map(
    layout.lanes
      .filter((lane) => lane.kind === "connection" && lane.connectionId)
      .map((lane) => [lane.connectionId!, lane.color]),
  );
  const entries = assignEventCardRows(layout.lanes
    .flatMap((lane) =>
      lane.markers.flatMap((marker) =>
        marker.events.map((event) => ({
          accentColor: event.connectionId ? connectionColors.get(event.connectionId) : undefined,
          event,
          offsetPercent: scaleOffsetPercent(marker.offsetPercent, activeEndPercent),
        })),
      ),
    )
    .sort((a, b) => {
      const timeDelta = new Date(a.event.occurredAt).getTime() - new Date(b.event.occurredAt).getTime();
      if (timeDelta !== 0) return timeDelta;
      return a.event.eventId.localeCompare(b.event.eventId);
    }), timelineWidth);
  const [expandedEventIds, setExpandedEventIds] = useState<ReadonlySet<string>>(() => new Set());
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  const { minHeight, rowOffsets } = calculateRowLayout(entries, cardHeights);
  const handleBodyExpandedChange = useCallback((eventId: string, isExpanded: boolean) => {
    setExpandedEventIds((currentEventIds) => {
      const nextEventIds = new Set(currentEventIds);
      if (isExpanded) {
        nextEventIds.add(eventId);
      } else {
        nextEventIds.delete(eventId);
      }
      return nextEventIds;
    });
  }, []);
  const handleHeightChange = useCallback((eventId: string, height: number) => {
    setCardHeights((currentHeights) => {
      if (Math.abs((currentHeights[eventId] ?? 0) - height) < 1) return currentHeights;
      return { ...currentHeights, [eventId]: height };
    });
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        gridTemplateColumns: `${LABEL_COLUMN_WIDTH} minmax(0, 1fr)`,
        minHeight: `${minHeight}px`,
        paddingRight: EVENT_CARD_TRAILING_SPACE,
        width: `${timelineWidth}px`,
      }}
    >
      <div />
      <div style={{ position: "relative" }}>
        <div
          aria-hidden="true"
          style={{
            background: colorWithAlpha(colors.gray400, 0.2),
            height: "1px",
            left: 0,
            position: "absolute",
            right: 0,
            top: 0,
          }}
        />
        {entries.map((entry) => {
          const isRelatedToHover = hoveredPoint?.eventIds.has(entry.event.eventId) ?? false;
          const isMuted = Boolean(hoveredPoint) && !isRelatedToHover;
          return (
            <div
              key={`guide-${entry.event.eventId}`}
              style={{
                background: `linear-gradient(${colorWithAlpha(colors.gray500, 0.68)}, ${colorWithAlpha(colors.gray400, 0.16)})`,
                bottom: 0,
                left: `${entry.offsetPercent}%`,
                opacity: isMuted ? 0.5 : 0.72,
                position: "absolute",
                top: 0,
                transform: "translateX(-50%)",
                transition: "opacity 140ms ease",
                width: "2px",
                zIndex: isRelatedToHover ? 2 : 0,
              }}
            />
          );
        })}
        {entries.map((entry) => {
          const isMuted = Boolean(hoveredPoint) && !hoveredPoint?.eventIds.has(entry.event.eventId);
          return (
            <MeasuredEventCard
              entry={entry}
              index={sessionEvents.findIndex((item) => item.eventId === entry.event.eventId)}
              isBodyExpanded={expandedEventIds.has(entry.event.eventId)}
              isMuted={isMuted}
              key={entry.event.eventId}
              onBodyExpandedChange={handleBodyExpandedChange}
              onHeightChange={handleHeightChange}
              top={rowOffsets[entry.rowIndex] ?? EVENT_CARD_STRIP_TOP_PADDING_PX}
            />
          );
        })}
        {entries.map((entry) => {
          const isRelatedToHover = hoveredPoint?.eventIds.has(entry.event.eventId) ?? false;
          const isMuted = Boolean(hoveredPoint) && !isRelatedToHover;
          return (
            <button
              key={`anchor-${entry.event.eventId}`}
              aria-label={`Jump to ${eventLabel(entry.event.type)}`}
              onClick={() => {
                document.getElementById(eventCardId(entry.event.eventId))?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center",
                });
              }}
              style={{
                background: colors.gray100,
                border: `2px solid ${panelColors.border}`,
                borderRadius: radii.full,
                cursor: "pointer",
                height: "0.65rem",
                left: `${entry.offsetPercent}%`,
                opacity: isMuted ? 0.4 : 1,
                padding: 0,
                position: "absolute",
                top: 0,
                transform: "translate(-50%, -50%)",
                transition: "opacity 140ms ease, z-index 140ms ease",
                width: "0.65rem",
                zIndex: isRelatedToHover ? 4 : 2,
              }}
              type="button"
            />
          );
        })}
      </div>
    </div>
  );
}

export function SessionTimeline({ session }: { session: Session }) {
  const [chartMode, setChartMode] = useState<ChartMode>("traffic");
  const [hoveredPoint, setHoveredPoint] = useState<HoveredTimelinePoint | null>(null);
  const [isTrafficCollapsed, setIsTrafficCollapsed] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(() => coarsestAllowedZoomIndex(createSessionTimelineLayout(session).durationMs));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingZoomAnchorRef = useRef<{ ratio: number; viewportOffset: number } | null>(null);
  const defaultZoomIndex = useMemo(() => coarsestAllowedZoomIndex(createSessionTimelineLayout(session).durationMs), [session]);
  const safeZoomIndex = Math.max(defaultZoomIndex, Math.min(TIMELINE_ZOOM_LEVELS.length - 1, zoomIndex));
  const zoomLevel = TIMELINE_ZOOM_LEVELS[safeZoomIndex] ?? TIMELINE_ZOOM_LEVELS.at(-1)!;
  const layout = useMemo(() => createSessionTimelineLayout(session, zoomLevel.bucketMs), [session, zoomLevel.bucketMs]);
  const traffic = useMemo(() => createTrafficSeries(session, layout), [layout, session]);
  const latency = useMemo(() => createLatencySeries(session, layout), [layout, session]);
  const memory = useMemo(() => createMemorySeries(session, layout), [layout, session]);
  const chartSeries = chartMode === "latency" ? latency : chartMode === "memory" ? memory : traffic;
  const activeWidth = canvasWidth(layout, session.events.length, zoomLevel);
  const visualWidth = activeWidth + POST_SESSION_VISUAL_SPACE_PX;
  const activeEndPercent = (activeWidth / visualWidth) * 100;
  const visualDurationMs = visualTimelineDuration(layout.durationMs, activeWidth, visualWidth);
  const maxChartValue = Math.max(0, ...chartSeries.flatMap((metricSeries) =>
    [
      ...metricSeries.points.map((point) => point.value),
      ...(metricSeries.dashedPoints ?? []).map((point) => point.value),
    ],
  ));
  const metricSummary = chartSeries.length === 0
    ? "No metrics"
    : `Max ${formatMetricValue(chartMode, maxChartValue)}`;
  const timelineBodyPadding = isTrafficCollapsed ? "25px 1.25rem 1.25rem 0" : "1.25rem 1.25rem 1.25rem 0";
  const timelineStackGap = isTrafficCollapsed ? "0.5rem" : "1rem";

  useEffect(() => {
    setHoveredPoint(null);
    pendingZoomAnchorRef.current = null;
    setZoomIndex(defaultZoomIndex);
  }, [defaultZoomIndex, session.sessionId]);

  useLayoutEffect(() => {
    const node = scrollContainerRef.current;
    const pendingAnchor = pendingZoomAnchorRef.current;
    if (!node || !pendingAnchor) return;

    pendingZoomAnchorRef.current = null;
    const nextScrollLeft = pendingAnchor.ratio * visualWidth - pendingAnchor.viewportOffset;
    node.scrollLeft = Math.max(0, Math.min(node.scrollWidth - node.clientWidth, nextScrollLeft));
  }, [visualWidth]);

  const changeZoom = useCallback((step: number, clientX?: number) => {
    const nextZoomIndex = Math.max(
      defaultZoomIndex,
      Math.min(TIMELINE_ZOOM_LEVELS.length - 1, safeZoomIndex + step),
    );
    if (nextZoomIndex === safeZoomIndex) return;

    const node = scrollContainerRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      const viewportOffset = Math.max(0, Math.min(rect.width, (clientX ?? rect.left + rect.width / 2) - rect.left));
      const ratio = visualWidth <= 0 ? 0 : (node.scrollLeft + viewportOffset) / visualWidth;
      pendingZoomAnchorRef.current = { ratio, viewportOffset };
    }

    setZoomIndex(nextZoomIndex);
  }, [defaultZoomIndex, safeZoomIndex, visualWidth]);

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 1 : -1, event.clientX);
  }, [changeZoom]);

  const selectEvent = useCallback((eventId: string) => {
    document.getElementById(eventCardId(eventId))?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, []);

  const handleHoverPoint = useCallback((markerId: string, events: SessionEventEnvelope[]) => {
    if (events.length === 0) {
      setHoveredPoint(null);
      return;
    }

    setHoveredPoint({
      eventIds: new Set(events.map((event) => event.eventId)),
      markerId,
    });
    document.getElementById(eventCardId(events[0].eventId))?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, []);

  return (
    <section style={{ display: "flex", flex: 1, flexDirection: "column", gap: "0.875rem", minHeight: 0 }}>
      <div
        style={{
          background: panelColors.panel,
          border: `1px solid ${panelColors.border}`,
          borderRadius: radii.lg,
          boxShadow: shadows.lg,
          color: panelColors.text,
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <TimelineHeader
          eventCount={session.events.length}
          layout={layout}
          metricSummary={metricSummary}
          session={session}
        />
        <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
          <ChartFloatingControls
            isCollapsed={isTrafficCollapsed}
            mode={chartMode}
            onCollapsedChange={setIsTrafficCollapsed}
          />
          {!isTrafficCollapsed && (
            <ChartModeSelector
              mode={chartMode}
              onModeChange={setChartMode}
            />
          )}
          <ZoomControls
            canZoomIn={safeZoomIndex < TIMELINE_ZOOM_LEVELS.length - 1}
            canZoomOut={safeZoomIndex > defaultZoomIndex}
            onZoomIn={() => { changeZoom(1); }}
            onZoomOut={() => { changeZoom(-1); }}
            zoomLabel={zoomLevel.label}
          />
          <div
            ref={scrollContainerRef}
            onWheel={handleWheel}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flex: 1,
              flexDirection: "column",
              minHeight: 0,
              overflowX: "auto",
              overflowY: "hidden",
              padding: timelineBodyPadding,
            }}
          >
            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                gap: "1rem",
                minHeight: 0,
                minWidth: `${visualWidth}px`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: timelineStackGap,
                  flexShrink: 0,
                }}
              >
                {!isTrafficCollapsed && <MetricChart activeEndPercent={activeEndPercent} isCollapsed={false} mode={chartMode} series={chartSeries} />}
                <RailScale
                  durationMs={layout.durationMs}
                  startMs={layout.startMs}
                  timelineWidth={visualWidth}
                  visualDurationMs={visualDurationMs}
                  zoomLevel={zoomLevel}
                />
                <TimelineRails
                  activeEndPercent={activeEndPercent}
                  hoveredPoint={hoveredPoint}
                  layout={layout}
                  onHoverPoint={handleHoverPoint}
                  onSelect={selectEvent}
                  sessionId={session.sessionId}
                  zoomLevel={zoomLevel}
                />
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowX: "visible", overflowY: "auto" }}>
                <EventCardStrip
                  activeEndPercent={activeEndPercent}
                  hoveredPoint={hoveredPoint}
                  layout={layout}
                  sessionEvents={session.events}
                  timelineWidth={visualWidth}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
