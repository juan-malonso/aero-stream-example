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
- Controller admin token: `local-test-admin-token`

Create a `.env.local` file at the repo root only when you need to override those values:

```env
NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN=local-test-admin-token
NEXT_PUBLIC_CONTROLLER_API_URL=http://localhost:8788/api
NEXT_PUBLIC_TOWER_INIT_URL=http://localhost:8787/squawk/init
NEXT_PUBLIC_TOWER_LIVE_URL=ws://localhost:8787/squawk/live
```

| Variable                             | Description                                                                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN` | Local/test Controller token sent as `x-aero-admin-token`. Do not use this public variable for production administrator secrets; production deployments should use a server-side proxy or approved auth integration. |
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

## Building for Cloudflare Workers

The example is organized as route-owned microfrontends and can be converted into a Worker with OpenNext:

```bash
yarn build:worker
yarn preview:worker
yarn deploy
```

The Worker config lives in `wrangler.jsonc`. The application surfaces are:

- `/builder`
- `/live`
- `/sessions`

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
├── components/
│   └── ui/                  # Shared UI primitives
├── context/                 # WorkflowContext
└── hooks/                   # useWorkflow
```

## Connecting to Controller and Tower

1. Start Controller and Tower against their shared local development state.
2. Optionally set `NEXT_PUBLIC_CONTROLLER_API_URL`, `NEXT_PUBLIC_TOWER_INIT_URL`, and `NEXT_PUBLIC_TOWER_LIVE_URL` in `.env.local` when not using the default local ports.
3. Use `/builder` to create or select a workflow through Controller.
4. Switch to `/live` to create a session and execute the workflow through Tower/Pilot.
5. Use `/sessions` to review session events received by the example app.

Controller workflow/video route details are still owned by the upstream Controller task. This example keeps those calls isolated in `src/lib/workflow/workflow.service.ts` and `src/lib/video/downloadService.ts` so final path changes stay local to the client boundary.

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
