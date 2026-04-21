# aero-stream-example

Demo application for [aero-stream-pilot](https://github.com/aero-stream/aero-stream), the AeroStream frontend SDK.

Demonstrates end-to-end encrypted WebSocket workflow orchestration with video streaming and ML detection layers.

## Prerequisites

- Node.js 20+
- Yarn 4.x (`corepack enable`)
- A running [aero-stream-tower](https://github.com/aero-stream/aero-stream) instance (local or remote)

## Environment Setup

Create a `.env.local` file at the repo root:

```env
NEXT_PUBLIC_TOWER_URL=wss://<your-tower-host>/sync
NEXT_PUBLIC_SECRET=<your-pre-shared-secret>
NEXT_PUBLIC_WORKFLOW_ID=<workflow-id-from-tower>
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_TOWER_URL` | WebSocket URL of the Tower instance (`wss://` for production, `ws://` for local) |
| `NEXT_PUBLIC_SECRET` | Pre-shared symmetric key configured on the Tower |
| `NEXT_PUBLIC_WORKFLOW_ID` | ID of the workflow to execute (must exist in Tower's D1 database) |

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

## Connecting to Tower

1. Start your Tower instance and note the WebSocket URL.
2. Set `NEXT_PUBLIC_TOWER_URL` in `.env.local`.
3. Use the **Builder** tab to create or select a workflow.
4. Switch to the **Live** tab to connect and execute the workflow.

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
