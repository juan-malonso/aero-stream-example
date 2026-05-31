'use client';

import {
  type AeroStreamAlertScreenParams,
  AeroStreamPilot,
  type AeroStreamTransportEvent,
  PilotLogMode,
} from 'aero-stream-pilot';
import { type CSSProperties, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { createLiveStepLibrary } from '@/aero-stream-example-library';
import { AlertScreen, CompletionScreen, ErrorScreen, InfoScreen } from '@/aero-stream-example-library/live/screens';
import { Column } from '@/components/ui';
import { ConnectionStatus } from '@/constants';
import { getPilotLiveUrl } from '@/lib/live/tower/towerRuntime.service.ts';
import { colors, typography } from '@/styles/tokens';

interface PilotConnectionProperties {
  workflowId: string;
  sessionId: string;
  secret: string;
  onSessionId: (id: string | null) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onConnectionOpenChange: (isOpen: boolean) => void;
  onTimeTick: () => void;
  onTimeReset: () => void;
  onTransportEvent: (event: AeroStreamTransportEvent) => void;
  onTransportReset: () => void;
}

export interface PilotConnectionHandle {
  connect: () => Promise<void>;
  disconnect: () => void;
}

const pilotConnectionContainerStyle: CSSProperties = {
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
};

const pilotConnectionStageStyle: CSSProperties = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  color: colors.gray600,
};

function ReadySyncPlaceholder(): React.ReactNode {
  return (
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
  );
}

export const PilotConnection = forwardRef<PilotConnectionHandle, PilotConnectionProperties>(
  function PilotConnection({ workflowId, sessionId, secret, onSessionId, onStatusChange, onConnectionOpenChange, onTimeTick, onTimeReset, onTransportEvent, onTransportReset }, reference) {
  const stepLibrary = createLiveStepLibrary();

  const timerReference = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionWatchReference = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionAttemptReference = useRef(0);

  const [status, setStatus] = useState(ConnectionStatus.closed);
  const [currentStep, setCurrentStep] = useState<React.ReactNode | null>(null);
  const [currentAlert, setCurrentAlert] = useState<React.ReactNode | null>(null);
  const [completionState, setCompletionState] = useState<'error' | 'none' | 'success'>('none');

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  const pilotReference = useRef<AeroStreamPilot | null>(null);

  const resetConnectionState = ({ clearScreen = true }: { clearScreen?: boolean } = {}) => {
    if (timerReference.current) {
      clearInterval(timerReference.current);
      timerReference.current = null;
    }
    if (connectionWatchReference.current) {
      clearInterval(connectionWatchReference.current);
      connectionWatchReference.current = null;
    }

    pilotReference.current = null;
    onConnectionOpenChange(false);
    if (clearScreen) {
      setCurrentStep(null);
      setCurrentAlert(null);
    }
    setStatus(ConnectionStatus.closed);
  };

  const watchConnection = (pilot: AeroStreamPilot<React.ReactNode>) => {
    if (connectionWatchReference.current) {
      clearInterval(connectionWatchReference.current);
    }

    connectionWatchReference.current = setInterval(() => {
      if (!pilot.isConnected) {
        resetConnectionState({ clearScreen: false });
      }
    }, 250);
  };

  const alertScreen = useCallback((parameters: AeroStreamAlertScreenParams | null): React.ReactNode => {
    if (!parameters) {
      setCurrentAlert(null);
      return null;
    }
    const node = AlertScreen(parameters);
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

      const attemptId = connectionAttemptReference.current + 1;
      connectionAttemptReference.current = attemptId;
      setStatus(ConnectionStatus.connecting);
      setCompletionState('none');
      onTransportReset();
      onSessionId(sessionId);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: true,
      });

      if (connectionAttemptReference.current !== attemptId) {
        stream.getTracks().forEach((track) => { track.stop(); });
        return;
      }

      void pilotReference.current?.disconnect();
      const pilot = new AeroStreamPilot<React.ReactNode>({
        url: getPilotLiveUrl(),
        secret,
        sessionId,
        logMode: PilotLogMode.developer,
        video: {
          stream,
          chunkIntervalMs: 500,
          targetFps: 12,
          maxWidth: 1280,
          maxHeight: 720,
          videoBitsPerSecond: 2_000_000,
          audioBitsPerSecond: 96_000,
          socketChunkBytes: 64 * 1024,
        },
        library: stepLibrary,
        errorScreen: ErrorScreen,
        alertScreen,
        infoScreen: InfoScreen,
        onTransport: onTransportEvent,
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
      pilotReference.current = pilot;

      await pilot.connect();

      if (connectionAttemptReference.current !== attemptId) {
        void pilot.disconnect();
        return;
      }

      if (pilotReference.current === pilot && pilot.isConnected) {
        setStatus(ConnectionStatus.active);
        onConnectionOpenChange(true);
        watchConnection(pilot);

        onTimeReset();
        timerReference.current = setInterval(() => { onTimeTick(); }, 1000);
      }
    } catch (error: unknown) {
      setStatus(ConnectionStatus.error);
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    connectionAttemptReference.current += 1;
    setCompletionState('none');
    onTransportReset();

    if (pilotReference.current) {
      const pilot = pilotReference.current;
      pilotReference.current = null;
      void pilot.disconnect();
    }

    resetConnectionState({ clearScreen: true });
  };

  useImperativeHandle(reference, () => ({
    connect: handleConnect,
    disconnect: handleDisconnect,
  }), [workflowId, status, sessionId, secret]);

  useEffect(() => {
    return () => {
      if (timerReference.current) {
        clearInterval(timerReference.current);
      }
      if (connectionWatchReference.current) {
        clearInterval(connectionWatchReference.current);
      }
    };
  }, []);

  return (
    <div style={pilotConnectionContainerStyle}>
      <div style={pilotConnectionStageStyle}>
        {completionState !== 'none' ? (
          <CompletionScreen ok={completionState === 'success'} />
        ) : (currentStep ?? <ReadySyncPlaceholder />)}

        {currentAlert}
      </div>
    </div>
  );
});
