'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Column, Select } from '@/libs/ui';
import { towerRuntimeService } from '@/modules/aero-stream-runner/lib/tower/towerRuntime.service';
import { type RunnerWorkflowMetadata, runnerWorkflowReader } from '@/modules/aero-stream-runner/lib/workflows/workflows.service';
import { colors, radii, shadows, typography } from '@/styles/tokens';

import { BrowserWindow } from '../components';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function RunnerApp() {
  const [workflows, setWorkflows] = useState<RunnerWorkflowMetadata[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [emulatorUrl, setEmulatorUrl] = useState('');
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionUrl = useMemo(() => (
    uuidPattern.test(sessionId) && activeWorkflowId
      ? `/live/${sessionId}?workflowId=${encodeURIComponent(activeWorkflowId)}`
      : ''
  ), [activeWorkflowId, sessionId]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkflows() {
      try {
        setError(null);
        setIsLoadingWorkflows(true);
        const data = await runnerWorkflowReader.getWorkflows();
        if (!isMounted) return;
        setWorkflows(data);
        setActiveWorkflowId(currentId => currentId ?? data[0]?.id ?? null);
      } catch (error_) {
        if (isMounted) {
          setError(error_ instanceof Error ? error_.message : 'Unable to load workflows');
        }
      } finally {
        if (isMounted) setIsLoadingWorkflows(false);
      }
    }

    void loadWorkflows();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateSession = useCallback(async () => {
    if (!activeWorkflowId || isCreatingSession) return;

    try {
      setError(null);
      setIsCreatingSession(true);
      const data = await towerRuntimeService.createSession(activeWorkflowId);
      if (!data.sessionId || !uuidPattern.test(data.sessionId)) {
        throw new Error('Tower returned an invalid session id');
      }
      setSessionId(data.sessionId);
      setEmulatorUrl('');
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to create session');
    } finally {
      setIsCreatingSession(false);
    }
  }, [activeWorkflowId, isCreatingSession]);

  return (
    <div style={pageStyle}>
      <aside style={sidebarStyle}>
        <Column gap="1rem" align="stretch">
          <div>
            <div style={eyebrowStyle}>AeroStream Runner</div>
            <h2 style={titleStyle}>Session launcher</h2>
          </div>

          <Select
            value={activeWorkflowId ?? ''}
            disabled={isLoadingWorkflows || isCreatingSession}
            onChange={(event) => {
              setActiveWorkflowId(event.target.value || null);
              setSessionId('');
              setEmulatorUrl('');
            }}
          >
            <option value="" disabled>
              {isLoadingWorkflows ? 'Loading workflows...' : 'Select workflow'}
            </option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </Select>

          <Button
            onClick={() => { void handleCreateSession(); }}
            disabled={!activeWorkflowId || isCreatingSession}
            variant="primary"
            size="lg"
          >
            {isCreatingSession ? 'Creating session...' : 'Start runner session'}
          </Button>

          <div style={sessionCardStyle}>
            <div style={sessionLabelStyle}>Session URL</div>
            {sessionUrl ? (
              <a href={sessionUrl} target="_blank" rel="noreferrer" style={sessionLinkStyle}>
                {sessionUrl}
              </a>
            ) : (
              <div style={sessionValueStyle}>No session created yet</div>
            )}
          </div>

          <Button
            onClick={() => { setEmulatorUrl(sessionUrl); }}
            disabled={!sessionUrl}
            variant="primary"
            size="md"
          >
            Load in emulator
          </Button>

          {error ? <div style={errorStyle}>{error}</div> : null}
        </Column>
      </aside>

      <main style={previewColumnStyle}>
        <BrowserWindow src={emulatorUrl} />
      </main>
    </div>
  );
}

const pageStyle: CSSProperties = {
  background: 'var(--surface-canvas, color-mix(in srgb, var(--color-emerald500) 15%, var(--color-gray50)))',
  display: 'grid',
  gridTemplateColumns: '360px minmax(0, 1fr)',
  height: '100%',
  overflow: 'hidden',
};

const sidebarStyle: CSSProperties = {
  background: colors.white,
  borderRight: `1px solid ${colors.gray200}`,
  boxShadow: shadows.sm,
  padding: '1.25rem',
};

const previewColumnStyle: CSSProperties = {
  minHeight: 0,
  padding: '1.25rem',
};

const eyebrowStyle: CSSProperties = {
  color: 'var(--surface-primary600, var(--color-blue600))',
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.bold,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const titleStyle: CSSProperties = {
  color: colors.gray900,
  fontSize: typography.sizes['2xl'],
  fontWeight: typography.weights.bold,
  margin: 0,
};

const sessionCardStyle: CSSProperties = {
  background: colors.gray50,
  border: `1px solid ${colors.gray200}`,
  borderRadius: radii.md,
  padding: '0.85rem',
};

const sessionLabelStyle: CSSProperties = {
  color: colors.gray500,
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.semibold,
  marginBottom: '0.35rem',
  textTransform: 'uppercase',
};

const sessionValueStyle: CSSProperties = {
  color: colors.gray800,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: typography.sizes.sm,
  overflowWrap: 'anywhere',
};

const sessionLinkStyle: CSSProperties = {
  ...sessionValueStyle,
  color: 'var(--surface-primary700, var(--color-blue700))',
  display: 'block',
  fontWeight: typography.weights.semibold,
  textDecoration: 'underline',
  textUnderlineOffset: '0.18em',
};

const errorStyle: CSSProperties = {
  background: colors.red50,
  border: `1px solid ${colors.red200}`,
  borderRadius: radii.md,
  color: colors.red700,
  fontSize: typography.sizes.sm,
  padding: '0.75rem',
};
