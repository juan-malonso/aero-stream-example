import { type SessionEventEnvelope, SessionEventType } from "../../../lib/sessions/types.ts";

import type { SessionTimelineLayout } from "./SessionTimeline.layout.ts";
import { metricOffsetPercent } from "./SessionTimeline.metrics.ts";

export interface StepTimelineSegment {
  endOffsetPercent: number;
  endTimeMs: number;
  label: string;
  startOffsetPercent: number;
  startTimeMs: number;
  stepId: string;
  title: string;
}

interface EventStep {
  id: string;
  name: string;
  type: string;
}

function parseEventTime(event: SessionEventEnvelope): number {
  return new Date(event.occurredAt).getTime();
}

function bucketStartTimeMs(timeMs: number, layout: SessionTimelineLayout): number {
  const elapsedMs = Math.max(0, timeMs - layout.startMs);
  return layout.startMs + Math.floor(elapsedMs / layout.bucketMs) * layout.bucketMs;
}

function compareEvents(left: SessionEventEnvelope, right: SessionEventEnvelope): number {
  const timeDelta = parseEventTime(left) - parseEventTime(right);
  if (timeDelta !== 0) return timeDelta;
  return left.eventId.localeCompare(right.eventId);
}

function readStep(event: SessionEventEnvelope): EventStep | null {
  const step = event.payload.step;
  if (typeof step !== "object" || step === null) return null;

  const candidate = step as Record<string, unknown>;
  if (typeof candidate.id !== "string" || typeof candidate.name !== "string" || typeof candidate.type !== "string") return null;

  return {
    id: candidate.id,
    name: candidate.name,
    type: candidate.type,
  };
}

function isStepChangeEvent(event: SessionEventEnvelope): boolean {
  return event.type === SessionEventType.STEP_RENDERED || event.type === SessionEventType.STEP_START;
}

function isSessionCloseEvent(event: SessionEventEnvelope): boolean {
  return event.type === SessionEventType.SESSION_CLOSED || event.type === SessionEventType.TAILING_CLOSED;
}

export function createStepTimelineSegments(events: SessionEventEnvelope[], layout: SessionTimelineLayout): StepTimelineSegment[] {
  const sortedEvents = [...events].sort(compareEvents);
  const segments: StepTimelineSegment[] = [];
  let activeStep: EventStep | null = null;
  let activeStartMs = layout.startMs;

  const closeActiveStep = (endMs: number) => {
    if (!activeStep) return;
    const boundedEndMs = Math.max(activeStartMs, Math.min(layout.endMs, endMs));
    const startOffsetPercent = metricOffsetPercent(activeStartMs, layout);
    const endOffsetPercent = metricOffsetPercent(boundedEndMs, layout);
    if (endOffsetPercent <= startOffsetPercent) return;

    segments.push({
      endOffsetPercent,
      endTimeMs: boundedEndMs,
      label: activeStep.name || activeStep.type,
      startOffsetPercent,
      startTimeMs: activeStartMs,
      stepId: activeStep.id,
      title: `${activeStep.type} - ${activeStep.name} · ${activeStep.id}`,
    });
  };

  for (const event of sortedEvents) {
    const eventTimeMs = parseEventTime(event);
    if (Number.isNaN(eventTimeMs) || eventTimeMs < layout.startMs) continue;
    const eventBucketStartMs = bucketStartTimeMs(eventTimeMs, layout);

    if (isSessionCloseEvent(event)) {
      closeActiveStep(eventBucketStartMs);
      activeStep = null;
      break;
    }

    if (!isStepChangeEvent(event)) continue;

    const nextStep = readStep(event);
    if (!nextStep || activeStep?.id === nextStep.id) continue;

    closeActiveStep(eventBucketStartMs);
    activeStep = nextStep;
    activeStartMs = Math.min(layout.endMs, eventBucketStartMs);
  }

  closeActiveStep(layout.endMs);
  return segments;
}
