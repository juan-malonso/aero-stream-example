"use client";

import type { Session } from "@/modules/aero-stream-tracker/lib/sessions/types";
import { colors, typography } from "@/styles/tokens";

import { SessionReplay } from "./SessionReplay";
import { SessionTimeline } from "./SessionTimeline";

interface SessionDetailProperties {
  session: Session | null;
  isLoading: boolean;
}

export function SessionDetail({ session, isLoading }: SessionDetailProperties) {
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: colors.gray400,
          fontSize: typography.sizes.base,
        }}
      >
        Loading session...
      </div>
    );
  }

  if (!session) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: colors.gray400,
          fontSize: typography.sizes.base,
        }}
      >
        Select a session to inspect
      </div>
    );
  }

  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        padding: "1.25rem",
      }}
    >
      <SessionReplay sessionId={session.sessionId} />
      <SessionTimeline session={session} />
    </div>
  );
}
