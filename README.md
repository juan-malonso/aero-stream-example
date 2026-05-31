# aero-stream-example

Demo application for [aero-stream-pilot](https://github.com/aero-stream/aero-stream), the AeroStream frontend SDK.

Demonstrates end-to-end encrypted WebSocket workflow orchestration with video streaming and ML detection layers.

## Prerequisites

- Node.js 20+
- Yarn 4.x (`corepack enable`)
- A running Controller worker for workflow and video management
- A running [aero-stream-tower](https://github.com/aero-stream/aero-stream) instance for live runtime and Pilot sync

## Environment Setup

The local defaults are enough for the standard Controller/Tower dev ports:

- Controller API: `http://localhost:8788/api`
- Tower init: `http://localhost:8787/squawk/init`
- Tower live: `ws://localhost:8787/squawk/live`
- Access token: `admin`

Create a `.env.local` file at the repo root only when you need to override those values:

```env
AEROSTREAM_ACCESS_TOKEN=admin
NEXT_PUBLIC_CONTROLLER_API_URL=http://localhost:8788/api
NEXT_PUBLIC_TOWER_INIT_URL=http://localhost:8787/squawk/init
NEXT_PUBLIC_TOWER_LIVE_URL=ws://localhost:8787/squawk/live
```

| Variable                             | Description                                                                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AEROSTREAM_ACCESS_TOKEN`            | Token accepted by the Example login route and Controller cookie middleware. Local default is `admin`; the checked-in `dev` Wrangler environment uses `aero-stream-demo`.                                             |
| `NEXT_PUBLIC_CONTROLLER_API_URL`     | HTTP API base URL for Controller-owned workflow builder and video management operations. Include the API prefix when Controller serves management routes below `/api`.                                              |
| `NEXT_PUBLIC_TOWER_INIT_URL`         | Full Tower HTTP URL for runtime session creation. Local default is `http://localhost:8787/squawk/init`.                                                                                                             |
| `NEXT_PUBLIC_TOWER_LIVE_URL`         | Full Tower WebSocket URL for Pilot live sync. Local default is `ws://localhost:8787/squawk/live`.                                                                                                                   |

The selected workflow's secret token is read from the workflow configuration saved by the Builder. The example no longer hard-codes a Pilot secret.

## Running the Demo

```bash
# Install dependencies and start the dev server
task dev

# Or with yarn directly:
yarn install
yarn dev
```

App runs at `http://localhost:3000`.

## Building for Production

```bash
task build
# or
yarn build
yarn start
```

## Deploying to Cloudflare Workers

The example is organized as route-owned microfrontends and deploys to Cloudflare Workers with OpenNext.

The repository provides a dev Cloudflare environment for:

- Worker name: `aero-stream-example-dev`
- Custom domain: `example.aerostream.deploy.men`
- Controller API: `https://controller.aerostream.deploy.men/api`
- Tower init: `https://tower.aerostream.deploy.men/squawk/init`
- Tower live: `wss://tower.aerostream.deploy.men/squawk/live`
- Destination events bucket binding: `DESTINATION_EVENTS_BUCKET`
- Destination events dev bucket name: `aero-stream-dev-destination-events`
- Access token env: `AEROSTREAM_ACCESS_TOKEN=aero-stream-demo`

Prepare the destination events buckets, lifecycle rules, DNS/custom domain, access token, and any required Cloudflare account settings manually before deployment. The repository intentionally does not include scripts that create buckets, mutate R2 lifecycle configuration, or create secrets.

Deploy the dev Worker:

```bash
yarn deploy:dev
```

The same command is available through Task:

```bash
task deploy-dev
```

The Worker config lives in `wrangler.jsonc`. `build:worker:dev` injects the deployed Controller/Tower URLs before OpenNext builds the client bundle. The application surfaces are `/builder`, `/live`, and `/sessions`. Sessions destination events are persisted in the required R2 binding `DESTINATION_EVENTS_BUCKET`; `wrangler.jsonc` maps that binding to the environment-specific bucket.

## Project Structure

```
src/
├── app/                     # Next.js app router and Worker-owned API routes
├── aero-stream-example-library/
│   └── steps/               # Step folders with Builder and Live definitions
├── features/
│   ├── builder/             # Visual workflow builder UI
│   ├── live/                # Live workflow execution view
│   └── sessions/            # Session review microfrontend
├── contexts/
│   ├── builder/             # Builder-owned state helpers
│   └── shared/              # Contexts shared across surfaces
├── lib/
│   ├── builder/             # Builder-owned workflow libraries
│   ├── live/                # Live-owned Tower runtime libraries
│   ├── sessions/            # Sessions-owned event store and types
│   └── shared/              # Cross-surface config and video helpers
├── components/
│   └── ui/                  # Shared UI primitives
└── styles/                  # Shared tokens and global styles
```

## Connecting to Controller and Tower

1. Start Controller and Tower against their shared local development state.
2. Optionally set `NEXT_PUBLIC_CONTROLLER_API_URL`, `NEXT_PUBLIC_TOWER_INIT_URL`, and `NEXT_PUBLIC_TOWER_LIVE_URL` in `.env.local` when not using the default local ports.
3. Use `/builder` to create or select a workflow through Controller.
4. Switch to `/live` to create a session and execute the workflow through Tower/Pilot.
5. Use `/sessions` to review session events received by the example app.

Controller workflow/video route details are still owned by the upstream Controller task. This example keeps those calls isolated in `src/lib/builder/workflow/workflow.service.ts` and `src/lib/shared/video/downloadService.ts` so final path changes stay local to the client boundary.

## Adding Custom Steps

Steps are owned by `src/aero-stream-example-library`. Add one folder per step and keep Builder configuration separate from Live rendering:

```text
src/aero-stream-example-library/steps/my-step/
├── builder.tsx
├── live.tsx
└── index.ts
```

Then export the step from the aggregate Builder, Builder node, and Live registries. `builder.tsx` owns Builder metadata plus node rendering; `live.tsx` owns the Live component plus SDK registration.

## License

[LICENSE](./LICENSE)
