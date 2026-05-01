'use client';

import type { PlatformSession } from '@/lib/platform/types';
import { colors, radii, shadows, typography } from '@/styles/tokens';

import { EventCard } from './EventCard';
import { SessionReplay } from './SessionReplay';

interface SessionDetailProps {
  session: PlatformSession | null;
  isLoading: boolean;
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
      <div style={{ display: 'flex', flexDirection: 'column',  gap: '0.75rem' }}>
        <div style={{
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.bold,
          color: colors.gray500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Event Timeline ({session.events.length})
        </div>

        {session.events.map((event, index) => (
          <EventCard key={event.eventId} event={event} index={index} />
        ))}
      </div>
    </div>
  );
}
