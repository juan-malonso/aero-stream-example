'use client';

import type { ConnectionGroup, PlatformSession } from '@/lib/platform/types';
import { colors, radii, shadows, typography } from '@/styles/tokens';

import { EventCard } from './EventCard';
import { SessionReplay } from './SessionReplay';

interface SessionDetailProps {
  session: PlatformSession | null;
  isLoading: boolean;
}

function ConnectionSection({ group, index }: { group: ConnectionGroup; index: number }) {
  const timeLabel = group.connectedAt
    ? new Date(group.connectedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : null;

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
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
      {/* Vertical connection card */}
      <div style={{
        position: 'relative',
        padding: '0.25rem',
        flexShrink: 0,
        background: colors.green50,
        border: `1px solid ${colors.green200}`,
        borderLeft: `3px solid ${colors.green700}`,
        borderRadius: radii.lg,
        boxShadow: shadows.xs,
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
      }}>
        {/* Rotated text — starts at bottom, overflow clips at top */}
        <div style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          overflow: 'hidden',
          padding: '0.75rem 0',
          userSelect: 'none',
        }}>
          {/* Connection label — highest priority */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: typography.sizes['2xs'],
              fontWeight: typography.weights.bold,
              color: colors.green700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {`Connection #${index + 1}`}
            </span>
            <span style={{
              fontSize: typography.sizes['2xs'],
              fontWeight: typography.weights.bold,
              color: colors.green700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {`Connection #${index + 1}`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {/* Device parts — lower emphasis */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {deviceParts.flatMap((part, i) => [
                <span key={`val-d-${i}`} style={{ 
                  fontSize: typography.sizes['2xs'], 
                  color: colors.gray400 
                }}>
                  {part}
                </span>,
              ])}
            </div>

            {/* UUID — monospace, medium emphasis */}
            <span style={{
              fontFamily: 'monospace',
              fontSize: typography.sizes['2xs'],
              color: colors.gray400,
            }}>
              {group.connectionId}
            </span>
          </div>
        </div>
      </div>

      {/* Events column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: colors.gray400,
        fontSize: typography.sizes.base,
      }}>
        Loading session...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: colors.gray400,
        fontSize: typography.sizes.base,
      }}>
        Select a session to inspect
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
      {/* Session Header */}
      <div style={{
        background: colors.white,
        border: `1px solid ${colors.gray200}`,
        borderRadius: radii.lg,
        padding: '0.5rem',
        boxShadow: shadows.xs,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.bold,
              color: colors.gray400,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}>
              Session
            </div>
            <div style={{
              fontSize: typography.sizes.base,
              fontWeight: typography.weights.bold,
              color: colors.gray800,
              fontFamily: 'monospace',
            }}>
              {session.sessionId}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: typography.sizes.xs,
              fontWeight: typography.weights.bold,
              color: colors.gray400,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}>
              Workflow
            </div>
            <div style={{
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              color: colors.gray600,
              fontFamily: 'monospace',
            }}>
              {session.workflowId}
            </div>
          </div>
        </div>
      </div>

      {/* Replay */}
      <SessionReplay sessionId={session.sessionId} />

      {/* Event Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.bold,
          color: colors.gray500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Event Timeline ({session.events.length})
        </div>

        {/* Session-scoped events (before any connection) */}
        {session.events
          .filter((e) => !e.connectionId)
          .map((event, index) => (
            <EventCard key={event.eventId} event={event} index={index} />
          ))}

        {/* Connection sections */}
        {session.connections.map((group, groupIndex) => (
          <ConnectionSection key={group.connectionId} group={group} index={groupIndex} />
        ))}
      </div>
    </div>
  );
}
