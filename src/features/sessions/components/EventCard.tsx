"use client";

import { type CSSProperties, useState } from "react";

import type { SessionEventEnvelope } from "@/lib/sessions/types";
import { SessionEventType } from "@/lib/sessions/types";
import { colors, radii, shadows, typography } from "@/styles/tokens";
import { downloadVideo, openVideo } from "@/lib/shared/video/downloadService";

interface EventCardProps {
  event: SessionEventEnvelope;
  index: number;
}

interface EventTheme {
  accent: string;
  background: string;
  label: string;
  icon: string;
  messageType: "in" | "out" | null;
}

const EVENT_THEMES: Record<SessionEventType, EventTheme> = {
  [SessionEventType.SESSION_CREATED]: {
    accent: colors.gray800,
    background: colors.gray100,
    label: "Session Created",
    icon: "+",
    messageType: null,
  },
  [SessionEventType.SESSION_CONNECTED]: {
    accent: colors.green800,
    background: colors.green100,
    label: "Session Connected",
    icon: "~",
    messageType: "in",
  },
  [SessionEventType.SESSION_CLOSED]: {
    accent: colors.green800,
    background: colors.green100,
    label: "Session Closed",
    icon: "×",
    messageType: "in",
  },
  [SessionEventType.SESSION_REQUESTED]: {
    accent: colors.teal800,
    background: colors.teal100,
    label: "Session Requested",
    icon: "?",
    messageType: "in",
  },
  [SessionEventType.STEP_RENDERED]: {
    accent: colors.violet800,
    background: colors.violet100,
    label: "Step Rendered",
    icon: ">",
    messageType: "out",
  },
  [SessionEventType.STEP_SUBMITTED]: {
    accent: colors.red800,
    background: colors.red100,
    label: "Step Submitted",
    icon: "^",
    messageType: "in",
  },
  [SessionEventType.ALERT_RENDERED]: {
    accent: colors.yellow800,
    background: colors.yellow100,
    label: "Alert Rendered",
    icon: "!",
    messageType: "out",
  },
  [SessionEventType.ALERT_RESPONDED]: {
    accent: colors.yellow800,
    background: colors.yellow100,
    label: "Alert Responded",
    icon: "*",
    messageType: "in",
  },
  [SessionEventType.SESSION_RESULT]: {
    accent: colors.gray800,
    background: colors.gray100,
    label: "Session Result",
    icon: "=",
    messageType: "out",
  },
  [SessionEventType.TAILING_STEP]: {
    accent: colors.gray500,
    background: colors.gray50,
    label: "Tailing Step",
    icon: "~",
    messageType: "out",
  },
  [SessionEventType.TAILING_END]: {
    accent: colors.gray500,
    background: colors.gray50,
    label: "Tailing End",
    icon: "x",
    messageType: "out",
  },
};

function DirectionIcon({ type, color }: { type: "in" | "out"; color: string }) {
  if (type === "out") {
    // Arrow exiting the server box leftward (tower → pilot)
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="15" y="2" width="7" height="20" rx="2" strokeWidth="2" />
        <line x1="15" y1="12" x2="4" y2="12" />
        <polyline points="9 7 4 12 9 17" />
      </svg>
    );
  }
  // Arrow entering the server box rightward (pilot → tower)
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="15" y="2" width="7" height="20" rx="2" strokeWidth="2" />
      <line x1="2" y1="12" x2="15" y2="12" />
      <polyline points="10 7 15 12 10 17" />
    </svg>
  );
}

