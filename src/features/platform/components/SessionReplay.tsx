'use client';

import { useState } from 'react';

import { LiveViewer } from '@/features/live/components/developer/LiveViewer';
import { downloadVideo } from '@/lib/video/downloadService';
import { Button } from '@/components/ui';
import { colors, radii, shadows, typography } from '@/styles/tokens';

interface SessionReplayProps {
  sessionId: string;
}

export function SessionReplay({ sessionId }: SessionReplayProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleDownload = () => {
    void downloadVideo(sessionId);
  };

  return (
    <div style={{
      background: colors.white,
      border: `1px solid ${colors.gray200}`,
      borderRadius: radii.lg,
      boxShadow: shadows.xs,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        background: colors.gray50,
        borderBottom: `1px solid ${colors.gray200}`,
      }}>
        <span style={{
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.bold,
          color: colors.gray500,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Session Replay
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsViewerOpen(!isViewerOpen)}
            style={{ fontSize: typography.sizes.xs, height: '26px', borderRadius: '6px' }}
          >
            {isViewerOpen ? 'Hide Replay' : 'View Replay'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            style={{ width: '26px', height: '26px', padding: 0, borderRadius: '6px' }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </Button>
        </div>
      </div>

      {isViewerOpen && (
        <div style={{ padding: '0.75rem' }}>
          <LiveViewer
            viewingId={sessionId}
            onClose={() => setIsViewerOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
