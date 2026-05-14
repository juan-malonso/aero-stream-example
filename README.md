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
- Tower API: `http://localhost:8787`
- Controller admin token: `local-test-admin-token`

Create a `.env.local` file at the repo root only when you need to override those values:

```env
NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN=local-test-admin-token
NEXT_PUBLIC_CONTROLLER_API_URL=http://localhost:8788/api
NEXT_PUBLIC_TOWER_API_URL=http://localhost:8787
# Optional. When omitted, the example derives ws:// or wss://<tower>/app/sync from NEXT_PUBLIC_TOWER_API_URL.
NEXT_PUBLIC_TOWER_SYNC_URL=ws://localhost:8787/app/sync
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONTROLLER_ADMIN_TOKEN` | Local/test Controller token sent as `x-aero-admin-token`. Do not use this public variable for production administrator secrets; production deployments should use a server-side proxy or approved auth integration. |
| `NEXT_PUBLIC_CONTROLLER_API_URL` | HTTP API base URL for Controller-owned workflow builder and video management operations. Include the API prefix when Controller serves management routes below `/api`. |
| `NEXT_PUBLIC_TOWER_API_URL` | HTTP origin/base URL for Tower-owned runtime operations such as session creation. Do not include the Controller API prefix. |
| `NEXT_PUBLIC_TOWER_SYNC_URL` | Optional Tower WebSocket URL for Pilot sync. If omitted, the app derives `/app/sync` from `NEXT_PUBLIC_TOWER_API_URL`. |

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

## Project Structure

```
src/
├── app/                     # Next.js app router
├── features/
│   ├── builder/             # Visual workflow builder UI
│   └── live/                # Live workflow execution view
├── components/
│   ├── steps/               # Step components (Welcome, Video, KYC, Done)
│   └── ui/                  # Shared UI primitives
├── context/                 # WorkflowContext
└── hooks/                   # useWorkflow
```

## Connecting to Controller and Tower

1. Start Controller and Tower against their shared local development state.
2. Optionally set `NEXT_PUBLIC_CONTROLLER_API_URL` and `NEXT_PUBLIC_TOWER_API_URL` in `.env.local` when not using the default local ports.
3. Use the **Builder** tab to create or select a workflow through Controller.
4. Switch to the **Live** tab to create a session and execute the workflow through Tower/Pilot.

Controller workflow/video route details are still owned by the upstream Controller task. This example keeps those calls isolated in `src/lib/workflow/workflow.service.ts` and `src/lib/video/downloadService.ts` so final path changes stay local to the client boundary.

## Adding Custom Steps

Implement a step component and register it in the step library in `src/features/live/components/implement/PilotConnection.tsx`:

```typescript
import { MyCustomStep } from '@/components/steps/MyCustomStep';

const stepLibrary = {
  MyCustomStep,
  // ... existing steps
};
```

The component receives `{ data, submit, reject }` props from the SDK.

## License

[LICENSE](./LICENSE)
