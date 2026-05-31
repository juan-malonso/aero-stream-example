"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Column, Input, Row, Select } from "@/components/ui";
import { ConnectionStatus } from "@/constants";
import { useWorkflowMetadata } from "@/contexts/shared/workflow/useWorkflow";
import { towerRuntimeService } from "@/lib/live/tower/towerRuntime.service.ts";
import { colors, radii, shadows, typography } from "@/styles/tokens";

import { PerformanceStats } from "./developer";
import { PilotConnection, type PilotConnectionHandle } from "./implement";

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
              padding: "0.875rem 1rem",
              background: colors.gray50,
              borderBottom: `1px solid ${colors.gray200}`,
            }}
          >
            <div
              style={{
                color: "var(--surface-primary500, var(--color-gray500))",
                fontSize: typography.sizes.base,
                fontWeight: typography.weights.bold,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Session Controls
            </div>
          </Row>
          <div style={{ padding: "0.75rem" }}>
            <Column gap="0.5rem" align="stretch">
              <Select
                value={activeWorkflowId ?? ""}
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
                    placeholder="Click + to generate session"
                    disabled={isSessionBusy}
                    aria-invalid={hasSessionId && !isSessionIdValid}
                    aria-label="Session UUID"
                    style={{
                      paddingRight: hasSessionId ? "4.65rem" : "2.75rem",
                      border: hasSessionId
                        ? isSessionIdValid
                          ? "2px solid var(--surface-primary600, var(--color-blue600))"
                          : "2px solid var(--surface-red500, var(--color-red500))"
                        : `2px solid ${colors.gray300}`,
                      color: hasSessionId
                        ? isSessionIdValid
                          ? "var(--surface-primary600, var(--color-blue600))"
                          : colors.red700
                        : colors.gray500,
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: typography.sizes.md,
                      height: "38px",
                    }}
                  />
                  {hasSessionId ? (
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        right: "2.55rem",
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
                  ) : null}
                  <Button
                    onClick={() => {
                      void handleCopySessionId();
                    }}
                    disabled={!hasSessionId}
                    iconOnly
                    leadingIcon={
                      isSessionCopied ? (
                        <svg
                          aria-hidden="true"
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          aria-hidden="true"
                          width="15"
                          height="15"
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
                      )
                    }
                    size="sm"
                    variant={isSessionCopied ? "primary" : "ghost"}
                    aria-label="Copy session UUID"
                    style={{
                      backgroundColor: isSessionCopied
                        ? "var(--surface-green600, var(--color-green600))"
                        : "transparent",
                      border: isSessionCopied
                        ? "1px solid var(--surface-green600, var(--color-green600))"
                        : "1px solid transparent",
                      borderRadius: "6px",
                      color: isSessionCopied ? colors.white : colors.gray500,
                      height: "30px",
                      minHeight: "30px",
                      padding: 0,
                      position: "absolute",
                      right: "4px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "30px",
                    }}
                  >
                    Copy session UUID
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    void handleCreateSession();
                  }}
                  disabled={isSessionBusy || !activeWorkflowId}
                  iconOnly
                  leadingIcon={
                    <svg
                      aria-hidden="true"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  }
                  variant="primary"
                  size="lg"
                  aria-label="Generate new session in Tower"
                  style={{
                    backgroundColor:
                      isSessionBusy || !activeWorkflowId
                        ? undefined
                        : "var(--surface-blue400, var(--color-blue400))",
                    border: isSessionBusy || !activeWorkflowId
                      ? undefined
                      : "2px solid var(--surface-primary600, var(--color-blue600))",
                    borderRadius: "8px",
                    color: colors.white,
                    height: "38px",
                    minHeight: "38px",
                    padding: 0,
                    width: "38px",
                  }}
                  title="Generate new session"
                >
                  Generate new session
                </Button>
              </Row>
              <Row gap="0.5rem" align="center">
                <Button
                  onClick={() => {
                    void pilotReference.current?.connect();
                  }}
                  disabled={
                    isSessionBusy || !activeWorkflowId || !isSessionIdValid
                  }
                  variant="primary"
                  size="md"
                  style={{
                    backgroundColor:
                      isSessionBusy || !activeWorkflowId || !isSessionIdValid
                        ? undefined
                        : "var(--surface-blue400, var(--color-blue400))",
                    border:
                      isSessionBusy || !activeWorkflowId || !isSessionIdValid
                        ? undefined
                        : "2px solid var(--surface-primary600, var(--color-blue600))",
                    borderRadius: "8px",
                    boxShadow: shadows.sm,
                    textTransform: 'uppercase',
                    flex: 1,
                    height: "38px",
                  }}
                >
                  {status === ConnectionStatus.connecting
                    ? "Connecting..."
                    : status === ConnectionStatus.active
                      ? "System Active"
                      : "Connect"}
                </Button>
                <Button
                  onClick={() => {
                    pilotReference.current?.disconnect();
                  }}
                  disabled={!canAbort}
                  variant="danger"
                  size="md"
                  style={{
                    backgroundColor: canAbort
                      ? "var(--surface-red400, var(--color-red400))"
                      : undefined,
                    border: canAbort
                      ? "2px solid var(--surface-red600, var(--color-red600))"
                      : undefined,
                    borderRadius: "8px",
                    textTransform: 'uppercase',
                    flex: 1,
                    height: "38px",
                  }}
                >
                  Abort
                </Button>
              </Row>
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
          <PerformanceStats
            connectionTime={connectionTime}
            hasSessionId={hasSessionId}
            isConnectionOpen={isConnectionOpen}
            isSessionIdValid={isSessionIdValid}
            status={status}
          />
        </div>
      </aside>
    </div>
  );
}
