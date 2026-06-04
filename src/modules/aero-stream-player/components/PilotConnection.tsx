"use client";

import {
  type AeroStreamAlertScreenParameters,
  AeroStreamPilot,
} from "aero-stream-pilot";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Column } from "@/libs/ui";
import { CompletionScreen } from "@/modules/aero-stream-player/components/CompletionScreen";
import { InitializeScreen } from "@/modules/aero-stream-player/components/InitializeScreen";
import { createLiveStepLibrary } from "@/modules/aero-stream-player/lib/steps";
import {
  AlertScreen,
  ErrorScreen,
  InfoScreen,
} from "@/modules/aero-stream-player/lib/steps/live/screens";
import { getPilotLiveUrl } from "@/modules/aero-stream-runner/lib/tower/towerRuntime.service";
import { colors, typography } from "@/styles/tokens";

interface PilotConnectionProperties {
  sessionId: string;
  secret: string;
}

const pilotConnectionContainerStyle: CSSProperties = {
  backgroundColor: colors.gray300,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  width: "100%",
};

const pilotConnectionStageStyle: CSSProperties = {
  flex: 1,
  position: "relative",
  overflow: "hidden",
  color: colors.gray600,
};

function ReadySyncPlaceholder(): React.ReactNode {
  return (
    <Column
      align="center"
      justify="center"
      style={{ height: "100%" }}
      gap="1rem"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.5 }}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.bold,
          }}
        >
          Ready for Sync
        </div>
        <div style={{ fontSize: typography.sizes.sm, color: colors.gray500 }}>
          Loading workflow session
        </div>
      </div>
    </Column>
  );
}

function PilotStage({
  completionState,
  currentAlert,
  currentStep,
  hasAcceptedTerms,
  onAcceptTerms,
}: {
  completionState: "error" | "none" | "success";
  currentAlert: React.ReactNode | null;
  currentStep: React.ReactNode | null;
  hasAcceptedTerms: boolean;
  onAcceptTerms: () => void;
}) {
  return (
    <div style={pilotConnectionStageStyle}>
      {completionState !== "none" ? (
        <CompletionScreen ok={completionState === "success"} />
      ) : !hasAcceptedTerms ? (
        <InitializeScreen onAccept={onAcceptTerms} />
      ) : (
        (currentStep ?? <ReadySyncPlaceholder />)
      )}

      {currentAlert}
    </div>
  );
}

async function requestCameraStream(): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null;

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: true,
    });
  } catch {
    return null;
  }
}

export function PilotConnection({
  sessionId,
  secret,
}: PilotConnectionProperties) {
  const stepLibrary = useMemo(() => createLiveStepLibrary(), []);
  const connectionAttemptReference = useRef(0);

  const [currentStep, setCurrentStep] = useState<React.ReactNode | null>(null);
  const [currentAlert, setCurrentAlert] = useState<React.ReactNode | null>(
    null,
  );
  const [completionState, setCompletionState] = useState<
    "error" | "none" | "success"
  >("none");
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const pilotReference = useRef<AeroStreamPilot | null>(null);

  const alertScreen = useCallback(
    (parameters: AeroStreamAlertScreenParameters | null): React.ReactNode => {
      if (!parameters) {
        setCurrentAlert(null);
        return null;
      }
      const node = AlertScreen(parameters);
      setCurrentAlert(node);
      return node;
    },
    [],
  );

  useEffect(() => {
    if (!hasAcceptedTerms || !sessionId || !secret.trim()) return;

    let isMounted = true;

    async function connect() {
      try {
        const attemptId = connectionAttemptReference.current + 1;
        connectionAttemptReference.current = attemptId;
        setCompletionState("none");
        setCurrentAlert(null);
        setCurrentStep(null);

        const stream = await requestCameraStream();

        if (!isMounted || connectionAttemptReference.current !== attemptId) {
          stream?.getTracks().forEach((track) => {
            track.stop();
          });
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
            setCompletionState(ok ? "success" : "error");
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
          setCompletionState("error");
          console.error("Connection error:", error);
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
  }, [alertScreen, hasAcceptedTerms, secret, sessionId, stepLibrary]);

  return (
    <div style={pilotConnectionContainerStyle}>
      <PilotStage
        completionState={completionState}
        currentAlert={currentAlert}
        currentStep={currentStep}
        hasAcceptedTerms={hasAcceptedTerms}
        onAcceptTerms={() => {
          setHasAcceptedTerms(true);
        }}
      />
    </div>
  );
}
