"use client";

import { type CSSProperties, type KeyboardEvent, type MouseEvent, useState } from "react";

import { formatDisplayValue } from "@/libs/ui/display";
import type { SessionEventEnvelope } from "@/modules/aero-stream-tracker/lib/sessions/types";
import { SessionEventType } from "@/modules/aero-stream-tracker/lib/sessions/types";
import { colors, radii, shadows, typography } from "@/styles/tokens";

interface EventCardProperties {
  accentColor?: string;
  bodyExpanded?: boolean;
  defaultBodyExpanded?: boolean;
  event: SessionEventEnvelope;
  index: number;
  onBodyExpandedChange?: (isExpanded: boolean) => void;
}

export interface EventTheme {
  accent: string;
  background: string;
  label: string;
  icon: string;
  messageType: "in" | "out" | null;
}

interface EventStepSummary {
  id: string;
  name: string;
  type: string;
}

const eventCardColors = {
  border: colors.gray200,
  circleBorder: colors.gray300,
  header: colors.gray200,
  headerText: colors.gray900,
  headerTextMuted: colors.gray600,
  rawPayload: colors.gray100,
  shell: colors.white,
  text: colors.gray900,
  textMuted: colors.gray600,
};

const EVENT_BORDER_COLORS: Record<SessionEventType, string> = {
  [SessionEventType.SESSION_CREATE]: colors.gray700,
  [SessionEventType.SESSION_CONNECTED]: colors.green600,
  [SessionEventType.SESSION_CLOSED]: colors.green600,
  [SessionEventType.CONNECTION_REJECTED]: colors.red600,
  [SessionEventType.SESSION_REQUESTED]: colors.cyan600,
  [SessionEventType.FINISH_RENDER]: colors.violet600,
  [SessionEventType.STEP_RENDERED]: colors.violet600,
  [SessionEventType.STEP_CONDITION]: colors.gray700,
  [SessionEventType.STEP_START]: colors.violet600,
  [SessionEventType.STEP_RESPONSE]: colors.cyan600,
  [SessionEventType.STEP_SUBMITTED]: colors.red600,
  [SessionEventType.ALERT_RENDERED]: colors.amber600,
  [SessionEventType.ALERT_SUBMITTED]: colors.amber600,
  [SessionEventType.SESSION_RESULT]: colors.gray700,
  [SessionEventType.TAILING_RENDERED]: colors.gray700,
  [SessionEventType.TAILING_CLOSED]: colors.gray700,
};

function eventBorderColor(type: SessionEventType): string {
  return EVENT_BORDER_COLORS[type] ?? EVENT_BORDER_COLORS[SessionEventType.SESSION_CREATE];
}

