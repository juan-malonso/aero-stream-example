'use client';

import { useState } from 'react';

import type { SessionSummary } from '@/lib/sessions/types';
import { colors, radii, typography } from '@/styles/tokens';

interface SessionListProperties {
  sessions: SessionSummary[];
  selectedSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
}

export function SessionList({ sessions, selectedSessionId, isLoading, onSelectSession }: SessionListProperties) {
  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: colors.gray400, fontSize: typography.sizes.sm }}>
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: colors.gray400,
        fontSize: typography.sizes.sm,
      }}>
        No operations yet. Run an onboarding session to see events here.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {sessions.map((session) => (
        <SessionListItem
          key={session.sessionId}
          session={session}
          isSelected={session.sessionId === selectedSessionId}
          onSelect={() => { onSelectSession(session.sessionId); }}
        />
      ))}
    </div>
  );
}

interface SessionListItemProperties {
  session: SessionSummary;
  isSelected: boolean;
  onSelect: () => void;
}

function SessionListItem({ session, isSelected, onSelect }: SessionListItemProperties) {
  const [isHovered, setIsHovered] = useState(false);
  const shortId = session.sessionId.slice(0, 8);
  const timeLabel = formatRelativeTime(session.lastActivityAt);
  const durationLabel = formatDuration(session.createdAt, session.lastActivityAt);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => { setIsHovered(true); }}
      onMouseLeave={() => { setIsHovered(false); }}
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.55rem 0.85rem',
        border: 'none',
        borderLeft: isSelected ? `3px solid ${colors.yellow500}` : '3px solid transparent',
        borderBottom: `1px solid ${colors.gray100}`,
        background: isSelected ? colors.yellow50 : (isHovered ? colors.yellow50 : 'transparent'),
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
        <span style={{
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.bold,
          color: colors.gray700,
          fontFamily: 'monospace',
        }}>
          {shortId}...
        </span>
        <span style={{
          fontSize: typography.sizes['2xs'],
          color: colors.gray400,
          whiteSpace: 'nowrap',
        }}>
          {timeLabel}
        </span>
      </div>
      <span style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: '0.35rem', flexShrink: 0 }}>
        <span style={{
          fontSize: typography.sizes['2xs'],
          fontWeight: typography.weights.semibold,
          color: colors.gray700,
          background: colors.gray50,
          border: `1px solid ${colors.gray200}`,
          padding: '1px 6px',
          borderRadius: radii.full,
        }}>
          {session.eventCount} events
        </span>
        <span style={{
          background: colors.yellow100,
          border: `1px solid ${colors.yellow300}`,
          borderRadius: radii.full,
          color: colors.yellow700,
          fontSize: typography.sizes['2xs'],
          fontWeight: typography.weights.bold,
          padding: '1px 6px',
        }}>
          {durationLabel}
        </span>
      </span>
    </button>
  );
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDuration(startIsoDate: string, endIsoDate: string): string {
  const startMs = new Date(startIsoDate).getTime();
  const endMs = new Date(endIsoDate).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return '0ms';

  const totalMs = Math.max(0, endMs - startMs);
  if (totalMs < 1000) return `${totalMs}ms`;

  const totalSeconds = Math.round(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${minutes}m ${seconds}s`;

  return `${hours}h ${remainingMinutes}m`;
}
