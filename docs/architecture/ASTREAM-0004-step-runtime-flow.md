# ASTREAM-0004 Step Runtime Flow

## Status

Current.

## Builder To Runtime

Builder owns workflow authoring in `src/modules/aero-stream-builder`.

Shared workflow code lives in `src/modules/aero-stream-builder/lib/workflow`:

- `workflow.service.ts`: Controller workflow API client.
- `workflowAdapter.ts`: React Flow to Tower workflow conversion.
- `bindings.ts`: step result binding parsing.
- `conditionEvaluator.ts`: preview condition resolution.
- `previewRuntime.ts`: demo preview execution boundary.
- `provider/WorkflowContext.tsx`: selected workflow and graph state.

Builder step definitions live in `src/modules/aero-stream-builder/lib/steps`.

Pilot live step definitions live in `src/modules/aero-stream-player/lib/steps`.

## Runner And Player

Runner owns session creation in `src/modules/aero-stream-runner`, uses `src/modules/aero-stream-runner/lib/tower/towerRuntime.service.ts`, and reads workflow metadata through `src/modules/aero-stream-runner/lib/workflows/workflows.service.ts`.

Player owns Pilot integration in `src/modules/aero-stream-player` and renders `/live/[sessionId]`.

Player consumes:

- `src/modules/aero-stream-player/lib/steps/live.tsx`
- `src/modules/aero-stream-player/lib/steps/live/screens/*` for Pilot alert/error/info screens.
- `src/modules/aero-stream-player/components/CompletionScreen.tsx` for post-flow completion UI.
- `src/modules/aero-stream-runner/lib/workflows/workflows.service.ts`
- `src/modules/aero-stream-runner/lib/tower/towerRuntime.service.ts`

## Tracker

Tracker owns session review in `src/modules/aero-stream-tracker`.

Tracker event APIs stay under `src/app/api/sessions/**`, and Tracker storage/event helpers live in `src/modules/aero-stream-tracker/lib/sessions`.

Tower destination delivery posts events to `/api/sessions/events`; Tracker reads those events in `/tracker`.
