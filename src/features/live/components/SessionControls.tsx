"use client";

import type { CSSProperties } from "react";

import { Button, Column, Input, Row, Select } from "@/components/ui";
import { ConnectionStatus } from "@/constants";
import { colors, radii, shadows, typography } from "@/styles/tokens";

interface WorkflowOption {
  id: string;
  name: string;
}

interface SessionControlsProperties {
  activeWorkflowId?: string | null;
  canAbort: boolean;
  hasSessionId: boolean;
  isCreatingSession: boolean;
  isLoading: boolean;
  isSessionBusy: boolean;
  isSessionCopied: boolean;
  isSessionIdValid: boolean;
  sessionId: string;
  status: ConnectionStatus;
  workflows: WorkflowOption[];
  onAbort: () => void;
  onConnect: () => void;
  onCopySessionId: () => void;
  onCreateSession: () => void;
  onSelectWorkflow: (id: string) => void;
  onSessionIdChange: (id: string) => void;
}

export function SessionControls(properties: SessionControlsProperties) {
  return (
    <Column gap="0" align="stretch" style={sectionStyle}>
      <SessionControlsHeader />
      <div style={{ padding: "0.75rem" }}>
        <Column gap="0.5rem" align="stretch">
          <WorkflowSelect {...properties} />
          <SessionIdRow {...properties} />
          <ConnectionActions {...properties} />
        </Column>
      </div>
    </Column>
  );
}

function SessionControlsHeader() {
  return (
    <Row justify="space-between" align="center" style={headerStyle}>
      <div style={titleStyle}>Session Controls</div>
    </Row>
  );
}

function WorkflowSelect({
  activeWorkflowId,
  isLoading,
  isSessionBusy,
  workflows,
  onSelectWorkflow,
}: SessionControlsProperties) {
  return (
    <Select
      value={activeWorkflowId ?? ""}
      onChange={(event) => {
        if (event.target.value) onSelectWorkflow(event.target.value);
      }}
      disabled={isLoading || isSessionBusy}
      style={workflowSelectStyle}
    >
      <option value="" disabled>
        {isLoading ? "Loading..." : "Select a workflow"}
      </option>
      {workflows.map((workflow) => (
        <option key={workflow.id} value={workflow.id}>
          {workflow.name}
        </option>
      ))}
    </Select>
  );
}

function SessionIdRow(properties: SessionControlsProperties) {
  return (
    <Row gap="0.5rem" align="center">
      <SessionIdInput {...properties} />
      <CreateSessionButton {...properties} />
    </Row>
  );
}

function SessionIdInput({
  hasSessionId,
  isSessionBusy,
  isSessionCopied,
  isSessionIdValid,
  sessionId,
  onCopySessionId,
  onSessionIdChange,
}: SessionControlsProperties) {
  return (
    <div style={{ position: "relative", flex: 1 }}>
      <Input
        value={sessionId}
        onChange={(event) => {
          onSessionIdChange(event.target.value.trim());
        }}
        placeholder="Click + to generate session"
        disabled={isSessionBusy}
        aria-invalid={hasSessionId && !isSessionIdValid}
        aria-label="Session UUID"
        style={sessionInputStyle(hasSessionId, isSessionIdValid)}
      />
      <SessionValidityIndicator
        hasSessionId={hasSessionId}
        isSessionIdValid={isSessionIdValid}
      />
      <CopySessionButton
        hasSessionId={hasSessionId}
        isSessionCopied={isSessionCopied}
        onCopySessionId={onCopySessionId}
      />
    </div>
  );
}

function SessionValidityIndicator({
  hasSessionId,
  isSessionIdValid,
}: Pick<SessionControlsProperties, "hasSessionId" | "isSessionIdValid">) {
  if (!hasSessionId) return null;

  return (
    <span aria-hidden="true" style={validityIndicatorStyle(isSessionIdValid)}>
      {isSessionIdValid ? "✓" : "✕"}
    </span>
  );
}

function CopySessionButton({
  hasSessionId,
  isSessionCopied,
  onCopySessionId,
}: Pick<
  SessionControlsProperties,
  "hasSessionId" | "isSessionCopied" | "onCopySessionId"
>) {
  return (
    <Button
      onClick={onCopySessionId}
      disabled={!hasSessionId}
      iconOnly
      leadingIcon={isSessionCopied ? checkIcon : copyIcon}
      size="sm"
      variant={isSessionCopied ? "primary" : "ghost"}
      aria-label="Copy session UUID"
      style={copyButtonStyle(isSessionCopied)}
    >
      Copy session UUID
    </Button>
  );
}

