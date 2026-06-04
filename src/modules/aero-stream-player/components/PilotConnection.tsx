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

import { CompletionScreen } from "@/modules/aero-stream-player/components/CompletionScreen";
import { InitializeScreen } from "@/modules/aero-stream-player/components/InitializeScreen";
import { createLiveStepLibrary } from "@/modules/aero-stream-player/lib/steps";
import {
  AlertScreen,
  ErrorScreen,
  InfoScreen,
} from "@/modules/aero-stream-player/lib/steps/live/screens";
import { getPilotLiveUrl } from "@/modules/aero-stream-runner/lib/tower/towerRuntime.service";
import { colors } from "@/styles/tokens";

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

function StepHoldingPlaceholder(): React.ReactNode {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        height: "100%",
        justifyContent: "center",
      }}
    >
      <svg
        width="320"
        height="120"
        viewBox="0 0 320 120"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <path
            id="holding-path"
            d="M 80 30 H 240 A 30 30 0 0 1 240 90 H 80 A 30 30 0 0 1 80 30"
          />
        </defs>

        <use
          href="#holding-path"
          fill="none"
          stroke="#A7B4C7"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="12 12"
        />

        <g>
          <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
            <mpath href="#holding-path" />
          </animateMotion>

          <g
            transform="translate(-25.6 -25.6) scale(1.6) rotate(45 16 16)"
            fill="#1F2937"
            stroke="none"
          >
            <path d="M30.8 1.2 C31.9 2.3 31.4 5.1 29.2 7.3 L22.6 13.9 L23.5 27.1 C23.6 27.8 23.3 28.5 22.8 29.1 L20.9 31 C20.4 31.5 19.6 31.3 19.3 30.7 L15.8 21.2 L11.3 25.6 L11.2 29.7 C11.2 30.3 11 30.8 10.6 31.2 L9.9 31.9 C9.5 32.3 8.8 32.2 8.5 31.7 L5.5 26.8 L0.7 23.8 C0.2 23.5 0.1 22.8 0.5 22.4 L1.2 21.7 C1.6 21.3 2.1 21.1 2.7 21.1 L6.8 21 L11.2 16.5 L1.7 13 C1.1 12.8 0.9 12 1.4 11.5 L3.3 9.6 C3.9 9.1 4.6 8.8 5.3 8.9 L18.5 9.8 L25.1 3.2 C27.3 1 30.1 0.5 30.8 1.2 Z" />
          </g>
        </g>
      </svg>
    </div>
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
  currentAlert?: React.ReactNode;
  currentStep?: React.ReactNode;
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
        (currentStep ?? <StepHoldingPlaceholder />)
      )}

      {currentAlert}
    </div>
  );
}

async function requestCameraStream(): Promise<MediaStream | undefined> {
  if (!navigator.mediaDevices?.getUserMedia) return undefined;

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
    return undefined;
  }
}

export function PilotConnection({
  sessionId,
  secret,
}: PilotConnectionProperties) {
  const stepLibrary = useMemo(() => createLiveStepLibrary(), []);
  const connectionAttemptReference = useRef(0);

  const [currentStep, setCurrentStep] = useState<React.ReactNode>();
  const [currentAlert, setCurrentAlert] = useState<React.ReactNode>();
  const [completionState, setCompletionState] = useState<
    "error" | "none" | "success"
  >("none");
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const pilotReference = useRef<AeroStreamPilot | undefined>(undefined);

  const alertScreen = useCallback(
    (parameters?: AeroStreamAlertScreenParameters): React.ReactNode => {
      if (!parameters) {
        setCurrentAlert(undefined);
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
        setCurrentAlert(undefined);
        setCurrentStep(undefined);

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
          metadata: { termsVersion: "1.0.0" },
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
              pilotReference.current = undefined;
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
      pilotReference.current = undefined;
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
