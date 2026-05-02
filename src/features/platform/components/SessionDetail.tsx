'use client';

import type { ConnectionGroup, PlatformSession } from '@/lib/platform/types';
import { PlatformEventType } from '@/lib/platform/types';
import { colors, radii, shadows, typography } from '@/styles/tokens';

import { EventCard } from './EventCard';

interface SessionDetailProps {
  session: PlatformSession | null;
  isLoading: boolean;
}

function ConnectionSection({ group, index }: { group: ConnectionGroup; index: number }) {
  const deviceParts = group.device
    ? [
        group.device.browserName
          ? `${String(group.device.browserName)} ${String(group.device.browserVersion ?? '')}`.trim()
          : null,
        group.device.osName ? String(group.device.osName) : null,
        group.device.deviceType ? String(group.device.deviceType) : null,
      ].filter((x): x is string => x !== null)
    : [];

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
      {/* Vertical connection label */}
      <div style={{
        position: 'relative',
        padding: '0.5rem',
        flexShrink: 0,
        background: colors.blue100,
        borderLeft: `3px solid ${colors.blue700}`,
        borderRadius: radii.lg,
        boxShadow: shadows.xs,
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          overflow: 'hidden',
          padding: '0.25rem',
          userSelect: 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: typography.sizes['2xs'], fontWeight: typography.weights.bold, color: colors.blue800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span style={{ color: colors.blue600 }}>{`#${index + 1}   `}</span>Connection
            </span>
            <span style={{ fontSize: typography.sizes['2xs'], fontWeight: typography.weights.bold, color: colors.blue800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span style={{ color: colors.blue600 }}>{`#${index + 1}   `}</span>Connection
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {deviceParts.map((part, i) => (
                <span key={i} style={{ fontSize: typography.sizes['2xs'], color: colors.gray400 }}>{part}</span>
              ))}
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: typography.sizes['2xs'], color: colors.gray400 }}>
              {group.connectionId}
            </span>
          </div>
        </div>
      </div>

      {/* Events column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {group.events.map((event, i) => (
          <EventCard key={event.eventId} event={event} index={i} />
        ))}
      </div>
    </div>
  );
}

export function SessionDetail({ session, isLoading }: SessionDetailProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.gray400, fontSize: typography.sizes.base }}>
        Loading session...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.gray400, fontSize: typography.sizes.base }}>
        Select a session to inspect
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
      {/* Session Header */}
      <div style={{ background: colors.white, border: `1px solid ${colors.gray200}`, borderRadius: radii.lg, padding: '0.75rem', boxShadow: shadows.xs }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Session
            </div>
            <div style={{ fontSize: typography.sizes.base, fontWeight: typography.weights.bold, color: colors.gray800, fontFamily: 'monospace' }}>
              {session.sessionId}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.gray400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Workflow
            </div>
            <div style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.gray600, fontFamily: 'monospace' }}>
              {session.workflowId}
            </div>
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Event Timeline ({session.events.length})
        </div>

        {session.events
          .filter((e) => !e.connectionId && e.type !== PlatformEventType.SESSION_RESULT)
          .map((event, index) => (
            <EventCard key={event.eventId} event={event} index={index} />
          ))}

        {session.connections.map((group, groupIndex) => (
          <ConnectionSection key={group.connectionId} group={group} index={groupIndex} />
        ))}

        {session.events
          .filter((e) => e.type === PlatformEventType.SESSION_RESULT)
          .map((event, index) => (
            <EventCard key={event.eventId} event={event} index={index} />
          ))}
      </div>
    </div>
  );
}
