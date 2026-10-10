# Tasks

Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-teams` (apply it first; the plan endpoints must exist in the Aspire stack for live checks).

## 1. Entity: plan data and pure libs

- [x] 1.1 In `entities/legendary-event/model/plan.types.ts` define `LegendaryEventPlan`, `LegendaryEventTeam` (with `runDepths: LegendaryEventTeamRunDepth[]`), `LegendaryEventLaneId`-typed request types (team requests carry `run`) (`UpdatePlanRequestDto`, `CreateTeamRequestDto`, `UpdateTeamRequestDto`, `UpdateTeamOrderRequestDto`), `LegendaryEventPlanConflictDto { issueCode: "legendaryEventPlanStale" | "legendaryEventOrderSetMismatch", message, plan }` and `legendaryEventPlanConflictDetails(details)`; verify a `plan.types.test.ts` narrows a sample 409 body and rejects a goal conflict body (design D1).
- [x] 1.2 Add `entities/legendary-event/api/legendary-event-plan.api.ts` (`getLegendaryEventPlan`, `updateLegendaryEventPlan`, `createLegendaryEventTeam`, `updateLegendaryEventTeam`, `deleteLegendaryEventTeam` with `expectedRevision` as a query parameter, `updateLegendaryEventTeamOrder`) over `apiGet/apiPut/apiPost/apiDelete` with paths `/api/v1/me/legendary-event-plans/{eventId}[/teams[/{teamId}|/order]]`, and `legendary-event-plan.queries.ts` with `legendaryEventPlanQueries.all()` / `.detail(eventId)`; verify an api test asserts each path and body.
- [x] 1.3 Add `lib/current-run.ts` (`currentLegendaryEventRun`, `teamDepthForRun`); verify `current-run.test.ts` covers a synced run 2, a missing entry (run 1) and an out-of-range value (clamped) (design D8).
- [x] 1.4 Add `lib/team-coverage.ts` (`derivedTeamCoverage`, `reconcileCoverage(stored, previousDerived, derived)`), `lib/team-points.ts` (`teamPointsPerBattle`) using `objectivesSatisfied` and the lane's `killPoints`; verify `team-coverage.test.ts` covers the A-then-B scenario, an untick kept while the objective still derives, an objective re-ticked when it newly derives, and reserve exclusion, and `team-points.test.ts` the 30 + 20 + 25 = 75 example (design D3, D4).
- [x] 1.5 Export the new types, functions and queries from `entities/legendary-event/index.ts`; verify `pnpm lint:fsd` passes.

## 2. Shared UI moves

- [x] 2.1 Move `pages/goals/ui/shared/sortable-list.tsx` to `shared/ui/sortable-list.tsx`, export it from `shared/ui/index.ts`, update `goals-list.tsx` and `goals-mobile-cards.tsx` imports; verify the goals board tests and `pnpm lint:fsd` pass (design D6).
- [x] 2.2 Add `shared/ui/number-stepper.tsx` (`−  input  +`, min/max, optional clear) extracted from the pattern in `pages/progress/ui/event-card.tsx` without changing that page; verify a stepper test covers bounds and clear.

## 3. Feature: plan mutations and editor

- [x] 3.1 Add `features/legendary-event-teams/model/use-legendary-event-plan.ts`: `useQuery(legendaryEventPlanQueries.detail(eventId))` enabled when authenticated; mutations `createTeam`, `updateTeam`, `deleteTeam` (optimistic), `reorderLane` (optimistic), `setDepth` (sends `run` from `currentLegendaryEventRun` with the depth); a queue ref serialising requests; on success `setQueryData` with the returned plan; on a conflict (`legendaryEventPlanConflictDetails`) adopt `details.plan`, `toast(t("teams.toasts.reloaded"))`, no auto-retry; other errors roll back and `toast.error`; verify `use-legendary-event-plan.test.tsx` covers adopt-on-success, optimistic reorder rollback and the stale-409 adoption with the editor draft preserved (design D2).
- [x] 3.2 Add `features/legendary-event-teams/ui/team-unit-picker.tsx`: tiles for `lane.availableUnitIds` (portrait, name via `useUnitName`, satisfied `ObjectiveIcon`s muted when not, points per battle from `unitLanePotential`, locked styling), name search, only-unlocked switch, selection up to five with the count badge pulse on a sixth tap, reserve secondary action, selected row with remove buttons; 6 per row ≥768px and 4 below; verify `team-unit-picker.test.tsx` covers lane filtering, sixth-tap refusal and reserve (design D7).
- [x] 3.3 Add `features/legendary-event-teams/ui/team-editor-dialog.tsx` on `ResponsiveDialog`: name (default from covered objective labels joined by " · ", else "Team N"), picker, derived coverage chips with untick, `NumberStepper` depth for the current run with source `manual` and `run` in the request, Save disabled with zero members and while pending; verify `team-editor-dialog.test.tsx` covers coverage following members, untick persistence across reopen, zero-objective save and the default name.
- [x] 3.4 Add analytics events `legendary_event_team_created|edited|deleted` and `legendary_event_depth_set` through the existing analytics entry point; verify a test asserts the properties (design D11).

## 4. Page: Teams section on the lane tab

- [x] 4.1 Add `pages/legendary-events/ui/legendary-event/teams/teams-section.tsx` (`data-testid="legendary-event-teams"`, Add team button `legendary-event-add-team`), `team-card.tsx` (view model from `buildTeamCardViewModel` in `teams.view-model.ts`: portraits in position order, N/5 badge, reserve marker, coverage chips with muted no-longer-derived chips, points per battle, the current run's depth stepper or "Set depth", actions menu), `teams-empty-state.tsx`, loading skeleton and inline error with Retry; desktop drag via `SortableList`, mobile Move up / Move down; verify `teams-section.test.tsx` and `team-card.test.tsx` cover order, partial badge, points, the current run's depth (a team with a run-1 depth shows "Set depth" during run 2), mobile move bounds and the three states (design D4–D6, D8).
- [x] 4.2 Wire the section into `legendary-event-page-view.tsx` between the lane overview and the progress section, passing `plan`, `lane`, `units`, `roster`, the current run from the synced progress entry and the page's `onlyUnlocked`; verify `legendary-event-page-view.test.tsx` asserts the lane tab order lane overview → teams → progress grid → leaderboard.
- [x] 4.3 Add the Teams tour step (target `legendary-event-teams`, after the lane overview step) to `legendary-event.tutorial.tsx` for desktop and mobile with `tour.event.steps.teams.title/content` keys; verify the tutorial test lists the new step in order.

## 5. V1 import part

- [x] 5.1 Extend `entities/account/api/account.api.ts` types: `import.legendaryEventPlans`, result `legendaryEventPlans: ImportPartResult`, `legendaryEventOutcomes: V1LegendaryEventOutcome[]`; move the parts tuple to `features/v1-import/model/parts.ts` and add `legendaryEventPlans` with label key `goals.v1Import.parts.legendaryEventPlans` and description; both hosts render it (unchecked on the account page, checked in onboarding); verify `v1-import-panel.test.tsx` covers the new part and the single parts source (design D10).
- [x] 5.2 Add `features/v1-import/model/legendary-event-outcome-buckets.ts` mapping codes to the four buckets and `reasonKeyForLegendaryEventCode`; render event outcomes in `import-v1-result.tsx` under a "Legendary Event teams" group with event names from `useUnitName` (V1 number fallback), "N teams", and issue lines; include them in `buildDiagnosticText`; invalidate `legendaryEventPlanQueries.all()` after an import with the part selected; verify `import-v1-result.test.tsx` covers the imported-with-issue, not-in-catalog and bucket-omission scenarios.

## 6. i18n

- [x] 6.1 Add to `legendaryEvents.json` (en/de/es/fr): `teams.*` (section title, add, empty, loadError, retry, partialBadge, reserve, pointsPerBattle, depth.set/clear/label, menu.edit/delete/moveUp/moveDown, editor._, picker._, toasts.reloaded/deleted/error, deleteConfirm._) and `tour.event.steps.teams.*`, with real German, Spanish and French copy; verify `legendary-events-translations.test.ts` passes.
- [x] 6.2 Add to `common.json` (en/de/es/fr): `goals.v1Import.parts.legendaryEventPlans`, `goals.v1Import.legendaryEvents.{title,teams_one,teams_other,v1Event}`, `goals.v1Import.legendaryEvents.reasons.{imported,plan_already_exists,event_not_in_catalog,no_legendary_event_imported,missing_legendary_event_plans,invalid_legendary_event_plans,legendary_event_import_failed}` and `.issues.{unknown_unit,unit_not_allowed_on_lane,duplicate_unit,unknown_objective,unknown_lane,empty_team,team_truncated,duplicate_team_merged,conflicting_depth_discarded}`; verify `common-translations.test.ts` passes.

## 7. Desktop verification (≥768px, Aspire stack, provisioned account with synced progress)

- [ ] 7.1 On `/legendary-events/astarLysander` Alpha: Add team → pick three units → coverage chips follow the members, untick one, set depth 4, save; the card shows 3/5, the chips, points per battle and depth 4; reload and the team is unchanged; the API's `runDepths` carries the synced run. — not run
- [ ] 7.2 Create two more teams, drag the third above the first; reload and the order holds; delete the middle one; the remaining order is dense. — not run
- [ ] 7.3 Open the same plan in a second tab, edit there, then save in the first tab: the first tab reloads the plan, shows the reloaded message and keeps the editor draft; saving again succeeds. — not run
- [ ] 7.4 Run the event page tour; the Teams step highlights the section after the lane overview step. — not run

## 8. Mobile verification (<768px, same-origin 420px iframe)

- [ ] 8.1 Lane tab order lane overview → Teams → progress grid → leaderboard; Add team opens a bottom sheet; the picker shows four tiles per row and the sixth tap pulses the badge. — not run
- [ ] 8.2 Card menu Move up / Move down reorders and hides at the ends; depth stepper usable with the thumb; tour Teams step scrolls the section into view. — not run

## 9. V1 import verification

- [ ] 9.1 From `/account/v1-import` with a V1 account that has LRE teams: the part is listed unchecked; import with it selected; the result shows one row per V1 event in the right bucket with issue lines and translated reasons; the open event page refreshes its Teams section. — not run

## 10. Gates

- [x] 10.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format`, `git diff --check`.

## Workflow follow-up

- After both PRs are green and reviewed: `/opsx:sync` and `/opsx:archive` in both repos; amend `tacticus-planner-docs/architecture/data/events.md` per the API change's deferred note.
