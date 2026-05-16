# ASTREAM-0003 Microfrontend Architecture

## Decision

Use a route-owned microfrontend architecture inside the existing `aero-stream-example` project:

- Builder surface: `/builder`
- Live surface: `/live`
- Sessions surface: `/sessions`
- Shared step module: `src/aero-stream-example-library`
- Shared workflow state: `src/context/WorkflowContext.tsx`
- Shared UI primitives and visual language: `src/components/ui`, `src/styles`
- Worker deployment path: Next.js App Router built for Cloudflare Workers through the OpenNext Cloudflare adapter

This keeps the current React and Next.js implementation where it is useful, but the architecture does not depend on a tab-only app shell. Each surface has a route boundary, a feature boundary, and explicit shared-library imports.

## Options Considered

| Option | Fit | Tradeoff | Decision |
|---|---|---|---|
| Route-owned surfaces with shared internal libraries | High | Keeps one deployable Worker and gives each surface clear ownership | Selected |
| Workspace/package-style internal modules | Medium | Useful later, but adds package/build overhead before the app needs it | Defer |
| Module federation style composition | Low | Better for independently deployed teams; too much runtime complexity for this example | Reject |
| Multiple Cloudflare Workers, one per frontend surface | Medium | Strong isolation, but adds routing/deployment coordination without current need | Defer |
| Full Vite/React Worker rewrite | Medium | Worker-native and lean, but would rewrite App Router API routes and add risk | Reject for this requirement |

## Why This Fits

- The requirement affects one repository and one deployable example app.
- Builder, Live, and Sessions need clear ownership, not independent release pipelines yet.
- The existing app already has route handlers for session event ingestion and review APIs.
- OpenNext is the documented Cloudflare path for deploying Next.js applications to Workers.
- The current visual system is component and token based, so it can be preserved while routes are separated.

## Boundaries

### App Shell

`src/app/(microfrontends)/layout.tsx` owns the shared shell for the three surfaces. It provides workflow state and renders the navigation header.

### Builder

`src/app/(microfrontends)/builder/page.tsx` and `src/features/builder` own workflow authoring. Builder consumes step configuration from `aero-stream-example-library`.

### Live

`src/app/(microfrontends)/live/page.tsx` and `src/features/live` own session creation and Pilot execution. Live consumes step renderers from `aero-stream-example-library`.

### Sessions

`src/app/(microfrontends)/sessions/page.tsx`, `src/features/sessions`, and `src/app/api/sessions/**` own session review and event reception. Legacy `/api/platform/**` API aliases are intentionally removed so inbound events use the Sessions-owned endpoint.

### Step Library

`src/aero-stream-example-library` owns the current example step set. Each step folder has:

- `builder.ts` for Builder configuration metadata and mappings.
- `node.tsx` for the Builder node rendering for that step.
- `<StepName>Component.tsx` for the complete Live component implementation.
- `live.tsx` for Pilot Live registration.
- `index.ts` for step-local exports.

The first migration includes exactly the current step types:

- Welcome
- KYC
- Video
- Done

## Import Rules

- Feature surfaces may import from `src/aero-stream-example-library`.
- The step library owns the complete Builder and Live step components; `src/components/steps` is not a step boundary anymore.
- The step library must not import Builder, Live, or Sessions feature components.
- Sessions APIs must stay inside `aero-stream-example`.
- Tower runtime code, Pilot, and Controller are out of scope for this requirement; Tower destination configuration may point local example flows at `/api/sessions/events`.

## Validation

- `yarn lint`
- `yarn test`
- `yarn build`
- Worker build command once OpenNext dependencies are installed
- Manual browser review for `/builder`, `/live`, and `/sessions`
