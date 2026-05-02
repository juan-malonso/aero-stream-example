'use client';

import { type CSSProperties, useState } from 'react';

import type { PlatformEventEnvelope } from '@/lib/platform/types';
import { PlatformEventType } from '@/lib/platform/types';
import { colors, radii, shadows, typography } from '@/styles/tokens';

interface EventCardProps {
  event: PlatformEventEnvelope;
  index: number;
}

interface EventTheme {
  accent: string;
  background: string;
  label: string;
  icon: string;
}

const EVENT_THEMES: Record<PlatformEventType, EventTheme> = {
  [PlatformEventType.SESSION_CREATED]: {
    accent: colors.gray600,
    background: colors.gray50,
    label: 'Session Created',
    icon: '+',
  },
  [PlatformEventType.SESSION_CONNECTED]: {
    accent: colors.green700,
    background: colors.green100,
    label: 'Session Connected',
    icon: '~',
  },
  [PlatformEventType.STEP_RENDERED]: {
    accent: colors.violet500,
    background: colors.violet50,
    label: 'Step Rendered',
    icon: '>',
  },
  [PlatformEventType.STEP_SUBMITTED]: {
    accent: colors.amber500,
    background: colors.amber50,
    label: 'Step Submitted',
    icon: '^',
  },
  [PlatformEventType.SESSION_RESULT]: {
    accent: colors.gray600,
    background: colors.gray50,
    label: 'Session Result',
    icon: '=',
  },
};

export function EventCard({ event, index }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = EVENT_THEMES[event.type] ?? EVENT_THEMES[PlatformEventType.SESSION_CREATED];

  const timeLabel = new Date(event.occurredAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div style={{
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderLeft: `3px solid ${theme.accent}`,
      borderRadius: radii.lg,
      boxShadow: shadows.xs,
      overflow: 'hidden',
    }}>
      {/* Card Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        background: theme.background,
        borderBottom: `1px solid ${colors.gray100}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: typography.sizes['2xs'],
            fontWeight: typography.weights.bold,
            color: colors.gray400,
            width: '18px',
          }}>
            #{index + 1}
          </span>
          <span style={{
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.bold,
            color: theme.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}>
            {theme.label}
          </span>
        </div>
        <span style={{ fontSize: typography.sizes['2xs'], color: colors.gray400 }}>
          {timeLabel}
        </span>
      </div>

      {/* Card Body — Event-specific rendering */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <EventPayloadSummary type={event.type} payload={event.payload} />
      </div>

      {/* Expandable Raw Payload */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        borderTop: `1px solid ${colors.gray100}`,
        padding: '0.5rem',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: typography.sizes['xs'],
            color: colors.gray400,
            fontWeight: typography.weights.medium,
            width: '100%',
            textAlign: 'left',
          }}
        >
          {isExpanded ? 'Hide raw payload' : 'Show raw payload'}
        </button>
        {isExpanded && (
          <pre style={{
            fontSize: typography.sizes['xs'],
            color: colors.gray600,
            background: colors.gray50,
            padding: '0.5rem',
            margin: 0,
            borderRadius: radii.md,
            overflow: 'auto',
            maxHeight: '200px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function EventPayloadSummary({ type, payload }: { type: PlatformEventType; payload: Record<string, unknown> }) {
  const fieldStyle: CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'baseline',
    fontSize: typography.sizes.sm,
  };

  const labelStyle: CSSProperties = {
    color: colors.gray400,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes['2xs'],
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    minWidth: '60px',
  };

  const valueStyle: CSSProperties = {
    color: colors.gray700,
    fontFamily: 'monospace',
    fontSize: typography.sizes.xs,
    wordBreak: 'break-all',
  };

  switch (type) {
    case PlatformEventType.SESSION_CREATED: {
      return (
        <div style={fieldStyle}>
          <span style={labelStyle}>Workflow</span>
          <span style={valueStyle}>{String(payload.workflowId ?? '—')}</span>
        </div>
      );
    }

    case PlatformEventType.SESSION_CONNECTED: {
      const device = payload.device as Record<string, unknown> | null;
      if (!device) {
        return <span style={{ ...valueStyle, color: colors.gray400 }}>No device info</span>;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Browser</span>
            <span style={valueStyle}>{String(device.browserName ?? '—')} {String(device.browserVersion ?? '')}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>OS</span>
            <span style={valueStyle}>{String(device.osName ?? '—')} {String(device.osVersion ?? '')}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Device</span>
            <span style={valueStyle}>{String(device.deviceType ?? '—')}{device.model ? ` (${String(device.model)})` : ''}</span>
          </div>
        </div>
      );
    }

    case PlatformEventType.STEP_RENDERED: {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Step</span>
            <span style={valueStyle}>{String(payload.stepId ?? '—')}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Type</span>
            <span style={valueStyle}>{String(payload.stepType ?? '—')}</span>
          </div>
          {payload.end === true && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Final</span>
              <span style={{ ...valueStyle, color: colors.amber600 }}>Last step</span>
            </div>
          )}
        </div>
      );
    }

    case PlatformEventType.STEP_SUBMITTED: {
      const submittedData = payload.data;
      const preview = submittedData ? JSON.stringify(submittedData).slice(0, 120) : '—';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {payload.stepId != null && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Step</span>
              <span style={valueStyle}>{String(payload.stepId)}</span>
            </div>
          )}
          <div style={fieldStyle}>
            <span style={labelStyle}>Data</span>
            <span style={valueStyle}>{preview}{preview.length >= 120 ? '...' : ''}</span>
          </div>
        </div>
      );
    }

    case PlatformEventType.SESSION_RESULT: {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Result</span>
            <span style={valueStyle}>{String(payload.type ?? '—')}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Reason</span>
            <span style={valueStyle}>{String(payload.reason ?? '—')}</span>
          </div>
        </div>
      );
    }

    default:
      return <span style={{ ...valueStyle, color: colors.gray400 }}>Unknown event</span>;
  }
}
