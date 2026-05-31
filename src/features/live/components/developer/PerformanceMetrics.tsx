import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";

import { ConnectionStatus } from "@/constants";
import { colors, radii, typography } from "@/styles/tokens";

type RuntimeVisibilityState = DocumentVisibilityState | "unknown";

interface BrowserPerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface RuntimePerformanceMetrics {
  fps: number;
  frameTimeMs: number | null;
  heapLimitMb: number | null;
  heapPressure: number | null;
  heapTotalMb: number | null;
  heapUsedMb: number | null;
  isOnline: boolean | null;
  visibilityState: RuntimeVisibilityState;
}

interface PerformanceStatsProperties {
  connectionTime: number;
  hasSessionId: boolean;
  isConnectionOpen: boolean;
  isSessionIdValid: boolean;
  status: ConnectionStatus;
}

interface MetricRowProperties {
  detail?: string;
  label: string;
  progress?: number;
  progressColor?: string;
  value: ReactNode;
}

interface ReadinessRowProperties {
  label: string;
  state: "blocked" | "ready" | "waiting";
  value: string;
}

const emptyMetrics: RuntimePerformanceMetrics = {
  fps: 0,
  frameTimeMs: null,
  heapLimitMb: null,
  heapPressure: null,
  heapTotalMb: null,
  heapUsedMb: null,
  isOnline: null,
  visibilityState: "unknown",
};

function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState(emptyMetrics);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const readMemoryMetrics = () => {
      const perf = performance as Performance & {
        memory?: BrowserPerformanceMemory;
      };

      if (!perf.memory) {
        return {
          heapLimitMb: null,
          heapPressure: null,
          heapTotalMb: null,
          heapUsedMb: null,
        };
      }

      const heapLimitMb = bytesToMb(perf.memory.jsHeapSizeLimit);
      const heapTotalMb = bytesToMb(perf.memory.totalJSHeapSize);
      const heapUsedMb = bytesToMb(perf.memory.usedJSHeapSize);

      return {
        heapLimitMb,
        heapPressure:
          heapLimitMb > 0 ? Math.round((heapUsedMb / heapLimitMb) * 100) : null,
        heapTotalMb,
        heapUsedMb,
      };
    };

    const readBrowserState = (): Pick<
      RuntimePerformanceMetrics,
      "isOnline" | "visibilityState"
    > => ({
      isOnline: typeof navigator === "undefined" ? null : navigator.onLine,
      visibilityState:
        typeof document === "undefined" ? "unknown" : document.visibilityState,
    });

    const syncBrowserState = () => {
      setMetrics((current) => ({ ...current, ...readBrowserState() }));
    };

    const updateMetrics = () => {
      const now = performance.now();
      frames++;

      if (now - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        const frameTimeMs = fps > 0 ? roundToOneDecimal(1000 / fps) : null;

        setMetrics((current) => ({
          ...current,
          ...readBrowserState(),
          ...readMemoryMetrics(),
          fps,
          frameTimeMs,
        }));

        frames = 0;
        lastTime = now;
      }
      animationFrameId = requestAnimationFrame(updateMetrics);
    };

    syncBrowserState();
    animationFrameId = requestAnimationFrame(updateMetrics);
    window.addEventListener("online", syncBrowserState);
    window.addEventListener("offline", syncBrowserState);
    document.addEventListener("visibilitychange", syncBrowserState);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("online", syncBrowserState);
      window.removeEventListener("offline", syncBrowserState);
      document.removeEventListener("visibilitychange", syncBrowserState);
    };
  }, []);

  return metrics;
}

