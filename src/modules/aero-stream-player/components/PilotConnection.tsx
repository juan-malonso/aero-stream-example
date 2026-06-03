'use client';

import {
  type AeroStreamAlertScreenParameters,
  AeroStreamPilot,
} from 'aero-stream-pilot';
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Column } from '@/libs/ui';
import { CompletionScreen } from '@/modules/aero-stream-player/components/CompletionScreen';
import { createLiveStepLibrary } from '@/modules/aero-stream-player/lib/steps';
import { AlertScreen, ErrorScreen, InfoScreen } from '@/modules/aero-stream-player/lib/steps/live/screens';
import { getPilotLiveUrl } from '@/modules/aero-stream-runner/lib/tower/towerRuntime.service';
import { colors, typography } from '@/styles/tokens';

interface PilotConnectionProperties {
  sessionId: string;
  secret: string;
}

const pilotConnectionContainerStyle: CSSProperties = {
  backgroundColor: colors.gray300,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  width: '100%',
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
        <div style={{ fontSize: typography.sizes.sm, color: colors.gray500 }}>Loading workflow session</div>
      </div>
    </Column>
  );
}

function useCameraWarning(): string | null {
  const [cameraWarning, setCameraWarning] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const detectCamera = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        if (isMounted) setCameraWarning('Camera unavailable in this browser window');
        return;
      }

      try {
        if (navigator.permissions?.query) {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (!isMounted) return;
          if (permission.state === 'denied') {
            setCameraWarning('Camera permission is denied');
            return;
          }
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!isMounted) return;
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        setCameraWarning(hasCamera ? null : 'No camera detected');
      } catch {
        if (isMounted) setCameraWarning('Camera availability could not be checked');
      }
    };

    void detectCamera();

    return () => {
      isMounted = false;
    };
  }, []);

  return cameraWarning;
}

function CameraWarningBanner({ warning }: { warning: string | null }) {
  if (!warning) return null;

  return (
    <div style={cameraWarningStyle}>
      {warning}
    </div>
  );
}

function PilotStage({
  cameraWarning,
  completionState,
  currentAlert,
  currentStep,
}: {
  cameraWarning: string | null;
  completionState: 'error' | 'none' | 'success';
  currentAlert: React.ReactNode | null;
  currentStep: React.ReactNode | null;
}) {
  return (
    <div style={pilotConnectionStageStyle}>
      {completionState !== 'none' ? (
        <CompletionScreen ok={completionState === 'success'} />
      ) : (currentStep ?? <ReadySyncPlaceholder />)}

      {currentAlert}
      <CameraWarningBanner warning={cameraWarning} />
    </div>
  );
}

export function PilotConnection({ sessionId, secret }: PilotConnectionProperties) {
  const stepLibrary = useMemo(() => createLiveStepLibrary(), []);
  const connectionAttemptReference = useRef(0);

  const [currentStep, setCurrentStep] = useState<React.ReactNode | null>(null);
  const [currentAlert, setCurrentAlert] = useState<React.ReactNode | null>(null);
  const [completionState, setCompletionState] = useState<'error' | 'none' | 'success'>('none');
  const cameraWarning = useCameraWarning();

  const pilotReference = useRef<AeroStreamPilot | null>(null);

  const alertScreen = useCallback((parameters: AeroStreamAlertScreenParameters | null): React.ReactNode => {
    if (!parameters) {
      setCurrentAlert(null);
      return null;
    }
    const node = AlertScreen(parameters);
    setCurrentAlert(node);
    return node;
  }, []);

  useEffect(() => {
    if (!sessionId || !secret.trim()) return;

    let isMounted = true;

    async function connect() {
      try {
        const attemptId = connectionAttemptReference.current + 1;
        connectionAttemptReference.current = attemptId;
        setCompletionState('none');
        setCurrentAlert(null);
        setCurrentStep(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: true,
        });

        if (!isMounted || connectionAttemptReference.current !== attemptId) {
          stream.getTracks().forEach((track) => { track.stop(); });
          return;
        }

        void pilotReference.current?.disconnect();
        const pilot = new AeroStreamPilot<React.ReactNode>({
          url: getPilotLiveUrl(),
          secret,
          sessionId,
          video: { stream },
          library: stepLibrary,
          errorScreen: ErrorScreen,
          alertScreen,
          infoScreen: InfoScreen,
          renderer: setCurrentStep,
          onComplete: ({ ok }) => {
            setCompletionState(ok ? 'success' : 'error');
            void pilot.disconnect();
          },
          onClose: () => {
            if (pilotReference.current === pilot) {
              pilotReference.current = null;
            }
          },
        });
        pilotReference.current = pilot;

        await pilot.connect();

        if (!isMounted || connectionAttemptReference.current !== attemptId) {
          void pilot.disconnect();
        }
      } catch (error: unknown) {
        if (isMounted) {
          setCompletionState('error');
          console.error('Connection error:', error);
        }
      }
    }

    void connect();

    return () => {
      isMounted = false;
      connectionAttemptReference.current += 1;
      const pilot = pilotReference.current;
      pilotReference.current = null;
      void pilot?.disconnect();
    };
  }, [alertScreen, secret, sessionId, stepLibrary]);

  return (
    <div style={pilotConnectionContainerStyle}>
      <PilotStage
        cameraWarning={cameraWarning}
        completionState={completionState}
        currentAlert={currentAlert}
        currentStep={currentStep}
      />
    </div>
  );
}

const cameraWarningStyle: CSSProperties = {
  background: 'rgba(245, 158, 11, 0.94)',
  border: `1px solid ${colors.yellow600}`,
  borderRadius: '0.75rem',
  boxShadow: '0 12px 30px rgba(146, 64, 14, 0.2)',
  color: colors.gray900,
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.semibold,
  left: '1rem',
  maxWidth: 'calc(100% - 2rem)',
  padding: '0.625rem 0.75rem',
  position: 'absolute',
  top: '1rem',
  zIndex: 4,
};
