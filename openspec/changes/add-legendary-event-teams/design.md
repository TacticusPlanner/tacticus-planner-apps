# Design

## Context

- The event page (`pages/legendary-events/ui/legendary-event/legendary-event-page.tsx`) is keyed by event id, holds the selected tab and the shared leaderboard state locally, and renders a lane tab as lane overview → progress grid → leaderboard. Everything it reads today is local Dexie data through `useReadState`; no TanStack Query, no API.
- `entities/legendary-event` already exposes `isUnitAllowedOnLane`, `objectivesSatisfied`, `unitLanePotential` (points per battle, satisfied indexes), `LegendaryEventLaneId`, `ObjectiveIcon`, `useLegendaryEventUnits` and `useLegendaryEventRoster`. Objectives are identified by lane `index`; lanes by `alpha|beta|gamma`.
- Goals are the reference for server state: `entities/goal/api/goal.api.ts` + `goal.queries.ts` (query-key factory, `queryOptions`), hand-written DTO types, `ApiError.details` narrowed by `issueCode`, optimistic `setQueryData` with rollback, `toast.error` from sonner.
- `SortableList` (dnd-kit, keyboard sensor, 8px pointer distance) lives in `pages/goals/ui/shared/`. `ResponsiveDialog` (Dialog ≥768px, Sheet below) and `UnitCombobox` (single-select) exist in `shared/ui`. There is no multi-unit picker and no stepper component; `pages/progress/ui/event-card.tsx` has the ad-hoc "− input +" pattern.
- The V1 import panel lists parts from a tuple duplicated in `v1-import-panel.tsx` and `import-v1-result.tsx`; goal outcomes are bucketed by `CODE_BUCKETS` in `features/v1-import/model/outcome-buckets.ts`.
- API contract (companion change): plan with one `revision`; every mutation carries `expectedRevision` and returns the whole plan; 409 body `{ issueCode, message, plan }`.

## Goals / Non-Goals

**Goals:**

- A team builder that answers pain #4: one card per team, partial teams first-class, explicit Add team, picker pre-filtered and objective-aware, coverage derived not typed.
- Persistence that survives reload and sync, with conflict handling the user understands in one line.
- Copy-from-event and V1 import so existing users start with their teams.
- Both UI forms designed, tour and i18n complete.

**Non-Goals:**

- Any estimate, suggestion, token plan or goal integration (Stages 4–6).
- Showing `notes` or `showPaidOptions` (Stage 3 adds the inputs drawer; this change persists neither from the UI).
- A generic Teams surface or a multi-unit picker in `shared/ui` beyond what the editor needs.

## Decisions

**D1. Slice ownership and public API.** `entities/legendary-event` owns the plan data: `api/legendary-event-plan.api.ts` (`getLegendaryEventPlan`, `updateLegendaryEventPlan`, `createLegendaryEventTeam`, `updateLegendaryEventTeam`, `deleteLegendaryEventTeam`, `updateLegendaryEventTeamOrder`), `api/legendary-event-plan.queries.ts` (`legendaryEventPlanQueries.all()`, `.detail(eventId)`), `model/plan.types.ts` (`LegendaryEventPlan`, `LegendaryEventTeam`, request types, `LegendaryEventPlanConflictDto`, `legendaryEventPlanConflictDetails(details)` narrower), and pure libs `lib/team-coverage.ts` (`derivedTeamCoverage(members, lane, units)` = objective indexes satisfied by every non-reserve member; `reconcileCoverage(stored, derived)` = `stored ∩ derived` plus newly derived indexes), `lib/team-points.ts` (`teamPointsPerBattle(lane, objectiveIndexes)` = `killPoints` + Σ points of covered objectives), `lib/copy-team.ts` (`previewTeamCopy(team, targetLane, units)` → kept members, dropped unit ids, derived coverage). `features/legendary-event-teams` owns the behaviour: `model/use-legendary-event-plan.ts` (query + mutations + conflict handling), `ui/team-editor-dialog.tsx`, `ui/team-unit-picker.tsx`, `ui/copy-teams-dialog.tsx`, `ui/clear-depth-stepper.tsx`. `pages/legendary-events/ui/legendary-event/teams/` owns layout: `teams-section.tsx`, `team-card.tsx`, `teams-empty-state.tsx`. Exports go through each slice's `index.ts`.

**D2. One plan query per event; mutations adopt the response.** `legendaryEventPlanQueries.detail(eventId)` (enabled when authenticated) is the only plan read; the page passes the plan down. Every mutation sends the cached `revision` as `expectedRevision`, is serialised through a queue ref like `use-goal-order-actions`, and on success calls `setQueryData` with the returned plan (no invalidation needed: the response is the whole plan). Reorder and delete are optimistic (patched plan with revision + 1, rolled back on error); create and update wait for the server (the editor shows a pending state), because the server assigns the team id. On an `ApiError` whose details narrow to `legendaryEventPlanStale` or `legendaryEventOrderSetMismatch`, the hook adopts `details.plan` into the cache and shows one toast `teams.toasts.reloaded` ("Your plan changed on another device and was reloaded. Try again."); the editor stays open with its draft so the user can resubmit. Any other error: rollback and `toast.error(message)`.

