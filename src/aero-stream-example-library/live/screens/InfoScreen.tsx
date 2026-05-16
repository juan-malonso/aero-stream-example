"use client";

import React from "react";
import { type AeroStreamInfoScreen } from "aero-stream-pilot";
import { Column } from "@/components/ui";
import { colors, radii, typography } from "@/styles/tokens";
import { StepCard } from "../StepCard";

export const InfoScreen: AeroStreamInfoScreen<React.ReactNode> = ({
  infoType,
  data = {},
}) => {
  switch (infoType) {
    case "TAILING":
      return <TailingCard data={data} />;
    default:
      return <DefaultCard data={data} />;
  }
};

function DefaultCard({ data }: { data: Record<string, unknown> }) {
  const message = typeof data.message === "string" ? data.message : "";

  return (
    <StepCard title="En espera">
      <Column
        style={{ width: "100%", maxWidth: "24rem", marginBottom: "50px" }}
        gap="1.5rem"
        align="center"
      >
        <div
          style={{
            width: "5rem",
            height: "5rem",
            backgroundColor: colors.blue50,
            color: colors.blue500,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            style={{ width: "2.5rem", height: "2.5rem" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <polyline
              points="12 6 12 12 16 14"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p
          style={{
            fontSize: typography.sizes.lg,
            color: colors.gray700,
            margin: 0,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
      </Column>
    </StepCard>
  );
}

function TailingCard({ data }: { data: Record<string, unknown> }) {
  const stepType = typeof data.stepType === "string" ? data.stepType : null;

  return (
    <StepCard title="Siguiendo sesión">
      <Column
        style={{ width: "100%", maxWidth: "24rem", marginBottom: "50px" }}
        gap="1.5rem"
        align="center"
      >
        <div
          style={{
            width: "5rem",
            height: "5rem",
            backgroundColor: colors.gray100,
            color: colors.gray500,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            style={{ width: "2.5rem", height: "2.5rem" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
          </svg>
        </div>
        <Column gap="0.5rem" align="center">
          <p
            style={{
              fontSize: typography.sizes.base,
              color: colors.gray500,
              margin: 0,
              textAlign: "center",
            }}
          >
            Otro dispositivo está completando el flujo
          </p>
          {stepType && (
            <div
              style={{
                padding: "0.25rem 0.75rem",
                background: colors.gray100,
                borderRadius: radii.full,
                fontSize: typography.sizes.xs,
                fontWeight: typography.weights.semibold,
                color: colors.gray600,
                fontFamily: "monospace",
                letterSpacing: "0.03em",
              }}
            >
              {stepType}
            </div>
          )}
        </Column>
      </Column>
    </StepCard>
  );
}
