'use client';

import { useCallback, useEffect, useState } from 'react';

import type { PlatformSession, PlatformSessionSummary } from '@/lib/platform/types';
import { colors, shadows, typography } from '@/styles/tokens';

import { SessionDetail } from './SessionDetail';
import { SessionList } from './SessionList';

export function PlatformViewer() {
  const [sessions, setSessions] = useState<PlatformSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<PlatformSession | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions');
      if (!response.ok) return;
      const json = (await response.json()) as { data: PlatformSessionSummary[] };
      setSessions(json.data);
    } catch (error: unknown) {
      console.error('Failed to fetch platform sessions:', error);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleSelectSession = useCallback(async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) return;
      const json = (await response.json()) as { data: PlatformSession };
      setSelectedSession(json.data);
    } catch (error: unknown) {
      console.error('Failed to fetch session detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      background: colors.gray200,
    }}>
      {/* Session List — Left Pane */}
      <aside style={{
        width: '360px',
        height: '100%',
        backgroundColor: colors.white,
        borderRight: `1px solid ${colors.gray200}`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: shadows.md,
      }}>
        <div style={{
          padding: '1rem',
          borderBottom: `1px solid ${colors.gray200}`,
          backgroundColor: colors.gray50,
        }}>
          <div style={{
            fontSize: typography.sizes.base,
            fontWeight: typography.weights.bold,
            color: colors.gray500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Sessions
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SessionList
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            isLoading={isLoadingList}
            onSelectSession={(id) => void handleSelectSession(id)}
          />
        </div>
      </aside>

      {/* Session Detail — Right Pane */}
      <main style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
      }}>
        <SessionDetail
          session={selectedSession}
          isLoading={isLoadingDetail}
        />
      </main>
    </div>
  );
}