**D3. Coverage is derived on the client and stored as a set; the editor tracks opt-outs against the previous derivation.** The editor keeps two sets in its draft: `derived` = `derivedTeamCoverage(members, lane, units)` for the current members, and `excluded` = the objectives the user unticked while they derived. The checked chips are `derived − excluded`, and that set is what is saved as `objectiveIndexes`. The transition rule is `reconcileCoverage(stored, previousDerived, derived)` = `(stored ∩ derived) ∪ (derived − previousDerived)`: an objective that keeps deriving keeps the user's choice (ticked or unticked), one that stops deriving is dropped, and one that starts deriving is ticked. On open, `previousDerived` is the derivation of the stored members, so `excluded` = `previousDerived − stored` recovers the opt-outs; on each member change, the previous draft derivation is passed. Coverage of a stored team is reconciled against the current catalog on display with the same helper using the stored members' derivation as both `previousDerived` and `derived` (so nothing is auto-added without a save): a catalog update never hides a chip that still derives, and an objective that no longer derives is shown muted with a "not covered by current members" tooltip and excluded from points. The reserve member does not affect coverage.

**D4. Team card content (canonical view model).** `buildTeamCardViewModel(team, lane, units, roster)` → `{ id, name, members: [{unitId, owned}], reserve, memberCount, coverage: [{index, derived, covered, points}], pointsPerBattle, expectedBattleClears, sortOrder }`. Points per battle use the lane's kill points plus covered objective points (the same figure the leaderboard shows per unit, so a full five-unit team covering the same objectives shows the same number as each of its units).

**D5. Lane tab placement and empty state.** The Teams section sits between the lane overview and the progress grid on both forms, under a `legendary-event-teams` test id. Empty state: one line ("No teams on Alpha yet") plus the Add team button and, when another event has teams, a Copy from event button. Loading: a skeleton card; load failure: an inline alert with Retry (the rest of the lane tab still renders from local data); signed-out users never see the section (the page is authenticated).

**D6. Desktop and mobile split.** Both forms render the same card list. Desktop: drag reorder through `SortableList` (moved to `shared/ui`, goals keep importing it from there), drag handle on the card, keyboard reorder via the dnd-kit keyboard sensor. Mobile: no drag; each card's menu has Move up / Move down (hidden at the ends). Editor: `ResponsiveDialog`, so Dialog on desktop and bottom Sheet on mobile; the unit picker is a scrollable grid of unit tiles in both, 6 per row on desktop and 4 on mobile. Tour selectors are the same on both forms (`legendary-event-teams`, `legendary-event-add-team`).

**D7. Unit picker.** Lists `lane.availableUnitIds` only, as tiles: portrait, name, the objective icons it satisfies (muted when not), its points per battle, locked styling when not owned; search by localized name; "only unlocked" switch defaulting to the page's shared `onlyUnlocked` value; tapping toggles membership up to five (sixth tap is ignored with the count badge pulsing); a tile's secondary action sets it as reserve. Selected members render above the grid in position order with remove buttons; a member can be dragged within the five on desktop (positions matter for the API only; no gameplay meaning yet).

**D8. Clear depth.** `ClearDepthStepper` is "− number +" bounded 1..`lane.battleIds.length`, with a Clear control that sets null; any user edit sets source `manual`. A null depth shows "Set depth" on the card so Stage 4 can point at it. No estimate anywhere in this change.

**D9. Copy from event.** Source events are the other catalog events that have a plan with at least one team; the dialog fetches their plans on open (`useQueries` over `legendaryEventPlanQueries.detail`). Each source team is listed with its lane and a preview against the current lane: kept members, dropped members (not allowed on this lane), derived coverage count. Selected teams are created sequentially through the normal create mutation (name kept, depth cleared to null, coverage derived). After completion a toast summarises "Copied N teams; M units were not allowed on Alpha" and the dialog closes. A source team with no kept member is listed disabled.

**D10. V1 import part.** `ImportV1ProfileRequest.import.legendaryEventPlans` and `ImportV1ProfileResult.legendaryEventPlans` + `legendaryEventOutcomes: V1LegendaryEventOutcome[]` ({ eventId, v1EventId, status, code, message, teamsImported, issues[{code, teamName, value}] }). The part tuple moves to `features/v1-import/model/parts.ts` and both files read it. Outcomes bucket by code: `imported` → imported (label: event name from `useUnitName(eventId)` with "N teams"); `plan_already_exists` → needed no import; `event_not_in_catalog` → not imported; `legendary_event_import_failed` → failed; issues render under their event as one line each with translated reason (`goals.v1Import.legendaryEvents.issues.<code>`) and the value. After an import with the part selected, `legendaryEventPlanQueries.all()` is invalidated. Both hosts (`/account/v1-import` and onboarding) get the part; onboarding checks it by default like the others.

**D11. Analytics.** Emit `legendary_event_team_created`, `legendary_event_team_edited`, `legendary_event_team_deleted` (properties: eventId, laneId, memberCount, objectiveCount), `legendary_event_depth_set` (laneId, depth) and `legendary_event_teams_copied` (count, droppedUnits) through the existing analytics entry point.

## Risks / Trade-offs

- [Two devices editing one plan collide on one revision] → the 409 body carries the plan; the hook adopts it and the editor keeps its draft, so recovery is one tap.
- [Sequential copy creates N requests] → N is at most a handful of teams; each adopts the latest plan, so revisions stay in step.
- [Moving `SortableList` touches the goals page] → goals list and mobile cards tests run as regression; FSD validator checks the new import path.
- [Picker performance with ~100 allowed units] → tiles are plain elements with memoised potential rows; the leaderboard already renders the same set.
- [Objective chip meaning drifts when the catalog changes an event] → reconcile against the current catalog on display; the API echoes `catalogVersion` for a future warning.

## Migration Plan

No data migration. `SortableList` import path changes in two goals files. The `legendaryEvents` and `common` namespaces gain keys; parity tests enforce all four locales.

## Open Questions

- Whether the "accidental Make a team" complaint was a swipe or tap-target issue is still unconfirmed; this design removes every gesture path, so either reading is covered.
