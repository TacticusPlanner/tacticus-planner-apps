# Design

## Context

- `shared/api/api-client.ts` is a thin `fetch` wrapper: `request<T>` adds the MSAL bearer token, reads `VITE_API_BASE_URL` per call, and throws `readError(response)` (an `ApiError`) on any non-2xx. `apiGet`/`apiPost`/`apiPut`/`apiDelete` take a path string and a caller-asserted `T`.
- Nine entity modules call them: account, goal, guild, guild-raid-status, legendary-event-plan, planning-settings, campaign-event-progress, onslaught-progress, project. Their wire types live in each slice's `model/types.ts` or `*.api.ts`.
- 13 test files mock global `fetch` and assert on its `(url, init)` arguments.
- The API commits its document at `tacticus-planner-api/artifacts/openapi/TacticusPlanner.Api.json`. Both repos are public, so a raw GitHub URL needs no token. In the workspace the API is a sibling checkout at `../../../tacticus-planner-api` from `apps/web`.
- This change depends on the API half (`generate-api-client-types`) for short schema names and string enums. Without them the generated types use namespace-long names and plain `string` where the client has literal unions today.

The requirements are in `specs/api-contract-sync/spec.md`.

## Goals / Non-Goals

**Goals:**

- One source of wire types, the pinned document, enforced by `tsc` and CI.
- No change to runtime behavior, error handling or query/cache code.

**Non-Goals:**

- Generated TanStack Query hooks (`openapi-react-query`).
- The `packages/game-catalog` and `packages/player-data` clients. They keep their own fetchers for now and can import the generated types later.
- Runtime response validation. zod stays where it is (one use).
- Automating the pull from API CI (`repository_dispatch`). Revisit when API-only contract changes become frequent.

## Decisions

### 1. Pin a committed copy, not a live fetch

`apps/web/openapi/api.json` plus `api.ref` (one line: full SHA or `local`) are committed.

`scripts/api-spec.mjs` modes:

- `pull <sha|branch>`: resolve a branch with `git ls-remote https://github.com/TacticusPlanner/tacticus-planner-api <branch>`, download `raw.githubusercontent.com/TacticusPlanner/tacticus-planner-api/<sha>/artifacts/openapi/TacticusPlanner.Api.json`, then write `api.json` and `api.ref`.
- `pull --local`: copy from the sibling checkout and write `local`.
- No mode: regenerate `schema.d.ts` with `openapi-typescript`, then run prettier on it.

Package scripts: `api:pull` and `api:types`.

_Alternatives:_

- Fetch from a running or staging API at build time. Rejected: the build would depend on a deployment, and the result isn't reproducible.
- An npm package published by the API. Rejected: it's release machinery for a single consumer.
- A git submodule. Rejected: apps CI would have to check out the API repo just to read one file.

### 2. `openapi-fetch` with middleware, keeping `ApiError`

```ts
const client = createClient<paths>({
  baseUrl,
  fetch: (r) => globalThis.fetch(r),
})
client.use({
  onRequest: async ({ request }) => {
    request.headers.set("Authorization", `Bearer ${await acquireAccessToken()}`)
    return request
  },
  onResponse: async ({ response }) => {
    if (!response.ok) throw await readError(response)
    return response
  },
})
```

- **Lazy client:** the client is created on first use (`apiClient()`), because `baseUrl` comes from `getRequiredEnvironmentValue`, which tests stub per file.
- **Late-bound `fetch`:** the `fetch` option calls `globalThis.fetch` at request time, because openapi-fetch otherwise captures `fetch` when the client is created, and tests that `vi.stubGlobal("fetch")` afterwards would be bypassed.
- **`unwrap`:** a small helper returns `data` typed by the route. Errors never reach `{ error }`, because the middleware throws first, so callers keep plain promise semantics. That's what TanStack Query and all the conflict-handling code expect.

_Alternative:_ `openapi-typescript` types only, with a hand-written `apiGet<paths[...]>`-style wrapper. Rejected: openapi-fetch already does path and param typing, and it costs about 6 kB.

### 3. Generated schemas aliased in the slice

Each slice's `model/types.ts` keeps its exported names, now as aliases:

```ts
type Schemas = components["schemas"]
export type GoalDetail = Schemas["GoalDetailResponse"]
```

- Consumers don't change.
- Domain-only types (view models, derived shapes) stay hand-written.
- Where today's type is narrower than the wire (e.g. a branded id), keep the narrowing in the mapper, not in the alias.

### 4. Incremental migration behind the old functions

The new client ships next to `apiGet` & co. Each entity module moves in its own task, and its tests switch from asserting `fetch(url, init)` to inspecting the `Request` (a shared `lastRequest()` test helper reads method, URL and JSON body). The old functions are deleted when the last module moves. knip then confirms nothing references them.

### 5. CI checks in `_build-web.yml`

They run after install and before Typecheck:

1. `pnpm --filter web api:types && git diff --exit-code -- apps/web/src/fsd/shared/api/schema.d.ts`
2. `test "$(cat apps/web/openapi/api.ref)" != local`, with a message naming `pnpm api:pull <sha>`.

## Risks / Trade-offs

- **[Risk]** The generated types are looser than today's hand-written unions where the API still emits plain `string`. → The API half makes enums string enums first. Any remaining gap shows up as a type error during migration, and a local narrowing in the mapper covers it.
- **[Risk]** The API merges a contract change without an apps pull. The pinned client stays on the old contract, and the mismatch only shows up at runtime against the new API. → This is no worse than today. The cross-repo pairing convention plus the follow-up in the API tasks covers it, and automating the pull is a recorded non-goal.
- **[Risk]** Mid-migration, two client paths coexist. → Every module task leaves the app green, and the old path is removed in the last task.
- **[Trade-off]** About 330 schemas make `schema.d.ts` large, but it's type-only and adds no bundle size.

## Migration Plan

Land after the API half merges, pinned to its merge SHA. No data or runtime migration. Rollback is a revert.