function CreateSessionButton({
  activeWorkflowId,
  isSessionBusy,
  onCreateSession,
}: SessionControlsProperties) {
  const disabled = isSessionBusy || !activeWorkflowId;

  return (
    <Button
      onClick={onCreateSession}
      disabled={disabled}
      iconOnly
      leadingIcon={plusIcon}
      variant="primary"
      size="lg"
      aria-label="Generate new session in Tower"
      style={createButtonStyle(disabled)}
      title="Generate new session"
    >
      Generate new session
    </Button>
  );
}

function ConnectionActions(properties: SessionControlsProperties) {
  return (
    <Row gap="0.5rem" align="center">
      <ConnectButton {...properties} />
      <AbortButton {...properties} />
    </Row>
  );
}

function ConnectButton({
  activeWorkflowId,
  isSessionBusy,
  isSessionIdValid,
  status,
  onConnect,
}: SessionControlsProperties) {
  const disabled = isSessionBusy || !activeWorkflowId || !isSessionIdValid;

  return (
    <Button
      onClick={onConnect}
      disabled={disabled}
      variant="primary"
      size="md"
      style={connectButtonStyle(disabled)}
    >
      {connectButtonText(status)}
    </Button>
  );
}

function AbortButton({ canAbort, onAbort }: SessionControlsProperties) {
  return (
    <Button
      onClick={onAbort}
      disabled={!canAbort}
      variant="danger"
      size="md"
      style={abortButtonStyle(canAbort)}
    >
      Abort
    </Button>
  );
}

function connectButtonText(status: ConnectionStatus): string {
  if (status === ConnectionStatus.connecting) return "Connecting...";
  if (status === ConnectionStatus.active) return "System Active";
  return "Connect";
}

const sectionStyle: CSSProperties = { borderBottom: `1px solid ${colors.gray200}` };

const headerStyle: CSSProperties = {
  padding: "0.875rem 1rem",
  background: colors.gray50,
  borderBottom: `1px solid ${colors.gray200}`,
};

const titleStyle: CSSProperties = {
  color: "var(--surface-primary500, var(--color-gray500))",
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.bold,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const workflowSelectStyle: CSSProperties = {
  width: "100%",
  borderRadius: radii.md,
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.bold,
  border: "2px solid var(--surface-primary600, var(--color-blue600))",
  background: "var(--surface-blue400, var(--color-blue400))",
  color: colors.white,
};

function sessionInputStyle(hasSessionId: boolean, isSessionIdValid: boolean): CSSProperties {
  return {
    paddingRight: hasSessionId ? "4.65rem" : "2.75rem",
    border: sessionInputBorder(hasSessionId, isSessionIdValid),
    color: sessionInputColor(hasSessionId, isSessionIdValid),
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: typography.sizes.md,
    height: "38px",
  };
}

function sessionInputBorder(hasSessionId: boolean, isSessionIdValid: boolean): string {
  if (!hasSessionId) return `2px solid ${colors.gray300}`;
  if (isSessionIdValid) return "2px solid var(--surface-primary600, var(--color-blue600))";
  return "2px solid var(--surface-red500, var(--color-red500))";
}

function sessionInputColor(hasSessionId: boolean, isSessionIdValid: boolean): string {
  if (!hasSessionId) return colors.gray500;
  if (isSessionIdValid) return "var(--surface-primary600, var(--color-blue600))";
  return colors.red700;
}

function validityIndicatorStyle(isSessionIdValid: boolean): CSSProperties {
  return {
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
  };
}

function copyButtonStyle(isSessionCopied: boolean): CSSProperties {
  return {
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
  };
}

function createButtonStyle(disabled: boolean): CSSProperties {
  return {
    backgroundColor: disabled ? undefined : "var(--surface-blue400, var(--color-blue400))",
    border: disabled ? undefined : "2px solid var(--surface-primary600, var(--color-blue600))",
    borderRadius: "8px",
    color: colors.white,
    height: "38px",
    minHeight: "38px",
    padding: 0,
    width: "38px",
  };
}

function connectButtonStyle(disabled: boolean): CSSProperties {
  return {
    backgroundColor: disabled ? undefined : "var(--surface-blue400, var(--color-blue400))",
    border: disabled ? undefined : "2px solid var(--surface-primary600, var(--color-blue600))",
    borderRadius: "8px",
    boxShadow: shadows.sm,
    textTransform: "uppercase",
    flex: 1,
    height: "38px",
  };
}

function abortButtonStyle(canAbort: boolean): CSSProperties {
  return {
    backgroundColor: canAbort ? "var(--surface-red400, var(--color-red400))" : undefined,
    border: canAbort ? "2px solid var(--surface-red600, var(--color-red600))" : undefined,
    borderRadius: "8px",
    textTransform: "uppercase",
    flex: 1,
    height: "38px",
  };
}

const checkIcon = (
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
);

const copyIcon = (
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
);

const plusIcon = (
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
);
