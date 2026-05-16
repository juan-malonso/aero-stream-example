"use client";

import { ConnectionStatus } from "@/constants";
import { PerformanceStats } from "./developer";
import { PilotConnection, type PilotConnectionHandle } from "./implement";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkflowMetadata } from "@/contexts/shared/workflow/useWorkflow";
import { Row, Column, Select, Button, Input } from "@/components/ui";
import { towerRuntimeService } from "@/lib/live/tower/towerRuntime.service.ts";
import { colors, radii, shadows, typography } from "@/styles/tokens";
import { sectionHeaderStyle } from "@/styles/theme";

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

  const pilotRef = useRef<PilotConnectionHandle>(null);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
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

      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }

      copyFeedbackTimeoutRef.current = setTimeout(() => {
        setIsSessionCopied(false);
        copyFeedbackTimeoutRef.current = null;
      }, 1000);
    } catch (error) {
      console.error("Unable to copy session ID:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
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
          ref={pilotRef}
          workflowId={activeWorkflowId || ""}
          sessionId={isSessionIdValid ? sessionId : ""}
          secret={security.secret}
          onSessionId={handleSessionId}
          onStatusChange={setStatus}
          onConnectionOpenChange={setIsConnectionOpen}
          onTimeTick={() => {
            setConnectionTime((prev) => prev + 1);
          }}
          onTimeReset={() => {
            setConnectionTime(0);
          }}
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
        {/* Session Controls */}
        <Column
          gap="0"
          align="stretch"
          style={{ borderBottom: `1px solid ${colors.gray200}` }}
        >
          <Row
            justify="space-between"
            align="center"
            style={{
              padding: "1rem",
              background: colors.gray50,
              borderBottom: `1px solid ${colors.gray200}`,
            }}
          >
            <div style={sectionHeaderStyle}>Session Controls</div>
          </Row>
          <div style={{ padding: "0.75rem" }}>
            <Column gap="0.5rem" align="stretch">
              <Select
                value={activeWorkflowId || ""}
                onChange={handleSelectChange}
                disabled={isLoading || isSessionBusy}
                style={{
                  width: "100%",
                  borderRadius: radii.md,
                  fontSize: typography.sizes.base,
                  fontWeight: typography.weights.bold,
                  border:
                    "2px solid var(--surface-primary600, var(--color-blue600))",
                  background: "var(--surface-blue400, var(--color-blue400))",
                  color: colors.white,
                }}
              >
                <option value="" disabled>
                  {isLoading ? "Loading..." : "Select a workflow"}
                </option>
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </Select>

              <Row gap="0.5rem" align="center">
                <div style={{ position: "relative", flex: 1 }}>
                  <Input
                    value={sessionId}
                    onChange={(event) => {
                      setSessionId(event.target.value.trim());
                    }}
                    disabled={isSessionBusy}
                    aria-invalid={!isSessionIdValid}
                    aria-label="Session UUID"
                    style={{
                      paddingRight: "2rem",
                      border: isSessionIdValid
                        ? "2px solid var(--surface-primary600, var(--color-blue600))"
                        : "2px solid var(--surface-red500, var(--color-red500))",
                      color: isSessionIdValid
                        ? "var(--surface-primary600, var(--color-blue600))"
                        : colors.red700,
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: typography.sizes.md,
                      height: "38px",
                    }}
                  />
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      right: "0.65rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: isSessionIdValid
                        ? "var(--surface-primary600, var(--color-blue600))"
                        : colors.red600,
                      fontSize: typography.sizes.base,
                      fontWeight: typography.weights.bold,
                      lineHeight: 1,
                    }}
                  >
                    {isSessionIdValid ? "✓" : "✕"}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    void handleCopySessionId();
                  }}
                  variant="secondary"
                  size="lg"
                  aria-label="Copy session UUID"
                  style={{
                    width: "38px",
                    height: "38px",
                    padding: 0,
                    borderRadius: "8px",
                    border: isSessionCopied
                      ? "2px solid var(--surface-green600, var(--color-green600))"
                      : "2px solid var(--surface-gray300, var(--color-gray300))",
                    color: isSessionCopied ? colors.green600 : colors.gray600,
                  }}
                >
                  {isSessionCopied ? (
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    void handleCreateSession();
                  }}
                  disabled={isSessionBusy || !activeWorkflowId}
                  variant="secondary"
                  size="lg"
                  aria-label="Create new session in Tower"
                  style={{
                    width: "38px",
                    height: "38px",
                    padding: 0,
                    borderRadius: "8px",
                    border:
                      "2px solid var(--surface-gray300, var(--color-gray300))",
                  }}
                >
                  ↻
                </Button>
              </Row>
              <Button
                onClick={() => {
                  void pilotRef.current?.connect();
                }}
                disabled={
                  isSessionBusy || !activeWorkflowId || !isSessionIdValid
                }
                variant="primary"
                size="lg"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  boxShadow: shadows.sm,
                  border:
                    isSessionBusy || !activeWorkflowId || !isSessionIdValid
                      ? undefined
                      : "2px solid var(--surface-primary600, var(--color-blue600))",
                  background:
                    isSessionBusy || !activeWorkflowId || !isSessionIdValid
                      ? undefined
                      : "var(--surface-blue400, var(--color-blue400))",
                }}
              >
                {status === ConnectionStatus.connecting
                  ? "Connecting..."
                  : status === ConnectionStatus.active
                    ? "System Active"
                    : "Connect to Session"}
              </Button>
              <Button
                onClick={() => {
                  pilotRef.current?.disconnect();
                }}
                disabled={!canAbort}
                variant="danger"
                size="lg"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: canAbort
                    ? "2px solid var(--surface-red600, var(--color-red600))"
                    : undefined,
                  background: canAbort
                    ? "var(--surface-red400, var(--color-red400))"
                    : undefined,
                }}
              >
                Abort
              </Button>
            </Column>
          </div>
        </Column>

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
          <Column gap="0" align="stretch">
            <Row
              justify="space-between"
              align="center"
              style={{
                padding: "1rem",
                background: colors.gray50,
                borderBottom: `1px solid ${colors.gray200}`,
              }}
            >
              <div style={sectionHeaderStyle}>Health & Performance</div>
            </Row>
            <div style={{ padding: "0.75rem" }}>
              <PerformanceStats
                status={status}
                connectionTime={connectionTime}
              />
            </div>
          </Column>
        </div>
      </aside>
    </div>
  );
}