export function PerformanceStats({
  connectionTime,
  hasSessionId,
  isConnectionOpen,
  isSessionIdValid,
  status,
}: PerformanceStatsProperties) {
  const metrics = usePerformanceMetrics();
  const statusMeta = getStatusMeta(status);
  const fpsProgress = clampProgress(Math.round((metrics.fps / 60) * 100));
  const fpsGap = metrics.fps > 0 ? Math.max(0, 60 - metrics.fps) : null;
  const heapProgress = metrics.heapPressure ?? undefined;
  const sessionState = getSessionState(hasSessionId, isSessionIdValid);
  const transportState = getTransportState(status, isConnectionOpen);

  return (
    <section style={panelStyle} aria-label="Runtime health and performance">
      <div style={summaryStyle}>
        <div style={summaryTitleStyle}>
          <div style={summaryLabelStyle}>Health & Performance</div>
        </div>
        <div style={{ ...statusBadgeStyle, color: statusMeta.color }}>
          <span
            aria-hidden="true"
            style={{ ...statusDotStyle, backgroundColor: statusMeta.color }}
          />
          Runtime {statusMeta.label}
        </div>
      </div>

      <MetricGroup title="Flow execution">
        <ReadinessRow
          label="Session ID"
          state={sessionState.state}
          value={sessionState.value}
        />
        <ReadinessRow
          label="Transport"
          state={transportState.state}
          value={transportState.value}
        />
        <MetricRow label="Uptime" value={formatTime(connectionTime)} />
      </MetricGroup>

      <MetricGroup title="Render performance">
        <MetricRow
          label="Frame rate"
          value={`${metrics.fps > 0 ? metrics.fps.toString() : "--"} FPS`}
          detail="Target 60 FPS"
          progress={fpsProgress}
          progressColor={getFpsColor(metrics.fps)}
        />
        <MetricRow
          label="Frame budget"
          value={
            metrics.frameTimeMs === null ? "--" : `${metrics.frameTimeMs} ms`
          }
          detail="16.7 ms or lower keeps 60 FPS"
        />
        <MetricRow
          label="60 FPS gap"
          value={fpsGap === null ? "--" : `${fpsGap} FPS`}
          detail="Lower is better"
        />
      </MetricGroup>

      <MetricGroup title="Browser resources">
        <MetricRow
          label="JS heap used"
          value={formatMb(metrics.heapUsedMb)}
          detail={
            metrics.heapTotalMb === null
              ? "Chrome-only metric"
              : `${formatMb(metrics.heapTotalMb)} allocated`
          }
          progress={heapProgress}
          progressColor={getHeapColor(metrics.heapPressure)}
        />
        <MetricRow
          label="JS heap limit"
          value={formatMb(metrics.heapLimitMb)}
        />
        <MetricRow
          label="Network"
          value={formatOnlineState(metrics.isOnline)}
        />
        <MetricRow
          label="Tab visibility"
          value={formatVisibility(metrics.visibilityState)}
        />
      </MetricGroup>
    </section>
  );
}

function MetricGroup({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div style={groupStyle}>
      <div style={groupTitleStyle}>{title}</div>
      <div style={groupRowsStyle}>{children}</div>
    </div>
  );
}

