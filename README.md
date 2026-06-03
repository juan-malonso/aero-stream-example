# aero-stream-example

Demo application for AeroStream and `aero-stream-pilot`.

The app is organized as isolated frontend apps under `src/modules` and shared libraries under `src/libs`. It can run locally with Next.js and deploy as a Cloudflare Worker through OpenNext.

## Prerequisites

- Node.js 20+
- Yarn 4.x (`corepack enable`)
- A running Controller service for workflow and video management
- A running Tower service for runtime sessions and Pilot sync

## Environment

Local defaults match the standard Controller/Tower dev ports:

```env
AEROSTREAM_ACCESS_TOKEN=admin
NEXT_PUBLIC_CONTROLLER_API_URL=http://localhost:8788/api
NEXT_PUBLIC_TOWER_INIT_URL=http://localhost:8787/squawk/init
NEXT_PUBLIC_TOWER_LIVE_URL=ws://localhost:8787/squawk/live
```

Only create `.env.local` when those values need to change.

## Commands

```bash
task dev
yarn dev

task build
yarn build
yarn start
```

Worker deployment remains supported:

```bash
yarn build:worker
yarn build:worker:dev
yarn deploy:dev
task deploy-dev
```

The Worker config is `wrangler.jsonc`. The Tracker event API uses the `DESTINATION_EVENTS_BUCKET` R2 binding.

## Routes

- `/home`: shell with header/menu and full-page app views.
- `/builder`: AeroStream Builder.
- `/runner`: AeroStream Runner, creates sessions and opens Player in an iframe.
- `/live/[sessionId]`: AeroStream Player, Pilot live execution.
- `/tracker`: AeroStream Tracker, session event review and replay.
- `/api/sessions/**`: Tracker-owned event ingestion and session review API.

## Structure

```text
src/
├── app/                     # Thin Next.js routes and API handlers
├── apps/
│   ├── home/
│   ├── aero-stream-builder/
│   ├── aero-stream-runner/
│   ├── aero-stream-player/
│   └── aero-stream-tracker/
├── libs/
│   ├── config/
│   ├── security/
│   ├── ui/
│   └── ...
└── styles/
```

Each app owns its route palette in `src/modules/<app>/styles/theme.ts`. Home loads those app theme modules through `src/modules/home/styles/microfrontendThemes.ts` for the app tabs.

## Flow

1. Use `/builder` to create or select a workflow through Controller.
2. Use `/runner` to create a Tower session.
3. Runner opens `/live/[sessionId]` inside its browser-window iframe.
4. Player runs Pilot and renders workflow steps.
5. Use `/tracker` to review events received through `/api/sessions/events`.

## Adding Steps

Builder step metadata and graph nodes live in `src/modules/aero-stream-builder/lib/steps`. Pilot live rendering lives in `src/modules/aero-stream-player/lib/steps`. Add the same step folder in each owner when the step has both authoring and live UI:

```text
src/modules/aero-stream-builder/lib/steps/steps/my-step/
└── builder.tsx

src/modules/aero-stream-player/lib/steps/steps/my-step/
└── live.tsx
```

Register Builder metadata in `src/modules/aero-stream-builder/lib/steps/builder.ts` and Pilot live rendering in `src/modules/aero-stream-player/lib/steps/live.tsx`.
