'use client';

import { ConnectionStatus } from '@/constants';
import { LiveViewer, PerformanceStats, VideoHistory } from './developer';
import { PilotConnection } from './implement';

import { useCallback, useState } from 'react';
import { useWorkflowMetadata } from '@/hooks/useWorkflow';
import { downloadVideo } from '@/lib/video/downloadService';
import { Row, Column, Select } from '@/components/ui';
import { colors, radii, shadows, typography } from '@/styles/tokens';
import { sectionHeaderStyle } from '@/styles/theme';

export function PilotExample() {
  const { workflows, activeWorkflowId, selectWorkflow, isLoading } = useWorkflowMetadata();
  const [status, setStatus] = useState(ConnectionStatus.closed);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [videoHistory, setVideoHistory] = useState<{ id: string, date: string }[]>([]);
  const [connectionTime, setConnectionTime] = useState(0);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const handleSessionId = useCallback((id: string | null) => {
    setSessionId(id);
    if (id) {
      setVideoHistory((prev) => {
        if (prev.some((v) => v.id === id)) return prev;
        return [{ id, date: new Date().toLocaleString() }, ...prev];
      });
    }
  }, []);

  const handleDownloadVideo = async (id: string) => {
    await downloadVideo(id);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) {
      void selectWorkflow(id);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', background: colors.gray200 }}>
      {/* Main Simulation Area */}
      <main style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PilotConnection
          workflowId={activeWorkflowId || ''}
          onSessionId={handleSessionId}
          onStatusChange={setStatus}
          onTimeTick={() => { setConnectionTime((prev) => prev + 1); }}
          onTimeReset={() => { setConnectionTime(0); }}
        />
      </main>

      {/* Unified Developer Sidebar - Aligned with Builder */}
      <aside style={{
        width: '350px',
        height: '100%',
        backgroundColor: colors.white,
        borderLeft: `1px solid ${colors.gray200}`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: shadows.md
      }}>
        {/* Active Workflow Section */}
        <Column align="stretch" style={{ borderBottom: `1px solid ${colors.gray200}`, padding: '1rem' }}>
          <Select
            value={activeWorkflowId || ''}
            onChange={handleSelectChange}
            disabled={isLoading || status === ConnectionStatus.active}
            style={{
              width: '100%',
              borderRadius: radii.md,
              fontSize: typography.sizes.base,
              fontWeight: typography.weights.bold,
              border: `2px solid ${colors.blue500}`,
              background: colors.blue500,
              color: colors.white,
            }}
          >
            <option value="" disabled>
              {isLoading ? 'Loading...' : 'Select a workflow'}
            </option>
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id}>{wf.name}</option>
            ))}
          </Select>
        </Column>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Performance Stats */}
          <Column gap="0" align="stretch" style={{ borderBottom: `1px solid ${colors.gray200}` }}>
            <Row justify="space-between" align="center" style={{
              padding: '1rem',
              background: colors.gray50,
              borderBottom: `1px solid ${colors.gray200}`,
            }}>
              <div style={sectionHeaderStyle}>Health & Performance</div>
            </Row>
            <div style={{ padding: '0.75rem' }}>
              <PerformanceStats status={status} connectionTime={connectionTime} />
            </div>
          </Column>

          {/* Replay Viewer */}
          <Column gap="0" align="stretch" style={{ borderBottom: `1px solid ${colors.gray200}` }}>
            <Row justify="space-between" align="center" style={{
              padding: '1rem',
              background: colors.gray50,
              borderBottom: `1px solid ${colors.gray200}`,
            }}>
              <div style={sectionHeaderStyle}>Live Replay</div>
            </Row>
            <div style={{ padding: '0.75rem' }}>
              <LiveViewer
                viewingId={viewingId}
                onClose={() => setViewingId(null)}
              />
            </div>
          </Column>

          {/* Session History */}
          <Column gap="0" align="stretch">
            <Row justify="space-between" align="center" style={{
              padding: '1rem',
              background: colors.gray50,
              borderBottom: `1px solid ${colors.gray200}`,
            }}>
              <div style={sectionHeaderStyle}>Session History</div>
            </Row>
            <div style={{ padding: '0.75rem' }}>
              <VideoHistory
                history={videoHistory}
                currentSessionId={sessionId}
                status={status}
                onViewVideo={(id) => setViewingId(id)}
                onDownloadVideo={(id) => void handleDownloadVideo(id)}
              />
            </div>
          </Column>
        </div>
      </aside>
    </div>
  );
}