function MetricRow({
  detail,
  label,
  progress,
  progressColor = colors.blue500,
  value,
}: MetricRowProperties) {
  return (
    <div style={metricRowStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={metricLabelStyle}>{label}</div>
        {detail ? <div style={metricDetailStyle}>{detail}</div> : null}
      </div>
      <div style={metricValueColumnStyle}>
        <div style={metricValueStyle}>{value}</div>
        {typeof progress === "number" ? (
          <div style={meterTrackStyle} aria-hidden="true">
            <div
              style={{
                ...meterFillStyle,
                backgroundColor: progressColor,
                width: `${clampProgress(progress)}%`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReadinessRow({ label, state, value }: ReadinessRowProperties) {
  const stateColor = getReadinessColor(state);

  return (
    <div style={metricRowStyle}>
      <div style={readinessLabelStyle}>
        <span
          aria-hidden="true"
          style={{ ...smallDotStyle, backgroundColor: stateColor }}
        />
        <span>{label}</span>
      </div>
      <div style={{ ...metricValueStyle, color: stateColor }}>{value}</div>
    </div>
  );
}

function getStatusMeta(status: ConnectionStatus) {
  switch (status) {
    case ConnectionStatus.active:
      return { color: colors.emerald600, label: "Active" };
    case ConnectionStatus.connecting:
      return { color: colors.amber600, label: "Connecting" };
    case ConnectionStatus.error:
      return { color: colors.red600, label: "Error" };
    case ConnectionStatus.closed:
    default:
      return { color: colors.gray500, label: "Closed" };
  }
}

function getSessionState(
  hasSessionId: boolean,
  isSessionIdValid: boolean,
): Pick<ReadinessRowProperties, "state" | "value"> {
  if (!hasSessionId) {
    return { state: "waiting", value: "Pending" };
  }
  if (!isSessionIdValid) {
    return { state: "blocked", value: "Invalid" };
  }
  return { state: "ready", value: "Valid" };
}

function getTransportState(
  status: ConnectionStatus,
  isConnectionOpen: boolean,
): Pick<ReadinessRowProperties, "state" | "value"> {
  if (status === ConnectionStatus.error) {
    return { state: "blocked", value: "Error" };
  }
  if (status === ConnectionStatus.connecting) {
    return { state: "waiting", value: "Connecting" };
  }
  if (isConnectionOpen || status === ConnectionStatus.active) {
    return { state: "ready", value: "Open" };
  }
  return { state: "waiting", value: "Idle" };
}

function getReadinessColor(state: ReadinessRowProperties["state"]) {
  switch (state) {
    case "ready":
      return colors.emerald600;
    case "blocked":
      return colors.red600;
    case "waiting":
    default:
      return colors.amber600;
  }
}

function getFpsColor(fps: number) {
  if (fps >= 55) {
    return colors.emerald500;
  }
  if (fps >= 35) {
    return colors.amber500;
  }
  return colors.red500;
}

function getHeapColor(heapPressure: number | null) {
  if (heapPressure === null || heapPressure < 60) {
    return colors.emerald500;
  }
  if (heapPressure < 80) {
    return colors.amber500;
  }
  return colors.red500;
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function formatMb(value: number | null) {
  return value === null ? "--" : `${value} MB`;
}

function formatOnlineState(isOnline: boolean | null) {
  if (isOnline === null) {
    return "Unknown";
  }
  return isOnline ? "Online" : "Offline";
}

function formatVisibility(visibilityState: RuntimeVisibilityState) {
  if (visibilityState === "unknown") {
    return "Unknown";
  }
  return visibilityState.charAt(0).toUpperCase() + visibilityState.slice(1);
}

function bytesToMb(value: number) {
  return Math.round(value / 1024 / 1024);
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

const panelStyle: CSSProperties = {
  background: colors.white,
  boxSizing: "border-box",
  width: "100%",
};

const summaryStyle: CSSProperties = {
  alignItems: "center",
  background: colors.gray50,
  borderBottom: `1px solid ${colors.gray200}`,
  display: "flex",
  gap: "0.75rem",
  justifyContent: "space-between",
  padding: "0.875rem 1rem",
};

const summaryTitleStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.125rem",
  minWidth: 0,
};

const statusDotStyle: CSSProperties = {
  borderRadius: radii.full,
  flex: "0 0 auto",
  height: "0.45rem",
  width: "0.45rem",
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--surface-primary500, var(--color-gray500))",
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.bold,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const summarySubtitleStyle: CSSProperties = {
  color: colors.gray500,
  fontSize: typography.sizes.md,
  fontWeight: typography.weights.medium,
};

const statusBadgeStyle: CSSProperties = {
  alignItems: "center",
  background: colors.white,
  border: `1px solid ${colors.gray200}`,
  borderRadius: radii.full,
  display: "inline-flex",
  flexShrink: 0,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  gap: "0.375rem",
  padding: "0.25rem 0.5rem",
  textTransform: "uppercase",
};

const groupStyle: CSSProperties = {
  padding: "0.6rem 0.75rem",
};

const groupTitleStyle: CSSProperties = {
  color: colors.gray500,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  marginBottom: "0.25rem",
  textTransform: "uppercase",
};

const groupRowsStyle: CSSProperties = {
  borderTop: `1px solid ${colors.gray100}`,
};

const metricRowStyle: CSSProperties = {
  alignItems: "center",
  borderBottom: `1px solid ${colors.gray100}`,
  display: "flex",
  gap: "0.75rem",
  justifyContent: "space-between",
  minHeight: "28px",
  padding: "0.3rem 0",
};

const metricLabelStyle: CSSProperties = {
  color: colors.gray700,
  fontSize: typography.sizes.md,
  fontWeight: typography.weights.semibold,
  lineHeight: 1.25,
};

const metricDetailStyle: CSSProperties = {
  color: colors.gray400,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.medium,
  lineHeight: 1.25,
  marginTop: "1px",
};

const metricValueColumnStyle: CSSProperties = {
  alignItems: "flex-end",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  minWidth: "88px",
};

const metricValueStyle: CSSProperties = {
  color: colors.gray800,
  fontSize: typography.sizes.md,
  fontWeight: typography.weights.bold,
  lineHeight: 1.2,
  textAlign: "right",
  whiteSpace: "nowrap",
};

const meterTrackStyle: CSSProperties = {
  background: colors.gray200,
  borderRadius: radii.full,
  height: "4px",
  overflow: "hidden",
  width: "82px",
};

const meterFillStyle: CSSProperties = {
  borderRadius: radii.full,
  height: "100%",
};

const readinessLabelStyle: CSSProperties = {
  alignItems: "center",
  color: colors.gray700,
  display: "flex",
  fontSize: typography.sizes.md,
  fontWeight: typography.weights.semibold,
  gap: "0.375rem",
  lineHeight: 1.25,
};

const smallDotStyle: CSSProperties = {
  borderRadius: radii.full,
  flex: "0 0 auto",
  height: "0.45rem",
  width: "0.45rem",
};
