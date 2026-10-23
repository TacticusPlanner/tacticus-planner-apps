# Proposal

## Why

Companion of `rebuild-foundation-pre-launch` in `tacticus-planner-api` (applies first). The API half changes the goal/project contract (full-detail goals list with `projectIds`, `goalIds` on projects, one `PUT me/goals/{id}`, bulk `POST me/goals/status`), moves routes under `me/`, unifies errors as `ProblemDetails` + `issueCode`, pages run records and drops `goal.events`. The client must follow — and in doing so can delete the request patterns the 2026-10-20 audit identified as the main source of excess traffic: the per-goal `GET me/goals/{id}` fan-out in nine hooks and the per-project `GET me/projects/{id}/goals` joins in four.

## What Changes

- **BREAKING (internal):** `GoalSummary` is removed; `GoalDetail` (without `events`) is the list item everywhere. `goalQueries.detail(id)` is kept only for the edit dialog's refetch-on-open; every `useQueries` fan-out over goal ids reads from the list instead (`use-daily-raids`, `use-plan-insights`, `use-goals-overview-metrics`, `use-goal-attainment`, `use-per-project-estimates`, `use-shop-recommendations`, `use-legendary-event-goal-targets`, `use-membership-slots`, `use-project-goal-conflicts`).
- `projectsByGoalId` and project goal counts derive from `goal.projectIds` / `project.goalIds`; `useGoalProjects`, `projectQueries.goals(id)` and the per-project fetches on the Goals, Projects, Home and LE pages are removed.
- Goal edits go through `PUT me/goals/{id}` (the combined edit) — the separate target/projects/details mutations collapse into one hook; bulk pause/resume/complete/archive use one `POST me/goals/status`; single-goal status uses the same route with one id. Slot conflicts show the conflicting goal (no project list).
- Route move: player sync → `POST me/player-data/sync`. Guild routes (`guilds/me[...]`, `guilds/register`) are unchanged. `tacticus-api-key/validate` was never called and is removed server-side; `createGoal` (single `POST me/goals`) has no callers and is deleted.
- Per-profile slots remove three client behaviors: the Manage-goals slot blocking ("occupied slot adds nothing"), the "Move to project" destination-slot pre-check, and the rule that different projects can hold different in-flight instances of one unit/type. `use-membership-slots.ts`, the project-slot conflict kind and its i18n keys go.
- `ApiError` parses `application/problem+json` with `issueCode` and `current`; feature-level 409 handling keys on `issueCode` instead of six response shapes.
- LE run history reads paged run records and fetches a record's roster on demand when the run-delta view needs it.
- The hand-written DTO types (there is no client generator) are updated against the API's regenerated `artifacts/openapi/TacticusPlanner.Api.json`.

## Capabilities

### New Capabilities

- `api-error-handling`: how the client parses the unified `ProblemDetails`/`issueCode` error and surfaces conflicts with `current` state.

### Modified Capabilities

- `goal-project-membership`: membership is read from `projectIds`/`goalIds`, not per-project goal lists; slot conflicts name a goal, not projects.
- `goal-bulk-actions`: bulk status is one request with atomic outcome and per-goal conflict display.
- `goal-status-actions`: single status change uses the bulk route; cascade of prerequisites is sent in the same request.
- `goal-edit-dialog` and `goal-target-editing`: one save request; conflict handling via `issueCode`; no event history displayed (none was).
- `goal-list-layout`, `goal-progress-display`, `goal-farming-estimates`, `plan-completion-outlook`, `daily-raids-plan`, `daily-raids-today`, `daily-shop-recommendations`, `legendary-event-goals-preview`: data source is the goals list; no change to what is shown.
- `project-management`: project list carries goal ids; per-project goal fetch removed.
- `legendary-event-run-history`: history is paged; roster deltas load the roster on demand.
- `home-projects-widget`: counts/members from `goalIds`.
- `v1-profile-import`, `account-setup`, `guild-access-onboarding`: route changes only (no UX change).

## Impact

- `apps/web/src/fsd/entities/{goal,project,legendary-event,guild}/api/*`, `shared/api/api-client.ts`, the hooks listed above under `pages/goals`, `pages/dailies`, `pages/projects`, `pages/legendary-events`, `widgets/home-*`, `features/goal-*`, `features/guild-*`, `features/player-data-sync`.
- `packages/player-data/src/player-data-api.ts` (sync route).
- Tests: hook tests that mock `goalQueries.detail` fan-outs are rewritten against the list; request-count e2e (from `tune-client-query-caching`) records the new numbers.
- Depends on the API half being deployed first; `tune-client-query-caching` should land before this so the measured gain is attributable. Sequencing with the sibling audit changes: after `client-baseline-hardening` (deletes the unrouted dailies hooks this change would otherwise rewrite) and after `catalog-read-layer`; before `rehome-feature-logic` (so it moves the already-simplified goals/LE files) and before `memoize-render-hot-paths` (this change's rewrite of `use-goals-overview-metrics`, `use-plan-insights` and `use-goal-attainment` carries their memo boundaries — one `useMemo` over the list-derived inputs — and deletes `use-stable-map.ts`).
