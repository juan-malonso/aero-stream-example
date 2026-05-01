'use client';

import { useState } from 'react';

import type { PlatformSessionSummary } from '@/lib/platform/types';
import { colors, radii, typography } from '@/styles/tokens';

interface SessionListProps {
  sessions: PlatformSessionSummary[];
  selectedSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
}

export function SessionList({ sessions, selectedSessionId, isLoading, onSelectSession }: SessionListProps) {
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
          onSelect={() => onSelectSession(session.sessionId)}
        />
      ))}
    </div>
  );
}

interface SessionListItemProps {
  session: PlatformSessionSummary;
  isSelected: boolean;
  onSelect: () => void;
}

function SessionListItem({ session, isSelected, onSelect }: SessionListItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shortId = session.sessionId.slice(0, 8);
  const timeLabel = formatRelativeTime(session.lastActivityAt);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '0.75rem 1rem',
        border: 'none',
        borderLeft: isSelected ? `3px solid ${colors.blue500}` : '3px solid transparent',
        borderBottom: `1px solid ${colors.gray100}`,
        background: isSelected ? colors.blue50 : (isHovered ? colors.gray50 : 'transparent'),
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
          fontWeight: typography.weights.semibold,
          color: colors.blue600,
          background: colors.blue50,
          padding: '1px 6px',
          borderRadius: radii.full,
        }}>
          {session.eventCount} events
        </span>
      </div>
      <span style={{
        fontSize: typography.sizes['2xs'],
        color: colors.gray400,
      }}>
        {timeLabel}
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
