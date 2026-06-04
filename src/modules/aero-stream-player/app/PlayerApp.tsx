'use client';

import { useSearchParams } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

import { runnerWorkflowReader } from '@/modules/aero-stream-runner/lib/workflows/workflows.service';
import { colors } from '@/styles/tokens';

import { PilotConnection } from '../components';

interface PlayerAppProperties {
  sessionId: string;
}

export function PlayerApp({ sessionId }: PlayerAppProperties) {
  const searchParameters = useSearchParams();
  const workflowId = searchParameters.get('workflowId');
  const [secret, setSecret] = useState('');
  const [workflowError, setWorkflowError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkflowSecret() {
      if (!workflowId) {
        setSecret('');
        setWorkflowError('Workflow id is required to start the Player');
        return;
      }

      try {
        setWorkflowError(undefined);
        const workflow = await runnerWorkflowReader.getWorkflowById(workflowId);
        if (!isMounted) return;
        setSecret(workflow.config.secret);
      } catch (error) {
        if (isMounted) {
          setSecret('');
          setWorkflowError(error instanceof Error ? error.message : 'Unable to load workflow secret');
        }
      }
    }

    void loadWorkflowSecret();

    return () => {
      isMounted = false;
    };
  }, [workflowId]);

  return (
    <div style={runnerSurfaceStyle}>
      <div style={stageStyle}>
        {workflowError ? (
          <div style={workflowErrorStyle}>{workflowError}</div>
        ) : (
          <PilotConnection
            sessionId={sessionId}
            secret={secret}
          />
        )}
      </div>
    </div>
  );
}

const runnerSurfaceStyle: CSSProperties = {
  background: colors.gray900,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
};

const stageStyle: CSSProperties = {
  flex: '1 1 0%',
  minHeight: 0,
};

const workflowErrorStyle: CSSProperties = {
  alignItems: 'center',
  background: colors.gray800,
  border: `1px solid ${colors.red500}`,
  borderRadius: '1rem',
  color: colors.white,
  display: 'flex',
  fontSize: '0.875rem',
  fontWeight: 600,
  height: '100%',
  justifyContent: 'center',
  padding: '1rem',
  textAlign: 'center',
};
