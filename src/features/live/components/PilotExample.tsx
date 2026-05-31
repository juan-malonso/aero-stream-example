"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ConnectionStatus } from "@/constants";
import { useWorkflowMetadata } from "@/contexts/shared/workflow/useWorkflow";
import { towerRuntimeService } from "@/lib/live/tower/towerRuntime.service.ts";
import { colors, shadows } from "@/styles/tokens";

import { PerformanceStats, useTransportPerformance } from "./developer";
import { PilotConnection, type PilotConnectionHandle } from "./implement";
import { SessionControls } from "./SessionControls";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function PilotExample() {
  const { workflows, activeWorkflowId, security, selectWorkflow, isLoading } =
    useWorkflowMetadata();
  const [status, setStatus] = useState(ConnectionStatus.closed);
  const [sessionId, setSessionId] = useState("");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [connectionTime, setConnectionTime] = useState(0);
  const [isSessionCopied, setIsSessionCopied] = useState(false);
  const { recordTransportEvent, resetTransportPerformance, transportStats } =
    useTransportPerformance();

  const pilotReference = useRef<PilotConnectionHandle>(null);
  const copyFeedbackTimeoutReference = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isConnecting = status === ConnectionStatus.connecting;
  const isSessionBusy = isConnecting || isConnectionOpen || isCreatingSession;
  const canAbort = isConnecting || isConnectionOpen;
  const hasSessionId = sessionId.length > 0;
  const isSessionIdValid = uuidPattern.test(sessionId);

  const handleSessionId = useCallback((id: string | null) => {
    if (id) {
      setSessionId(id);
    }
  }, []);

  const handleCreateSession = async () => {
    if (!activeWorkflowId || isSessionBusy) {
      return;
    }

    try {
      setIsCreatingSession(true);
      const data = await towerRuntimeService.createSession(activeWorkflowId);
      if (!data.sessionId || !uuidPattern.test(data.sessionId)) {
        throw new Error(
          "Session ID missing or invalid in create-session response",
        );
      }

      setSessionId(data.sessionId);
      setStatus(ConnectionStatus.closed);
    } catch (error) {
      setStatus(ConnectionStatus.error);
      console.error("Session creation error:", error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleCopySessionId = async () => {
    if (!sessionId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(sessionId);
      setIsSessionCopied(true);

      if (copyFeedbackTimeoutReference.current) {
        clearTimeout(copyFeedbackTimeoutReference.current);
      }

      copyFeedbackTimeoutReference.current = setTimeout(() => {
        setIsSessionCopied(false);
        copyFeedbackTimeoutReference.current = null;
      }, 2000);
    } catch (error) {
      console.error("Unable to copy session ID:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutReference.current) {
        clearTimeout(copyFeedbackTimeoutReference.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background: "var(--surface-canvas, var(--color-gray200))",
      }}
    >
      {/* Main Simulation Area */}
      <main
        style={{
          flex: 1,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <PilotConnection
          ref={pilotReference}
          workflowId={activeWorkflowId ?? ""}
          sessionId={isSessionIdValid ? sessionId : ""}
          secret={security.secret}
          onSessionId={handleSessionId}
          onStatusChange={setStatus}
          onConnectionOpenChange={setIsConnectionOpen}
          onTimeTick={() => {
            setConnectionTime((previous) => previous + 1);
          }}
          onTimeReset={() => {
            setConnectionTime(0);
          }}
          onTransportEvent={recordTransportEvent}
          onTransportReset={resetTransportPerformance}
        />
      </main>

      {/* Developer Sidebar */}
      <aside
        style={{
          width: "350px",
          height: "100%",
          backgroundColor: colors.white,
          borderLeft: `1px solid ${colors.gray200}`,
          display: "flex",
          flexDirection: "column",
          boxShadow: shadows.md,
        }}
      >
        <SessionControls
          activeWorkflowId={activeWorkflowId}
          canAbort={canAbort}
          hasSessionId={hasSessionId}
          isCreatingSession={isCreatingSession}
          isLoading={isLoading}
          isSessionBusy={isSessionBusy}
          isSessionCopied={isSessionCopied}
          isSessionIdValid={isSessionIdValid}
          sessionId={sessionId}
          status={status}
          workflows={workflows}
          onAbort={() => {
            pilotReference.current?.disconnect();
          }}
          onConnect={() => {
            void pilotReference.current?.connect();
          }}
          onCopySessionId={() => {
            void handleCopySessionId();
          }}
          onCreateSession={() => {
            void handleCreateSession();
          }}
          onSelectWorkflow={(id) => {
            void selectWorkflow(id);
          }}
          onSessionIdChange={setSessionId}
        />

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Performance Stats */}
          <PerformanceStats
            connectionTime={connectionTime}
            status={status}
            transportStats={transportStats}
          />
        </div>
      </aside>
    </div>
  );
}