export function EventCard({ event, index }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme =
    EVENT_THEMES[event.type] ?? EVENT_THEMES[SessionEventType.SESSION_CREATED];

  const dateLabel = new Date(event.occurredAt);
  const timeLabel =
    dateLabel.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }) + `.${dateLabel.getMilliseconds()}`;

  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.gray200}`,
        borderLeft: `3px solid ${theme.accent}`,
        borderRadius: radii.lg,
        boxShadow: shadows.xs,
        overflow: "hidden",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          background: theme.background,
          borderBottom: `1px solid ${colors.gray100}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.bold,
              color: colors.gray400,
              width: "18px",
            }}
          >
            #{index + 1}
          </span>
          {theme.messageType && (
            <DirectionIcon type={theme.messageType} color={theme.accent} />
          )}
          <span
            style={{
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.bold,
              color: theme.accent,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {theme.label}
          </span>
        </div>
        <span
          style={{
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.bold,
          }}
        >
          {timeLabel}
        </span>
      </div>

      {/* Card Body — Event-specific rendering */}
      <div style={{ padding: "0.75rem 1rem" }}>
        <EventPayloadSummary event={event} />
      </div>

      {/* Expandable Raw Payload */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderTop: `1px solid ${colors.gray100}`,
          padding: "0.5rem",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: typography.sizes["xs"],
            color: colors.gray400,
            fontWeight: typography.weights.medium,
            width: "100%",
            textAlign: "left",
          }}
        >
          {isExpanded ? "Hide raw payload" : "Show raw payload"}
        </button>
        {isExpanded && (
          <pre
            style={{
              fontSize: typography.sizes["xs"],
              color: colors.gray600,
              background: colors.gray50,
              padding: "0.5rem",
              margin: 0,
              borderRadius: radii.md,
              overflow: "auto",
              maxHeight: "200px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function EventPayloadSummary({ event }: { event: SessionEventEnvelope }) {
  const { type, payload } = event;
  const fieldStyle: CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    alignItems: "baseline",
    fontSize: typography.sizes.sm,
  };

  const labelStyle: CSSProperties = {
    color: colors.gray400,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes["2xs"],
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    minWidth: "60px",
  };

  const valueStyle: CSSProperties = {
    color: colors.gray700,
    fontFamily: "monospace",
    fontSize: typography.sizes.xs,
    wordBreak: "break-all",
  };

  switch (type) {
    case SessionEventType.SESSION_CREATED: {
      return (
        <div style={fieldStyle}>
          <span style={labelStyle}>Workflow</span>
          <span style={valueStyle}>{String(payload.workflowId ?? "—")}</span>
        </div>
      );
    }

    case SessionEventType.SESSION_CONNECTED: {
      const device = payload.device as Record<string, unknown> | null;
      const { sessionId, connectionId } = event;
      const videoButtonStyle: CSSProperties = {
        flexShrink: 0,
        padding: "0.25rem 0.625rem",
        border: `1px solid ${colors.green700}`,
        borderRadius: radii.md,
        background: colors.green100,
        color: colors.green700,
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.semibold,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        whiteSpace: "nowrap",
      };

      return (
        <div
          style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
        >
          {/* Device fields */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {device ? (
              <>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Browser</span>
                  <span style={valueStyle}>
                    {String(device.browserName ?? "—")}{" "}
                    {String(device.browserVersion ?? "")}
                  </span>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>OS</span>
                  <span style={valueStyle}>
                    {String(device.osName ?? "—")}{" "}
                    {String(device.osVersion ?? "")}
                  </span>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Device</span>
                  <span style={valueStyle}>
                    {String(device.deviceType ?? "—")}
                    {device.model ? ` (${String(device.model)})` : ""}
                  </span>
                </div>
              </>
            ) : (
              <span style={{ ...valueStyle, color: colors.gray400 }}>
                No device info
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",

              gap: "0.5rem",
              flexShrink: 0,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => openVideo(sessionId, connectionId)}
              style={videoButtonStyle}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Preview
            </button>
            <button
              onClick={() => downloadVideo(sessionId, connectionId)}
              style={videoButtonStyle}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          </div>
        </div>
      );
    }

    case SessionEventType.STEP_RENDERED: {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Step</span>
            <span style={valueStyle}>{String(payload.stepId ?? "—")}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Type</span>
            <span style={valueStyle}>{String(payload.stepType ?? "—")}</span>
          </div>
          {payload.end === true && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Final</span>
              <span style={{ ...valueStyle, color: colors.amber600 }}>
                Last step
              </span>
            </div>
          )}
        </div>
      );
    }

    case SessionEventType.STEP_SUBMITTED: {
      const submittedData = payload.data;
      const preview = submittedData
        ? JSON.stringify(submittedData).slice(0, 120)
        : "—";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {payload.stepId != null && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Step</span>
              <span style={valueStyle}>{String(payload.stepId)}</span>
            </div>
          )}
          <div style={fieldStyle}>
            <span style={labelStyle}>Data</span>
            <span style={valueStyle}>
              {preview}
              {preview.length >= 120 ? "..." : ""}
            </span>
          </div>
        </div>
      );
    }

    case SessionEventType.SESSION_REQUESTED: {
      const device = payload.device as Record<string, unknown> | null;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {device ? (
            <>
              <div style={fieldStyle}>
                <span style={labelStyle}>Browser</span>
                <span style={valueStyle}>
                  {String(device.browserName ?? "—")}{" "}
                  {String(device.browserVersion ?? "")}
                </span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>OS</span>
                <span style={valueStyle}>
                  {String(device.osName ?? "—")}{" "}
                  {String(device.osVersion ?? "")}
                </span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Device</span>
                <span style={valueStyle}>
                  {String(device.deviceType ?? "—")}
                  {device.model ? ` (${String(device.model)})` : ""}
                </span>
              </div>
            </>
          ) : (
            <span style={{ ...valueStyle, color: colors.gray400 }}>
              No device info
            </span>
          )}
        </div>
      );
    }

    case SessionEventType.ALERT_RENDERED: {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Alert</span>
            <span style={valueStyle}>{String(payload.alertType ?? "—")}</span>
          </div>
        </div>
      );
    }

    case SessionEventType.ALERT_RESPONDED: {
      const result = String(payload.result ?? "—");
      const responded = payload.data as Record<string, unknown> | undefined;
      const preview = responded
        ? JSON.stringify(responded).slice(0, 120)
        : undefined;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Alert</span>
            <span style={valueStyle}>{String(payload.alertType ?? "—")}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Result</span>
            <span
              style={{
                ...valueStyle,
                color: result === "submitted" ? colors.green700 : colors.red700,
                fontWeight: typography.weights.semibold,
              }}
            >
              {result}
            </span>
          </div>
          {preview && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Data</span>
              <span style={valueStyle}>
                {preview}
                {preview.length >= 120 ? "..." : ""}
              </span>
            </div>
          )}
        </div>
      );
    }

    case SessionEventType.SESSION_RESULT: {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Result</span>
            <span style={valueStyle}>{String(payload.type ?? "—")}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Reason</span>
            <span style={valueStyle}>{String(payload.reason ?? "—")}</span>
          </div>
        </div>
      );
    }

    case SessionEventType.TAILING_STEP: {
      return (
        <div style={fieldStyle}>
          <span style={labelStyle}>Step</span>
          <span style={valueStyle}>{String(payload.stepType ?? "—")}</span>
        </div>
      );
    }

    case SessionEventType.TAILING_END: {
      return (
        <span style={{ ...valueStyle, color: colors.gray400 }}>
          Session ended for tailing connection
        </span>
      );
    }

    case SessionEventType.SESSION_CLOSED: {
      const wasClean = payload.wasClean === true;
      const reason = payload.reason == null ? "" : String(payload.reason);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Code</span>
            <span style={valueStyle}>{String(payload.code ?? "—")}</span>
          </div>
          {reason && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Reason</span>
              <span style={valueStyle}>{reason}</span>
            </div>
          )}
          <div style={fieldStyle}>
            <span style={labelStyle}>Clean</span>
            <span
              style={{
                ...valueStyle,
                color: wasClean ? colors.green700 : colors.red700,
                fontWeight: typography.weights.semibold,
              }}
            >
              {wasClean ? "yes" : "no"}
            </span>
          </div>
        </div>
      );
    }

    default:
      return (
        <span style={{ ...valueStyle, color: colors.gray400 }}>
          Unknown event
        </span>
      );
  }
}
