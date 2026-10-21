# Proposal

## Why

Every authenticated page refetches all of its server data on every mount (`staleTime: 0`), and every goal/project mutation invalidates the whole goal and project cache, so warm navigation costs as much as a cold load and one status click triggers dozens of requests. This change fixes the client-side half of that cost without touching the API contract, so it can ship and be measured before the paired contract/schema rebuild (`rebuild-foundation-pre-launch`).

Evidence (audit 2026-10-20): `apps/web/src/fsd/app/providers/query-provider.tsx:7-10` (`staleTime: 0`, default `refetchOnMount`); `pages/goals/model/goals-data/use-goal-actions.ts:54-55,207-216` (`goals.all` + `projects.all` invalidation per status flip/delete); `pages/goals/model/goal-edit/use-goal-edit-save.ts:82-83`; `use-project-actions.ts:29-36`; `app/layout/app-shell.tsx:151` and `use-plan-create.ts:197` (blanket invalidation after create flows); `packages/game-catalog/src/game-catalog-sync.ts:101-136` and `packages/player-data/src/player-data-sync.ts:65-106` (sequential dataset/chunk downloads); `features/v1-import/.../v1-import-panel.tsx:113-117` (double `GET /me`, prefix-colliding invalidation); guild register/sync responses discarded then `guilds/me` refetched.

## What Changes

- Default query freshness: server-owned per-user data is treated as fresh for a bounded window after fetch and is **not** refetched on remount; the only writer is this user, through this client, so cache updates come from mutation responses, not refetches. `GET /me` keeps a short window during the setup/onboarding flow.
- Mutations apply their response to the cache (`setQueryData`) and invalidate only the keys whose data the mutation can have changed (the affected goal, the affected project's membership, the order revision), never `goals.all` / `projects.all` wholesale.
- Mutation responses that are currently discarded (guild register/sync, Tacticus integration update, V1 import) are applied instead of triggering a refetch; V1 import issues one `GET /me`, not two.
- Game-catalog datasets and player-data chunks download with bounded concurrency instead of strictly one after another.
- The onslaught-override query key is scoped so invalidating it no longer invalidates the campaign-events override.
- No change to which endpoints are called or to their shapes. The goal-detail fan-out and the per-project goal fetches remain (they need the API changes in `rebuild-foundation-pre-launch`).

## Capabilities

### New Capabilities

- `client-data-freshness`: how long server-owned data stays fresh in the client cache, when it is refetched, and how mutations update it (response-first, targeted invalidation).

### Modified Capabilities

- none — existing page specs describe what is shown, not how often it is fetched.

## Impact

- `apps/web/src/fsd/app/providers/query-provider.tsx`; every `use*Actions` / mutation hook under `pages/goals`, `pages/projects`, `features/guild-*`, `features/v1-import`, `entities/*/api/*.queries.ts` (key factories).
- The nine form sites' mutation request state (moved here from `persist-view-state-in-url`, which edits the same lines).
- Download concurrency for the two sync loops is **not** in this change: it moved to `catalog-read-layer`, which rewrites both loops into one engine.
- No API change; no companion `tacticus-planner-api` change. Independent of `optimize-api-handlers`; lands before `persist-view-state-in-url` (shared form files) and before `rebuild-foundation-pre-launch`.
- Validation: per-route request counts (cold/warm) recorded before and after, see design.md.
