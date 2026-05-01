'use client';

import { ConnectionStatus } from '@/constants';
import { PerformanceStats } from './developer';
import { PilotConnection, type PilotConnectionHandle } from './implement';

import { useCallback, useRef, useState } from 'react';
import { useWorkflowMetadata } from '@/hooks/useWorkflow';
import { Row, Column, Select, Button, Input } from '@/components/ui';
import { colors, radii, shadows, typography } from '@/styles/tokens';
import { sectionHeaderStyle } from '@/styles/theme';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const apiUrl = 'http://localhost:8787';

export function PilotExample() {
  const { workflows, activeWorkflowId, selectWorkflow, isLoading } = useWorkflowMetadata();
  const [status, setStatus] = useState(ConnectionStatus.closed);
  const [sessionId, setSessionId] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [connectionTime, setConnectionTime] = useState(0);

  const pilotRef = useRef<PilotConnectionHandle>(null);
  const isConnecting = status === ConnectionStatus.connecting;
  const isSessionBusy = isConnecting || isConnectionOpen || isCreatingSession;
  const canAbort = isConnecting || isConnectionOpen;
  const isSessionIdValid = uuidPattern.test(sessionId);

  const handleSessionId = useCallback((id: string | null) => {
    if (id) {
      setSessionId(id);
    }
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) {
      void selectWorkflow(id);
    }
  };

  const handleCreateSession = async () => {
    if (!activeWorkflowId || isSessionBusy) {
      return;
    }

    try {
      setIsCreatingSession(true);
      const response = await fetch(`${apiUrl}/app/${activeWorkflowId}`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Unable to create session: ${response.status}`);
      }

      const data = await response.json() as { sessionId?: string };
      if (!data.sessionId || !uuidPattern.test(data.sessionId)) {
        throw new Error('Session ID missing or invalid in create-session response');
      }

      setSessionId(data.sessionId);
      setStatus(ConnectionStatus.closed);
    } catch (error) {
      setStatus(ConnectionStatus.error);
      console.error('Session creation error:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', background: colors.gray200 }}>
      {/* Main Simulation Area */}
      <main style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PilotConnection
          ref={pilotRef}
          workflowId={activeWorkflowId || ''}
          sessionId={isSessionIdValid ? sessionId : ''}
          onSessionId={handleSessionId}
          onStatusChange={setStatus}
          onConnectionOpenChange={setIsConnectionOpen}
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
              <Select
                value={activeWorkflowId || ''}
                onChange={handleSelectChange}
                disabled={isLoading || isSessionBusy}
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

              <Row gap="0.5rem" align="center">
                <div style={{ position: 'relative', flex: 1 }}>
                  <Input
                    value={sessionId}
                    onChange={(event) => {
                      setSessionId(event.target.value.trim());
                    }}
                    disabled={isSessionBusy}
                    aria-invalid={!isSessionIdValid}
                    aria-label="Session UUID"
                    style={{
                      paddingRight: '2rem',
                      borderColor: isSessionIdValid ? colors.blue500 : colors.red500,
                      color: isSessionIdValid ? colors.blue600 : colors.red700,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: typography.sizes.xs,
                      height: '38px',
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: isSessionIdValid ? colors.blue600 : colors.red600,
                      fontSize: typography.sizes.base,
                      fontWeight: typography.weights.bold,
                      lineHeight: 1,
                    }}
                  >
                    {isSessionIdValid ? '✓' : '✕'}
                  </span>
                </div>
                <Button
                  onClick={() => { void handleCreateSession(); }}
                  disabled={isSessionBusy || !activeWorkflowId}
                  variant="secondary"
                  size="lg"
                  aria-label="Create new session in Tower"
                  style={{ width: '48px', height: '38px', padding: 0, borderRadius: '8px' }}
                >
                  ↻
                </Button>
              </Row>
              <Button
                onClick={() => { void pilotRef.current?.connect(); }}
                disabled={isSessionBusy || !activeWorkflowId || !isSessionIdValid}
                variant="primary"
                size="lg"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  boxShadow: shadows.sm,
                }}
              >
                {status === ConnectionStatus.connecting ? 'Connecting...' : status === ConnectionStatus.active ? 'System Active' : 'Connect to Session'}
              </Button>
              <Button
                onClick={() => { pilotRef.current?.disconnect(); }}
                disabled={!canAbort}
                variant="danger"
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
