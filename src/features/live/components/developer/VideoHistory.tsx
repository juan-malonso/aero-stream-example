'use client';

import { ConnectionStatus } from "@/constants";
import { Row, Column, Button } from "@/components/ui";
import { colors, typography } from '@/styles/tokens';
import { toolboxItemStyle } from "@/styles/theme";

interface VideoHistoryProps {
  history: { id: string; date: string }[];
  currentSessionId: string | null;
  status: ConnectionStatus;
  onDownloadVideo?: (id: string) => void;
}

interface VideoHistoryItemProps {
  session: { id: string; date: string };
  isActive: boolean;
  onDownload?: () => void;
}

export function VideoHistory({ history, currentSessionId, status, onDownloadVideo }: VideoHistoryProps) {
  return (
    <Column gap="0.5rem" align="stretch" style={{ overflowY: 'auto', maxHeight: '350px', paddingRight: '0.25rem' }}>
      {history.length === 0 ? (
        <div style={{
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px dashed ${colors.gray200}`,
          borderRadius: '8px'
        }}>
          <span style={{ color: colors.gray400, fontSize: typography.sizes.xs }}>No sessions in history</span>
        </div>
      ) : (
        history.map((session) => {
          const isActive = session.id === currentSessionId && status === ConnectionStatus.active;
          return (
            <VideoHistoryItem
              key={session.id}
              session={session}
              isActive={isActive}
              onDownload={onDownloadVideo ? () => { onDownloadVideo(session.id); } : undefined}
            />
          );
        })
      )}
    </Column>
  );
}

function VideoHistoryItem({ session, isActive, onDownload }: VideoHistoryItemProps) {
  const color = isActive ? colors.amber500 : colors.gray500;

  return (
    <div style={toolboxItemStyle(color)}>
      <Column style={{ width: '100%' }} gap="0.5rem">
        <Row justify="space-between" align="center" style={{ width: '100%' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color, letterSpacing: '0.02em' }}>
            {isActive ? 'BUFFERING' : 'READY'}
          </span>
          <span style={{ fontSize: '10px', color: colors.gray400 }}>{session.date}</span>
        </Row>

        <Row gap="0.5rem" style={{ marginTop: '2px', width: '100%', color: colors.gray500 }}>
          <span style={{ flex: 1, fontSize: '10px', color: colors.gray400, display: 'flex', alignItems: 'center' }}>
            {isActive ? 'Syncing...' : 'View in Platform tab'}
          </span>
          {onDownload && (
            <Button
              onClick={onDownload}
              variant="secondary"
              size="sm"
              style={{ width: '24px', height: '24px', padding: 0, borderRadius: '6px' }}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </Button>
          )}
        </Row>
      </Column>
    </div>
  );
}