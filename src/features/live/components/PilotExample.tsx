'use client';

import { ConnectionStatus } from '@/constants';
import { PerformanceStats } from './developer';
import { PilotConnection, type PilotConnectionHandle } from './implement';

import { useCallback, useRef, useState } from 'react';
import { useWorkflowMetadata } from '@/hooks/useWorkflow';
import { Row, Column, Select, Button } from '@/components/ui';
import { colors, radii, shadows, typography } from '@/styles/tokens';
import { sectionHeaderStyle } from '@/styles/theme';

export function PilotExample() {
  const { workflows, activeWorkflowId, selectWorkflow, isLoading } = useWorkflowMetadata();
  const [status, setStatus] = useState(ConnectionStatus.closed);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connectionTime, setConnectionTime] = useState(0);

  const pilotRef = useRef<PilotConnectionHandle>(null);

  const handleSessionId = useCallback((id: string | null) => {
    setSessionId(id);
  }, []);

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
          ref={pilotRef}
          workflowId={activeWorkflowId || ''}
          onSessionId={handleSessionId}
          onStatusChange={setStatus}
          onTimeTick={() => { setConnectionTime((prev) => prev + 1); }}
          onTimeReset={() => { setConnectionTime(0); }}
        />
      </main>

      {/* Developer Sidebar */}
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

        {/* Session Controls */}
        <Column gap="0" align="stretch" style={{ borderBottom: `1px solid ${colors.gray200}` }}>
          <Row justify="space-between" align="center" style={{
            padding: '1rem',
            background: colors.gray50,
            borderBottom: `1px solid ${colors.gray200}`,
          }}>
            <div style={sectionHeaderStyle}>Session Controls</div>
          </Row>
          <div style={{ padding: '0.75rem' }}>
            <Column gap="0.5rem" align="stretch">
              <Button
                onClick={() => { void pilotRef.current?.createSession(); }}
                disabled={status === ConnectionStatus.active || !activeWorkflowId}
                variant="primary"
                size="lg"
                style={{ width: '100%', borderRadius: '8px', boxShadow: shadows.sm }}
              >
                {sessionId ? 'Session Ready' : 'Create Session'}
              </Button>
              <Button
                onClick={() => { void pilotRef.current?.connect(); }}
                disabled={status === ConnectionStatus.active || !sessionId}
                variant="primary"
                size="lg"
                style={{ width: '100%', borderRadius: '8px', boxShadow: shadows.sm }}
              >
                {status === ConnectionStatus.active ? 'System Active' : 'Connect to Session'}
              </Button>
              <Button
                onClick={() => { pilotRef.current?.disconnect(); }}
                disabled={status === ConnectionStatus.closed}
                variant="secondary"
                size="lg"
                style={{ width: '100%', borderRadius: '8px' }}
              >
                Abort
              </Button>
            </Column>
          </div>
        </Column>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Performance Stats */}
          <Column gap="0" align="stretch">
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
        </div>
      </aside>
    </div>
  );
}