export const EVENT_THEMES: Record<SessionEventType, EventTheme> = {
  [SessionEventType.SESSION_CREATE]: {
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
  [SessionEventType.CONNECTION_REJECTED]: {
    accent: colors.red800,
    background: colors.red100,
    label: "Connection Rejected",
    icon: "!",
    messageType: "in",
  },
  [SessionEventType.SESSION_REQUESTED]: {
    accent: colors.teal800,
    background: colors.teal100,
    label: "Session Requested",
    icon: "?",
    messageType: "in",
  },
  [SessionEventType.FINISH_RENDER]: {
    accent: colors.violet800,
    background: colors.violet100,
    label: "Finish Render",
    icon: ">",
    messageType: "out",
  },
  [SessionEventType.STEP_RENDERED]: {
    accent: colors.violet800,
    background: colors.violet100,
    label: "Step Rendered",
    icon: ">",
    messageType: "out",
  },
  [SessionEventType.STEP_CONDITION]: {
    accent: colors.gray800,
    background: colors.gray100,
    label: "Step Condition",
    icon: "?",
    messageType: "out",
  },
  [SessionEventType.STEP_START]: {
    accent: colors.violet800,
    background: colors.violet100,
    label: "Step Start",
    icon: ">",
    messageType: "out",
  },
  [SessionEventType.STEP_RESPONSE]: {
    accent: colors.teal800,
    background: colors.teal100,
    label: "Step Response",
    icon: "=",
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
  [SessionEventType.ALERT_SUBMITTED]: {
    accent: colors.yellow800,
    background: colors.yellow100,
    label: "Alert Submitted",
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
  [SessionEventType.TAILING_RENDERED]: {
    accent: colors.gray500,
    background: colors.gray50,
    label: "Tailing Rendered",
    icon: "~",
    messageType: "out",
  },
  [SessionEventType.TAILING_CLOSED]: {
    accent: colors.gray500,
    background: colors.gray50,
    label: "Tailing Closed",
    icon: "x",
    messageType: "out",
  },
};

export function DirectionIcon({ type, color }: { type: "in" | "out"; color: string }) {
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

function readEventStep(payload: Record<string, unknown>): EventStepSummary | null {
  const step = payload.step;
  if (typeof step !== "object" || step === null) return null;

  const candidate = step as Record<string, unknown>;
  if (
    typeof candidate.id !== "string"
    || typeof candidate.type !== "string"
    || typeof candidate.name !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    type: candidate.type,
  };
}

function previewValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  return JSON.stringify(value);
}

function previewConditionOperand(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return previewValue(value);
  }

  const record = value as Record<string, unknown>;
  if (typeof record.var === "string") return `"${record.var}"`;

  return previewValue(value);
}

function formatCondition(condition: unknown): { left?: string; operator?: string; right?: string; text: string } {
  if (condition === true) return { text: "Default transition" };
  if (condition === false) return { text: "Condition did not match" };
  if (typeof condition !== "object" || condition === null || Array.isArray(condition)) {
    return { text: previewValue(condition) };
  }

  const record = condition as Record<string, unknown>;
  const operator = Object.keys(record)[0];
  const operands = Array.isArray(record[operator]) ? record[operator] as unknown[] : [];
  const labels: Record<string, string> = {
    "==": "equals",
    "!=": "does not equal",
    ">": "is greater than",
    ">=": "is greater than or equal to",
    "<": "is less than",
    "<=": "is less than or equal to",
  };

  if (operator && operands.length >= 2) {
    return {
      left: previewConditionOperand(operands[0]),
      operator: labels[operator] ?? operator,
      right: previewConditionOperand(operands[1]),
      text: `${previewConditionOperand(operands[0])} ${labels[operator] ?? operator} ${previewConditionOperand(operands[1])}`,
    };
  }

  return { text: JSON.stringify(condition) };
}

function eventSubtitle(event: SessionEventEnvelope, step: EventStepSummary | null): string {
  if (step) return `${step.type} - ${step.name} · ${step.id}`;
  if (event.connectionId) return `${event.type} · connection ${event.connectionId}`;
  if (event.sessionId) return `${event.type} · session ${event.sessionId}`;
  return `${event.type} · ${event.source}`;
}

function EventIndexBadge({ color, index }: { color: string; index: number }) {
  return (
    <span
      style={{
        alignItems: "center",
        background: color,
        border: `1px solid color-mix(in srgb, ${colors.white} 32%, transparent)`,
        borderRadius: radii.full,
        color: colors.white,
        display: "flex",
        flexShrink: 0,
        height: "1.35rem",
        justifyContent: "center",
        lineHeight: 1,
        overflow: "visible",
        position: "relative",
        width: "1.35rem",
      }}
    >
      <span
        style={{
          fontSize: typography.sizes.lg,
          fontWeight: typography.weights.extrabold,
          left: "50%",
          lineHeight: 1,
          pointerEvents: "none",
          position: "absolute",
          textShadow: `0 1px 3px color-mix(in srgb, ${colors.black} 26%, transparent)`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
      >
        {index + 1}
      </span>
    </span>
  );
}

export function EventCard({
  accentColor,
  bodyExpanded,
  defaultBodyExpanded = true,
  event,
  index,
  onBodyExpandedChange,
}: EventCardProperties) {
  const [internalBodyExpanded, setInternalBodyExpanded] = useState(defaultBodyExpanded);
  const [isRawExpanded, setIsRawExpanded] = useState(false);
  const theme =
    EVENT_THEMES[event.type] ?? EVENT_THEMES[SessionEventType.SESSION_CREATE];
  const step = readEventStep(event.payload);
  const subtitle = eventSubtitle(event, step);
  const isBodyExpanded = bodyExpanded ?? internalBodyExpanded;
  const connectionAccent = accentColor ?? colors.yellow500;
  const eventAccent = eventBorderColor(event.type);
  const toggleBodyExpanded = () => {
    const nextBodyExpanded = !isBodyExpanded;
    setInternalBodyExpanded(nextBodyExpanded);
    onBodyExpandedChange?.(nextBodyExpanded);
  };
  const handleCardKeyDown = (keyboardEvent: KeyboardEvent<HTMLDivElement>) => {
    if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") return;
    keyboardEvent.preventDefault();
    toggleBodyExpanded();
  };
  const stopCardToggle = (mouseEvent: MouseEvent<HTMLElement>) => {
    mouseEvent.stopPropagation();
  };

  const dateLabel = new Date(event.occurredAt);
  const timeLabel =
    `${dateLabel.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })  }.${dateLabel.getMilliseconds()}`;

  return (
    <div
      aria-expanded={isBodyExpanded}
      onClick={toggleBodyExpanded}
      onKeyDown={handleCardKeyDown}
      role="button"
      style={{
        background: eventCardColors.shell,
        border: `1px solid ${eventCardColors.border}`,
        borderLeft: `5px solid ${eventAccent}`,
        borderRadius: radii.lg,
        boxShadow: shadows.xs,
        cursor: "pointer",
        overflow: "hidden",
      }}
      tabIndex={0}
    >
      {/* Card Header */}
      <div
        style={{
        display: "grid",
        gap: "0.35rem",
        padding: "0.5rem 1rem",
        background: eventCardColors.header,
        borderBottom: `1px solid ${eventCardColors.border}`,
      }}
    >
        <div
          style={{
            alignItems: "center",
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            minWidth: 0,
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: "0.5rem", minWidth: 0 }}>
            <EventIndexBadge color={connectionAccent} index={index} />
            {theme.messageType && (
              <span style={{ display: "flex", flexShrink: 0 }}>
                <DirectionIcon type={theme.messageType} color={eventCardColors.headerTextMuted} />
              </span>
            )}
            <span
              style={{
                color: eventCardColors.headerText,
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.bold,
                letterSpacing: "0.03em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {theme.label}
            </span>
          </div>
          <div style={{ alignItems: "center", display: "flex", gap: "0.75rem" }}>
            <span
              style={{
                color: eventCardColors.headerText,
                fontSize: typography.sizes.xs,
                fontWeight: typography.weights.bold,
                whiteSpace: "nowrap",
              }}
            >
              {timeLabel}
            </span>
          </div>
        </div>
        <div
          style={{
            color: eventCardColors.headerTextMuted,
            fontSize: typography.sizes.xs,
            fontWeight: typography.weights.medium,
            letterSpacing: 0,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={subtitle}
        >
          {subtitle}
        </div>
      </div>

      {isBodyExpanded && (
        <>
          {/* Card Body — Event-specific rendering */}
          <div style={{ padding: "0.75rem 1rem" }}>
            <EventPayloadSummary event={event} />
          </div>

          {/* Expandable Raw Payload */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderTop: `1px solid ${eventCardColors.border}`,
              padding: "0.5rem",
              gap: "0.5rem",
            }}
          >
            <button
              onClick={(mouseEvent) => {
                stopCardToggle(mouseEvent);
                setIsRawExpanded(!isRawExpanded);
              }}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: typography.sizes.xs,
                color: eventCardColors.textMuted,
                fontWeight: typography.weights.medium,
                width: "100%",
                textAlign: "left",
              }}
              type="button"
            >
              {isRawExpanded ? "Hide raw payload" : "Show raw payload"}
            </button>
            {isRawExpanded && (
              <pre
                style={{
                  fontSize: typography.sizes.xs,
                  color: eventCardColors.text,
                  background: eventCardColors.rawPayload,
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
        </>
      )}
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
    color: eventCardColors.textMuted,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes["2xs"],
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    minWidth: "60px",
  };

  const valueStyle: CSSProperties = {
    color: eventCardColors.text,
    fontFamily: "monospace",
    fontSize: typography.sizes.xs,
    wordBreak: "break-all",
  };

  switch (type) {
    case SessionEventType.SESSION_CREATE: {
      return (
        <div style={fieldStyle}>
          <span style={labelStyle}>Workflow</span>
          <span style={valueStyle}>{formatDisplayValue(payload.workflowId)}</span>
        </div>
      );
    }

    case SessionEventType.SESSION_CONNECTED: {
      const device = payload.device as Record<string, unknown> | null;

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
                    {formatDisplayValue(device.browserName)}{" "}
                    {formatDisplayValue(device.browserVersion, "")}
                  </span>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>OS</span>
                  <span style={valueStyle}>
                    {formatDisplayValue(device.osName)}{" "}
                    {formatDisplayValue(device.osVersion, "")}
                  </span>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Device</span>
                  <span style={valueStyle}>
                    {formatDisplayValue(device.deviceType)}
                    {device.model ? ` (${formatDisplayValue(device.model)})` : ""}
                  </span>
                </div>
              </>
            ) : (
              <span style={{ ...valueStyle, color: eventCardColors.textMuted }}>
                No device info
              </span>
            )}
          </div>
        </div>
      );
    }

    case SessionEventType.CONNECTION_REJECTED: {
      return (
        <div style={fieldStyle}>
          <span style={labelStyle}>Reason</span>
          <span style={valueStyle}>{formatDisplayValue(payload.reason)}</span>
        </div>
      );
    }

    case SessionEventType.FINISH_RENDER:
    case SessionEventType.STEP_RENDERED: {
      const properties = payload.props as Record<string, unknown> | undefined;
      const preview = properties ? JSON.stringify(properties).slice(0, 120) : undefined;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {event.type === SessionEventType.FINISH_RENDER && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Final</span>
              <span style={{ ...valueStyle, color: colors.amber600 }}>
                Last step
              </span>
            </div>
          )}
          {preview && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Props</span>
              <span style={valueStyle}>
                {preview}
                {preview.length >= 120 ? "..." : ""}
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

    case SessionEventType.STEP_CONDITION: {
      const condition = formatCondition(payload.condition ?? true);
      const nextStep = readEventStep({
        step: payload.nextStep,
      });
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Rule</span>
            {condition.operator ? (
              <span
                style={{
                  ...valueStyle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  flexWrap: "wrap",
                }}
              >
                <span>{condition.left}</span>
                <span style={{ color: eventCardColors.textMuted }}>{condition.operator}</span>
                <span>{condition.right}</span>
              </span>
            ) : (
              <span style={valueStyle}>{condition.text}</span>
            )}
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Next</span>
            <span style={valueStyle}>
              {nextStep ? `${nextStep.type} - ${nextStep.name}` : "—"}
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
                  {formatDisplayValue(device.browserName)}{" "}
                  {formatDisplayValue(device.browserVersion, "")}
                </span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>OS</span>
                <span style={valueStyle}>
                  {formatDisplayValue(device.osName)}{" "}
                  {formatDisplayValue(device.osVersion, "")}
                </span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Device</span>
                <span style={valueStyle}>
                  {formatDisplayValue(device.deviceType)}
                  {device.model ? ` (${formatDisplayValue(device.model)})` : ""}
                </span>
              </div>
            </>
          ) : (
            <span style={{ ...valueStyle, color: eventCardColors.textMuted }}>
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
            <span style={valueStyle}>{formatDisplayValue(payload.alertType)}</span>
          </div>
        </div>
      );
    }

    case SessionEventType.ALERT_SUBMITTED: {
      const result = formatDisplayValue(payload.result);
      const responded = payload.data as Record<string, unknown> | undefined;
      const preview = responded
        ? JSON.stringify(responded).slice(0, 120)
        : undefined;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Alert</span>
            <span style={valueStyle}>{formatDisplayValue(payload.alertType)}</span>
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

    case SessionEventType.STEP_START: {
      const input = payload.input as Record<string, unknown> | undefined;
      const preview = input ? JSON.stringify(input).slice(0, 120) : "—";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Input</span>
            <span style={valueStyle}>
              {preview}
              {preview.length >= 120 ? "..." : ""}
            </span>
          </div>
        </div>
      );
    }

    case SessionEventType.STEP_RESPONSE: {
      const result = payload.result as Record<string, unknown> | undefined;
      const data = result?.data as Record<string, unknown> | undefined;
      const preview = data ? JSON.stringify(data).slice(0, 120) : "—";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Status</span>
            <span style={valueStyle}>{formatDisplayValue(result?.status)}</span>
          </div>
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

    case SessionEventType.SESSION_RESULT: {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Result</span>
            <span style={valueStyle}>{formatDisplayValue(payload.type)}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Reason</span>
            <span style={valueStyle}>{formatDisplayValue(payload.reason)}</span>
          </div>
        </div>
      );
    }

    case SessionEventType.TAILING_RENDERED: {
      return (
        <div style={fieldStyle}>
          <span style={labelStyle}>Step</span>
          <span style={valueStyle}>{formatDisplayValue(payload.stepType)}</span>
        </div>
      );
    }

    case SessionEventType.TAILING_CLOSED: {
      return (
        <span style={{ ...valueStyle, color: eventCardColors.textMuted }}>
          Session ended for tailing connection
        </span>
      );
    }

    case SessionEventType.SESSION_CLOSED: {
      const wasClean = payload.wasClean === true;
      const reason = formatDisplayValue(payload.reason, "");
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Code</span>
            <span style={valueStyle}>{formatDisplayValue(payload.code)}</span>
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
        <span style={{ ...valueStyle, color: eventCardColors.textMuted }}>
          Unknown event
        </span>
      );
  }
}
