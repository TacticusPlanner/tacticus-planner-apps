# Design

## Context

See proposal.md and the API half's design.md for the contract. Client state: TanStack Query with key factories per entity; Dexie for catalog/player data; `useLiveQuery` for player-data reads. After `tune-client-query-caching`, reads are response-first with a 5 min freshness window, which this design assumes.

## Goals / Non-Goals

**Goals:**

- A planning page issues at most `GET me/goals`, `GET me/projects`, settings and overrides — four parallel requests, none per goal or per project.
- One mutation hook per goal operation; one error parser.

**Non-Goals:**

- UI changes (desktop or mobile) beyond the conflict message wording; tutorials, i18n namespaces and layouts are untouched.
- Offline/optimistic rewrites — the response-first pattern from `tune-client-query-caching` is reused as is.

## Decisions

1. **`entities/goal` owns the list as the canonical source.** `goalQueries.list(archived)` returns `GoalDetail[]`; a selector `useGoalsById()` (memoised `Map`) in `entities/goal/model` replaces every `useQueries(detail)` fan-out. `goalQueries.detail(id)` stays for the edit dialog, which calls it with `staleTime: 0` on open to re-check `revision`. Alternative: seed the detail cache from the list and keep the fan-outs — rejected, nine hooks keep a pattern that exists only because of the old summary shape.
2. **Membership derived, not fetched.** `entities/project` exposes a pure `projectGoals(project, goalsById)` helper (it cannot import `entities/goal` under FSD); the composing `useProjectsWithGoals()` hook lives in `features/project-management` and joins projects with goals by `goalIds` in memory. `useGoalProjects`, `projectQueries.goals(id)`, `use-scoped-goal-plan`'s project fetch and the Home widget's three fetches go. Scoped Goals page = list filtered by `projectIds.includes(id)`.
3. **Single edit mutation:** `pages/goals/model/goal-edit/use-goal-edit-save.ts` already composes target/details/projects/priority into one request and is the only edit path (`updateGoal`/`updateGoalTarget` have no callers); it is re-pointed at `PUT me/goals/{id}` in place. No new `features/goal-edit` slice.
4. **Status through the bulk route:** `useGoalActions.setStatus(goalId, status, cascade)` sends `{goalIds: [goalId, ...cascade], status}`; `setStatusMany` sends one request. Response `{goals, orderRevision}` is applied with `setQueryData` to the list; `conflicts[]` renders the existing conflict toast with the conflicting goal name.
5. **Error parsing in one place:** `shared/api/api-client.ts` reads `application/problem+json` into `ApiError { status, issueCode, detail, current?, errors? }`. Feature hooks switch on `issueCode` (`slotOccupied`, `goalRevisionStale`, `membershipStale`, `planRevisionStale`, …) and use `current` to reset drafts (`useRevisionedDraft`, LE write queue already do this with the old shapes).
6. **Run history paging:** `legendaryEventRunRecordQueries.list(eventId)` becomes an infinite query (`after` cursor); `run-history.ts` consumes pages; `rosterQueries.get(recordId)` is fetched lazily when the delta view opens, cached under the record id.
7. **Desktop vs mobile:** no split — the change is data-layer only; both layouts consume the same hooks.
8. **Types first:** there is no client generator; update the hand-written DTO types against `tacticus-planner-api/artifacts/openapi/TacticusPlanner.Api.json` as the first task so type errors enumerate every call site to update. Issue-code strings and the paged run-record/roster shapes come from that artifact.

## Risks / Trade-offs

- [Goals list grows with `config`/`snapshot`; mobile users with 200+ goals] → compressed it is tens of KB; fetched once per 5 min; measured in the e2e request/bytes script.
- [Hooks that computed from a partial set of details now see all goals immediately] → each rewritten hook keeps its own id filter; tests assert identical outputs on the same fixtures.
- [Order of landing] → API first; the apps PR is opened against the regenerated artifact and cannot pass type-check until then.

## Migration Plan

Deploy API, then web. No client-side persisted state changes (Dexie stores untouched); a stale tab simply gets 404s on removed routes until reload — acceptable pre-launch.
