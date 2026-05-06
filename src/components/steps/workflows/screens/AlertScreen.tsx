"use client";

import React from "react";
import { type AeroStreamAlertScreen } from "aero-stream-pilot";
import { Button } from "@/components/ui";
import { colors, radii, typography } from "@/styles/tokens";

export const AlertScreen: AeroStreamAlertScreen<React.ReactNode> = ({
  alertType,
  data,
  submit,
  reject,
}) => {
  if (alertType === "SESSION_SWITCH") {
    return <SessionSwitchAlert data={data} submit={submit} reject={reject} />;
  }

  return (
    <GenericAlert
      alertType={alertType}
      data={data}
      submit={submit}
      reject={reject}
    />
  );
};

interface AlertProps {
  alertType?: string;
  data: Record<string, unknown>;
  submit: (data?: Record<string, unknown>) => void;
  reject: () => void;
}

function SessionSwitchAlert({ data, submit, reject }: AlertProps) {
  const deviceType = String(data.deviceType ?? "—");
  const brand = data.brand ? String(data.brand) : null;
  const model = data.model ? String(data.model) : null;
  const osName = data.osName ? String(data.osName) : null;
  const browserName = data.browserName ? String(data.browserName) : null;
  const connectionId = String(data.connectionId ?? "");

  const deviceLabel = [brand, model].filter(Boolean).join(" ") || deviceType;
  const platformLabel = [osName, browserName].filter(Boolean).join(" / ");

  return (
    <Overlay>
      <div
        style={{
          background: colors.white,
          borderRadius: radii.xl,
          padding: "2rem",
          width: "100%",
          maxWidth: "22rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: typography.sizes.lg,
              fontWeight: typography.weights.bold,
              color: colors.gray900,
            }}
          >
            Solicitud de cambio de dispositivo
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: typography.sizes.sm,
              color: colors.gray500,
            }}
          >
            Un nuevo dispositivo quiere tomar el control de esta sesión.
          </p>
        </div>

        <div
          style={{
            background: colors.gray50,
            borderRadius: radii.lg,
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <DeviceRow label="Dispositivo" value={deviceLabel} />
          {platformLabel && (
            <DeviceRow label="Plataforma" value={platformLabel} />
          )}
          <DeviceRow label="ID" value={connectionId.slice(0, 8) + "…"} mono />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button onClick={() => submit({ connectionId })} style={{ flex: 1 }}>
            Autorizar
          </Button>
          <Button onClick={() => reject()} variant="ghost" style={{ flex: 1 }}>
            Rechazar
          </Button>
        </div>
      </div>
    </Overlay>
  );
}

function GenericAlert({ alertType, data, submit, reject }: AlertProps) {
  return (
    <Overlay>
      <div
        style={{
          background: "rgba(255, 255, 255, 0.18)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          borderRadius: radii.xl,
          padding: "1.5rem",
          width: "100%",
          maxWidth: "22rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: typography.sizes.lg,
            fontWeight: typography.weights.bold,
            color: colors.white,
          }}
        >
          {alertType}
        </h2>
        <pre
          style={{
            margin: 0,
            fontSize: typography.sizes.xs,
            color: "rgba(255,255,255,0.8)",
            background: "rgba(0,0,0,0.15)",
            borderRadius: radii.md,
            padding: "0.75rem",
            overflow: "auto",
            maxHeight: "200px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button onClick={() => submit()} style={{ flex: 1 }}>
            Autorizar
          </Button>
          <Button onClick={() => reject()} variant="ghost" style={{ flex: 1 }}>
            Rechazar
          </Button>
        </div>
      </div>
    </Overlay>
  );
}

function DeviceRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "0.5rem",
      }}
    >
      <span
        style={{
          fontSize: typography.sizes.xs,
          color: "rgba(255,255,255,0.5)",
          fontWeight: typography.weights.semibold,
          textTransform: "uppercase" as const,
          letterSpacing: "0.05em",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: typography.sizes.sm,
          color: "rgba(255,255,255,0.9)",
          fontFamily: mono ? "monospace" : undefined,
          textAlign: "right" as const,
          wordBreak: "break-all" as const,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        zIndex: 100,
      }}
    >
      {children}
    </div>
  );
}
