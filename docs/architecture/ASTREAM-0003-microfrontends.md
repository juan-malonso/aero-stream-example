# ASTREAM-0003 Microfrontend Architecture

## Decision

Use a route-owned microfrontend architecture inside the existing `aero-stream-example` project:

- Builder surface: `/builder`
- Live surface: `/live`
- Sessions surface: `/sessions`
- Shared step module: `src/aero-stream-example-library`
- Shared workflow state: `src/contexts/shared/workflow/WorkflowContext.tsx`
- Shared UI primitives and visual language: `src/components/ui`, `src/styles`
- Microfrontend libraries: `src/lib/builder`, `src/lib/live`, `src/lib/sessions`, and `src/lib/shared`
- Worker deployment path: Next.js App Router built for Cloudflare Workers through the OpenNext Cloudflare adapter

This keeps the current React and Next.js implementation where it is useful, but the architecture does not depend on a tab-only app shell. Each surface has a route boundary, a feature boundary, a context boundary when it owns state, and explicit shared-library imports.

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

`src/app/(microfrontends)/builder/page.tsx` and `src/features/builder` own workflow authoring. Builder consumes step configuration from `aero-stream-example-library`, Builder workflow services from `src/lib/builder/workflow`, and Builder-only context hooks from `src/contexts/builder/workflow`.

### Live

`src/app/(microfrontends)/live/page.tsx` and `src/features/live` own session creation and Pilot execution. Live consumes step renderers from `aero-stream-example-library` and Tower runtime helpers from `src/lib/live/tower`.

### Sessions

`src/app/(microfrontends)/sessions/page.tsx`, `src/features/sessions`, `src/lib/sessions`, and `src/app/api/sessions/**` own session review and event reception. Legacy Platform API aliases are intentionally removed so inbound events use the Sessions-owned endpoint.

### Shared Context And Libraries

`src/contexts/shared/workflow` owns workflow state shared by Builder and Live. `src/lib/shared` owns cross-surface infrastructure such as Worker endpoint configuration and Controller video helpers. Surface-specific libraries must stay under their owning microfrontend folder:

- `src/lib/builder/**`
- `src/lib/live/**`
- `src/lib/sessions/**`
- `src/lib/shared/**`

### Step Library

`src/aero-stream-example-library` owns the current example step set. Each step folder has:

- `builder.tsx` for Builder configuration metadata, mappings, and Builder node rendering.
- `live.tsx` for the complete Pilot Live component implementation and Live registration.
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
- Surface-specific services live under `src/lib/<surface>` and shared services under `src/lib/shared`.
- Surface-specific context hooks live under `src/contexts/<surface>` and shared contexts under `src/contexts/shared`.
- Sessions APIs must stay inside `aero-stream-example`.
- Tower runtime code, Pilot, and Controller are out of scope for this requirement; Tower destination configuration may point local example flows at `/api/sessions/events`.

## Validation

- `yarn lint`
- `yarn test`
- `yarn build`
- Worker build command once OpenNext dependencies are installed
- Manual browser review for `/builder`, `/live`, and `/sessions`
