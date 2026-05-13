'use client';

import { ConnectionStatus } from '@/constants';

import { AlertScreen, CompletionScreen, ErrorScreen, InfoScreen, KYCComponent, VideoComponent, WelcomeComponent, DoneComponent } from '@/components/steps';

import {
  type AeroStreamComponentParams,
  type AeroStreamLibrary,
  type AeroStreamAlertScreenParams,
  AeroStreamPilot,
  PilotLogMode,
} from 'aero-stream-pilot';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Column } from '@/components/ui';
import { getPilotSyncUrl } from '@/lib/tower/towerRuntime.service.ts';
import { colors, typography } from '@/styles/tokens';

interface PilotConnectionProps {
  workflowId: string;
  sessionId: string;
  secret: string;
  onSessionId: (id: string | null) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onConnectionOpenChange: (isOpen: boolean) => void;
  onTimeTick: () => void;
  onTimeReset: () => void;
}

export interface PilotConnectionHandle {
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const PilotConnection = forwardRef<PilotConnectionHandle, PilotConnectionProps>(
  function PilotConnection({ workflowId, sessionId, secret, onSessionId, onStatusChange, onConnectionOpenChange, onTimeTick, onTimeReset }, ref) {
  const stepLibrary: AeroStreamLibrary<React.ReactNode> = {
    WelcomeComponent: (props: AeroStreamComponentParams) => <WelcomeComponent {...props} />,
    VideoComponent: (props: AeroStreamComponentParams) => <VideoComponent {...props} />,
    KYCComponent: (props: AeroStreamComponentParams) => <KYCComponent {...props} />,
    DoneComponent: (props: AeroStreamComponentParams) => <DoneComponent {...props} />,
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionWatchRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionAttemptRef = useRef(0);

  const [status, setStatus] = useState(ConnectionStatus.closed);
  const [currentStep, setCurrentStep] = useState<React.ReactNode | null>(null);
  const [currentAlert, setCurrentAlert] = useState<React.ReactNode | null>(null);
  const [completionState, setCompletionState] = useState<'none' | 'success' | 'error'>('none');

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  const pilotRef = useRef<AeroStreamPilot | null>(null);

  const resetConnectionState = ({ clearScreen = true }: { clearScreen?: boolean } = {}) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (connectionWatchRef.current) {
      clearInterval(connectionWatchRef.current);
      connectionWatchRef.current = null;
    }

    pilotRef.current = null;
    onConnectionOpenChange(false);
    if (clearScreen) {
      setCurrentStep(null);
      setCurrentAlert(null);
    }
    setStatus(ConnectionStatus.closed);
  };

  const watchConnection = (pilot: AeroStreamPilot<React.ReactNode>) => {
    if (connectionWatchRef.current) {
      clearInterval(connectionWatchRef.current);
    }

    connectionWatchRef.current = setInterval(() => {
      if (!pilot.isConnected) {
        resetConnectionState({ clearScreen: false });
      }
    }, 250);
  };

  const alertScreen = useCallback((params: AeroStreamAlertScreenParams | null): React.ReactNode => {
    if (!params) {
      setCurrentAlert(null);
      return null;
    }
    const node = AlertScreen(params);
    setCurrentAlert(node);
    return node;
  }, []);

  const handleConnect = async () => {
    if (!workflowId || !sessionId || status === ConnectionStatus.connecting || status === ConnectionStatus.active) {
      return;
    }

    try {
      if (!secret.trim()) {
        throw new Error('Workflow secret is required before connecting Pilot to Tower');
      }

      const attemptId = connectionAttemptRef.current + 1;
      connectionAttemptRef.current = attemptId;
      setStatus(ConnectionStatus.connecting);
      setCompletionState('none');
      onSessionId(sessionId);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: true,
      });

      if (connectionAttemptRef.current !== attemptId) {
        stream.getTracks().forEach((track) => { track.stop(); });
        return;
      }

      pilotRef.current?.disconnect();
      const pilot = new AeroStreamPilot<React.ReactNode>({
        url: getPilotSyncUrl(),
        secret,
        sessionId,
        logMode: PilotLogMode.developer,
        video: {
          stream,
          chunkIntervalMs: 500,
          targetFps: 12,
          maxWidth: 1280,
          maxHeight: 720,
          socketChunkBytes: 64 * 1024,
        },
        library: stepLibrary,
        errorScreen: ErrorScreen,
        alertScreen,
        infoScreen: InfoScreen,
        renderer: setCurrentStep,
        onComplete: ({ ok }) => {
          setCompletionState(ok ? 'success' : 'error');
          setStatus(ConnectionStatus.closed);
          onConnectionOpenChange(false);
          void pilot.disconnect();
        },
        onMessage: () => { /* noop */ },
        onClose: () => {
          resetConnectionState({ clearScreen: false });
        },
      });
      pilotRef.current = pilot;

      await pilot.connect();

      if (connectionAttemptRef.current !== attemptId) {
        pilot.disconnect();
        return;
      }

      if (pilotRef.current === pilot && pilot.isConnected) {
        setStatus(ConnectionStatus.active);
        onConnectionOpenChange(true);
        watchConnection(pilot);

        onTimeReset();
        timerRef.current = setInterval(() => { onTimeTick(); }, 1000);
      }
    } catch (error: unknown) {
      setStatus(ConnectionStatus.error);
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    connectionAttemptRef.current += 1;
    setCompletionState('none');

    if (pilotRef.current) {
      const pilot = pilotRef.current;
      pilotRef.current = null;
      pilot.disconnect();
    }

    resetConnectionState({ clearScreen: true });
  };

  useImperativeHandle(ref, () => ({
    connect: handleConnect,
    disconnect: handleDisconnect,
  }), [workflowId, status, sessionId, secret]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (connectionWatchRef.current) {
        clearInterval(connectionWatchRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: colors.gray300,
      border: `1px solid ${colors.gray200}`,
      borderRadius: '1.25rem',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', color: colors.gray600 }}>
        {completionState !== 'none' ? (
          <CompletionScreen ok={completionState === 'success'} />
        ) : (currentStep ?? (
          <Column align="center" justify="center" style={{ height: '100%' }} gap="1rem">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: typography.sizes.md, fontWeight: typography.weights.bold }}>Ready for Sync</div>
              <div style={{ fontSize: typography.sizes.sm, color: colors.gray500 }}>Select a workflow and click connect</div>
            </div>
          </Column>
        ))}

        {currentAlert}
      </div>
    </div>
  );
});
