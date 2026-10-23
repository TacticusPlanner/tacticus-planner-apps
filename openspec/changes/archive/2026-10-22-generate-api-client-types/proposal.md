# Proposal

## Why

The web app hand-writes the API's request and response types (about 1,200 lines across nine `entities/*/api` modules and their `model/types.ts`) and builds route strings by hand. A contract change in `tacticus-planner-api` reaches the client only through failing tests, live checks or knip noticing a dead type, as it did throughout rebuild-foundation-pre-launch. The API already publishes an OpenAPI document. Once the companion API change makes it codegen-ready (short schema names, string enums), the client can derive its types from it, so contract drift shows up as a `tsc` error.

Companion change: `generate-api-client-types` in `tacticus-planner-api`. That half applies first.

## What Changes

- **Spec copy pinned to an API commit:**
  - `apps/web/openapi/api.json` holds the API's document.
  - `apps/web/openapi/api.ref` records the API commit it came from.
  - `pnpm api:pull <sha|branch>` downloads that commit's document from GitHub and resolves a branch to its SHA.
  - `pnpm api:pull --local` copies it from the sibling workspace checkout and marks the pin `local`.
  - `pnpm api:types` regenerates the types from the committed copy without any network access.
- **Generated types:** `openapi-typescript` (dev dependency) generates `src/fsd/shared/api/schema.d.ts` from the copy, and it is committed.
- **Typed client:** an `openapi-fetch` client in `shared/api` replaces `apiGet`/`apiPost`/`apiPut`/`apiDelete`.
  - Middleware adds the bearer token and turns failed responses into the existing `ApiError` (same `readError`), so `apiIssue`, `isTransientApiError` and every conflict-adoption path keep working unchanged.
- **Migration:** the nine entity API modules move to the typed client one at a time. Their hand-written wire types become aliases of generated schemas, and the hand-written copies are deleted. Domain-side types and mappers stay.
- **CI guard (`_build-web.yml`):** regenerate the types and fail on any diff in `schema.d.ts`, and fail when `api.ref` is `local`.
- **Out of scope:** generated query hooks (`openapi-react-query`), since query keys, infinite queries and cache writes stay hand-tuned. Also out: the `packages/game-catalog` and `packages/player-data` HTTP clients.

## Capabilities

### New Capabilities

- `api-contract-sync`: how the web app's API types stay bound to a specific API commit. It covers the pinned spec copy, the generated types, and the CI checks that reject drift or an unpinned copy.

### Modified Capabilities

<!-- None: request/response handling and ApiError behavior (rebuild-foundation-pre-launch `api-error-handling`) are unchanged. -->

## Impact

- **Dependencies:** `openapi-fetch` (runtime, about 6 kB) and `openapi-typescript` (dev).
- **New files:** `apps/web/openapi/{api.json,api.ref}`, `apps/web/scripts/api-spec.mjs`, `src/fsd/shared/api/schema.d.ts`.
- **Code:**
  - `src/fsd/shared/api/api-client.ts`: the client and middleware. `ApiError`, `readError` and `apiIssue` are kept.
  - The nine `entities/*/api/*.api.ts` modules and their `model/types.ts` wire types.
  - Tests that assert on raw `fetch` calls, where request shapes change.
- **CI:** two steps in `.github/workflows/_build-web.yml`.
- **No user-visible change.**
