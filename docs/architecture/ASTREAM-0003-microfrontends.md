# ASTREAM-0003 Microfrontend Structure

## Status

Current.

## Decision

`aero-stream-example` keeps one Next.js/OpenNext deployable Worker, but the frontend implementation is split into isolated apps under `src/modules`.

App ownership:

- `src/modules/home`: shell with header/menu and full-page app loading.
- `src/modules/aero-stream-builder`: workflow builder.
- `src/modules/aero-stream-runner`: session launcher and Player iframe host.
- `src/modules/aero-stream-player`: Pilot live execution at `/live/[sessionId]`.
- `src/modules/aero-stream-tracker`: session review, timeline, replay, and Tracker-owned session libraries.

Each app owns its route theme in `src/modules/<app>/styles/theme.ts`. Home imports those theme modules through `src/modules/home/styles/microfrontendThemes.ts` when rendering its tab menu. The shared `src/styles/microfrontends.ts` file only defines the theme contract.

Shared libraries:

- `src/libs/ui`: shared primitives and display helpers.
- `src/libs/security`: access cookie checks and protected page provider.
- `src/modules/aero-stream-builder/lib/steps`: Builder step metadata and React Flow nodes.
- `src/modules/aero-stream-builder/lib/workflow`: workflow provider, workflow service, graph adapter, bindings, preview runtime, and workflow models.
- `src/modules/aero-stream-player/lib/steps`: Pilot live step library and screen components.
- `src/modules/aero-stream-runner/lib/tower`: Tower session creation and live URL helpers.
- `src/modules/aero-stream-runner/lib/workflows`: Runner workflow list/detail reader for launching Player sessions.
- `src/libs/config`: Controller/Tower endpoint resolution.

`src/app` stays thin: route entrypoints, route layout, login, and API handlers only.

## Routes

- `/home`
- `/builder`
- `/runner`
- `/live/[sessionId]`
- `/tracker`
- `/api/sessions/**`

No legacy frontend route aliases are kept.

## Deployment

The service still deploys as a Cloudflare Worker through OpenNext. Worker deployment files and scripts remain part of the current structure.
