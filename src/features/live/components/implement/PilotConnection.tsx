'use client';

import { ConnectionStatus } from '@/constants';

import { DoneComponent, ErrorScreen, KYCComponent, VideoComponent, WelcomeComponent } from '@/components/steps';

import {
  type AeroStreamComponentParams,
  type AeroStreamLibrary,
  AeroStreamPilot,
} from 'aero-stream-pilot';
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Column } from '@/components/ui';
import { colors, typography } from '@/styles/tokens';

const token = 'my-super-secret-token';
const socketUrl = 'ws://localhost:8787/app/sync';
const apiUrl = 'http://localhost:8787';

interface PilotConnectionProps {
  workflowId: string;
  onSessionId: (id: string | null) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onTimeTick: () => void;
  onTimeReset: () => void;
}

export interface PilotConnectionHandle {
  createSession: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  sessionId: string | null;
}

export const PilotConnection = forwardRef<PilotConnectionHandle, PilotConnectionProps>(
  function PilotConnection({ workflowId, onSessionId, onStatusChange, onTimeTick, onTimeReset }, ref) {
  const stepLibrary: AeroStreamLibrary<React.ReactNode> = {
    WelcomeComponent: (props: AeroStreamComponentParams) => <WelcomeComponent {...props} />,
    VideoComponent: (props: AeroStreamComponentParams) => <VideoComponent {...props} />,
    KYCComponent: (props: AeroStreamComponentParams) => <KYCComponent {...props} />,
    DoneComponent: (props: AeroStreamComponentParams) => <DoneComponent {...props} />,
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState(ConnectionStatus.closed);
  const [currentComponent, setCurrentComponent] = useState<React.ReactNode | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  const pilotRef = useRef<AeroStreamPilot | null>(null);

  const resetConnectionState = ({ clearScreen = true }: { clearScreen?: boolean } = {}) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    pilotRef.current = null;
    if (clearScreen) {
      setCurrentComponent(null);
    }
    setStatus(ConnectionStatus.closed);
    setSessionId(null);
    onSessionId(null);
  };

  const handleCreateSession = async () => {
    if (!workflowId || status === ConnectionStatus.active) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/app/${workflowId}`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Unable to create session: ${response.status}`);
      }

      const data = await response.json() as { sessionId?: string };
      if (!data.sessionId) {
        throw new Error('Session ID missing in create-session response');
      }

      setSessionId(data.sessionId);
      onSessionId(data.sessionId);
    } catch (error) {
      setStatus(ConnectionStatus.error);
      console.error('Session creation error:', error);
    }
  };

  const handleConnect = async () => {
    try {
      if (!sessionId) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: true,
      });

      pilotRef.current?.disconnect()
      const pilot = new AeroStreamPilot<React.ReactNode>({
        url: socketUrl,
        secret: token,
        sessionId,
        videoStream: stream,
        library: stepLibrary,
        errorScreen: ErrorScreen,
        renderer: setCurrentComponent,
        onMessage: () => { /* noop */ },
        onClose: () => {
          resetConnectionState({ clearScreen: false });
        },
      });
      pilotRef.current = pilot;

      await pilot.connect();

      if (pilotRef.current === pilot && pilot.isConnected) {
        setStatus(ConnectionStatus.active);

        onTimeReset();
        timerRef.current = setInterval(() => { onTimeTick(); }, 1000);
      }
    } catch (error: unknown) {
      setStatus(ConnectionStatus.error);
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    if (pilotRef.current) {
      const pilot = pilotRef.current;
      pilotRef.current = null;
      pilot.disconnect();
    }

    resetConnectionState({ clearScreen: true });
  };

  useImperativeHandle(ref, () => ({
    createSession: handleCreateSession,
    connect: handleConnect,
    disconnect: handleDisconnect,
    sessionId,
  }), [workflowId, status, sessionId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
        {currentComponent ?? (
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
        )}
      </div>
    </div>
  );
});
