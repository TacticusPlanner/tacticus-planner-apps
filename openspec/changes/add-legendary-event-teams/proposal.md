# Proposal

## Why

Stage 2 of the V2 Legendary Event plan ("Teams and plan persistence", docs plan §5, feature spec "Teams and plan (Stage 2)", [ADR 0008](https://github.com/TacticusPlanner/tacticus-planner-docs/blob/main/decisions/adr/0008-lre-owned-teams.md)). Stage 1 made the event page useful with no input at all; the next step every later stage depends on is a plan the user can author: which teams play which lane, which objectives they cover, and how far they are expected to clear. The V1 team builder is the fourth-ranked LRE pain point (one row per objective, accidental "Make a team", no partial teams), and 34% of LRE users reuse teams across events, so the builder is redesigned rather than ported and ships with a cross-event copy action and a V1 import part.

## What Changes

- **Teams section on each lane tab**, between the lane overview and the synced progress grid: one card per team (name, member portraits with an "N/5" badge for partial teams, the covered objectives as chips with their points, the team's points per battle, a clear-depth stepper), an explicit **Add team** button, reorder (drag on desktop, move up/down on mobile), edit and delete. Never one row per objective; no gesture creates a team.
- **Team editor** (dialog on desktop, bottom sheet on mobile): a picker pre-filtered to the lane's allowed units, each unit showing the objectives it satisfies and its points per battle, search by name, "only unlocked" filter; up to five members plus an optional reserve; covered objectives derived live as the objectives every non-reserve member satisfies, each untickable; name; manual clear depth.
- **Copy teams from another event**: from the Teams section, pick a source event and any of its teams (any lane); each is previewed against the current lane with the units it would drop; confirmed teams are created with coverage re-derived and dropped units reported.
- **Persistence** through the new API (`GET/PUT /me/legendary-event-plans/{eventId}`, team create/update/delete/order) with the plan-level revision: every mutation sends `expectedRevision`, adopts the returned plan, and on a stale 409 adopts the plan from the body and tells the user the plan was reloaded. The plan is the first TanStack Query data in the Legendary Events slice.
- **V1 import part "Legendary Event teams"** on the V1 import panel with per-event outcomes bucketed like goals (imported / needed no import / not imported / failed) and translated reasons for every code.
- **Shared pieces moved**: `SortableList` from `pages/goals` to `shared/ui`; the V1 import part list de-duplicated into one definition.
- **Tour and i18n**: the event page tour gains a Teams step; all copy in en/de/es/fr.

Out of scope: run inputs and paid options UI (Stage 3; `showPaidOptions` is stored but not shown), token plans (Stage 4), estimated depth (Stage 5; the stepper is manual and the source is always `manual`), suggested teams and goals preview (Stage 6), master table and history (Stage 7), the three-dots unit menu actions (Stage 6; this change adds no menu item).

## Capabilities

### New Capabilities

- `legendary-event-teams`: the per-lane Teams section, the team editor and coverage derivation, copy-from-event, clear depth, ordering, and the client side of plan persistence and conflict handling.

### Modified Capabilities

- `legendary-events-hub`: the lane tab gains a Teams section between the lane overview and the progress grid; the event page tour gains a Teams step.
- `v1-profile-import`: the part selection gains "Legendary Event teams"; its per-event outcomes are reported in the same four buckets with translated reasons.

## Impact

- Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-teams`; apply API first. Shared contract: `LegendaryEventPlanResponse` and the 409 `LegendaryEventPlanConflictResponse` (`issueCode` `legendaryEventPlanStale` | `legendaryEventOrderSetMismatch`), the `legendaryEventPlans` import part with `legendaryEventOutcomes`.
- `apps/web/src/fsd/entities/legendary-event/` (new `api/` for plan DTOs, functions and query options; `lib/team-coverage.ts`, `lib/team-points.ts`, `lib/copy-team.ts`), new `features/legendary-event-teams/` (editor, copy dialog, mutations), `pages/legendary-events/ui/legendary-event/teams/*`, `legendary-event-page.tsx` wiring, `legendary-event.tutorial.tsx`, `features/v1-import/*`, `entities/account/api/account.api.ts` types, `shared/ui/sortable-list.tsx` (moved), locales `legendaryEvents.json` and `common.json` in four languages, i18n parity tests.
- No catalog or player-data package change. No infra change.
