# Tasks

Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-teams` (apply it first; the plan endpoints must exist in the Aspire stack for live checks).

## 1. Entity: plan data and pure libs

- [ ] 1.1 In `entities/legendary-event/model/plan.types.ts` define `LegendaryEventPlan`, `LegendaryEventTeam`, `LegendaryEventLaneId`-typed request types (`UpdatePlanRequest`, `CreateTeamRequest`, `UpdateTeamRequest`, `UpdateTeamOrderRequest`), `LegendaryEventPlanConflictDto { issueCode: "legendaryEventPlanStale" | "legendaryEventOrderSetMismatch", message, plan }` and `legendaryEventPlanConflictDetails(details)`; verify a `plan.types.test.ts` narrows a sample 409 body and rejects a goal conflict body (design D1).
- [ ] 1.2 Add `entities/legendary-event/api/legendary-event-plan.api.ts` (`getLegendaryEventPlan`, `updateLegendaryEventPlan`, `createLegendaryEventTeam`, `updateLegendaryEventTeam`, `deleteLegendaryEventTeam` with `expectedRevision` as a query parameter, `updateLegendaryEventTeamOrder`) over `apiGet/apiPut/apiPost/apiDelete` with paths `/api/v1/me/legendary-event-plans/{eventId}[/teams[/{teamId}|/order]]`, and `legendary-event-plan.queries.ts` with `legendaryEventPlanQueries.all()` / `.detail(eventId)`; verify an api test asserts each path and body.
- [ ] 1.3 Add `lib/team-coverage.ts` (`derivedTeamCoverage`, `reconcileCoverage`), `lib/team-points.ts` (`teamPointsPerBattle`), `lib/copy-team.ts` (`previewTeamCopy`) using `objectivesSatisfied`, `isUnitAllowedOnLane` and the lane's `killPoints`; verify `team-coverage.test.ts` covers the A-then-B scenario, the untick reconciliation and reserve exclusion, `team-points.test.ts` the 30 + 20 + 25 = 75 example, and `copy-team.test.ts` a dropped unit (design D3, D4).
- [ ] 1.4 Export the new types, functions and queries from `entities/legendary-event/index.ts`; verify `pnpm lint:fsd` passes.

## 2. Shared UI moves

- [ ] 2.1 Move `pages/goals/ui/shared/sortable-list.tsx` to `shared/ui/sortable-list.tsx`, export it from `shared/ui/index.ts`, update `goals-list.tsx` and `goals-mobile-cards.tsx` imports; verify the goals board tests and `pnpm lint:fsd` pass (design D6).
- [ ] 2.2 Add `shared/ui/number-stepper.tsx` (`−  input  +`, min/max, optional clear) extracted from the pattern in `pages/progress/ui/event-card.tsx` without changing that page; verify a stepper test covers bounds and clear.

## 3. Feature: plan mutations, editor, copy

- [ ] 3.1 Add `features/legendary-event-teams/model/use-legendary-event-plan.ts`: `useQuery(legendaryEventPlanQueries.detail(eventId))` enabled when authenticated; mutations `createTeam`, `updateTeam`, `deleteTeam` (optimistic), `reorderLane` (optimistic), `setDepth`; a queue ref serialising requests; on success `setQueryData` with the returned plan; on a conflict (`legendaryEventPlanConflictDetails`) adopt `details.plan`, `toast(t("teams.toasts.reloaded"))`, no auto-retry; other errors roll back and `toast.error`; verify `use-legendary-event-plan.test.tsx` covers adopt-on-success, optimistic reorder rollback and the stale-409 adoption with the editor draft preserved (design D2).
- [ ] 3.2 Add `features/legendary-event-teams/ui/team-unit-picker.tsx`: tiles for `lane.availableUnitIds` (portrait, name via `useUnitName`, satisfied `ObjectiveIcon`s muted when not, points per battle from `unitLanePotential`, locked styling), name search, only-unlocked switch, selection up to five with the count badge pulse on a sixth tap, reserve secondary action, selected row with remove buttons; 6 per row ≥768px and 4 below; verify `team-unit-picker.test.tsx` covers lane filtering, sixth-tap refusal and reserve (design D7).
- [ ] 3.3 Add `features/legendary-event-teams/ui/team-editor-dialog.tsx` on `ResponsiveDialog`: name (default from covered objective labels joined by " · ", else "Team N"), picker, derived coverage chips with untick, `NumberStepper` depth with source `manual`, Save disabled with zero members and while pending; verify `team-editor-dialog.test.tsx` covers coverage following members, untick persistence across reopen, zero-objective save and the default name.
- [ ] 3.4 Add `features/legendary-event-teams/ui/copy-teams-dialog.tsx`: `useQueries` over other events' plans, source event list, per-team preview from `previewTeamCopy` (kept, dropped, coverage count; disabled when no kept member), sequential create through the hook, summary toast; verify `copy-teams-dialog.test.tsx` covers the dropped-unit scenario and the no-source case (design D9).
- [ ] 3.5 Add analytics events `legendary_event_team_created|edited|deleted`, `legendary_event_depth_set`, `legendary_event_teams_copied` through the existing analytics entry point; verify a test asserts the properties (design D11).

## 4. Page: Teams section on the lane tab

- [ ] 4.1 Add `pages/legendary-events/ui/legendary-event/teams/teams-section.tsx` (`data-testid="legendary-event-teams"`, Add team button `legendary-event-add-team`, Copy from event when available), `team-card.tsx` (view model from `buildTeamCardViewModel` in `teams.view-model.ts`: portraits in position order, N/5 badge, reserve marker, coverage chips with muted no-longer-derived chips, points per battle, depth stepper or "Set depth", actions menu), `teams-empty-state.tsx`, loading skeleton and inline error with Retry; desktop drag via `SortableList`, mobile Move up / Move down; verify `teams-section.test.tsx` and `team-card.test.tsx` cover order, partial badge, points, mobile move bounds and the three states (design D4–D6, D8).
- [ ] 4.2 Wire the section into `legendary-event-page-view.tsx` between the lane overview and the progress section, passing `plan`, `lane`, `units`, `roster` and the page's `onlyUnlocked`; verify `legendary-event-page-view.test.tsx` asserts the lane tab order lane overview → teams → progress grid → leaderboard.
- [ ] 4.3 Add the Teams tour step (target `legendary-event-teams`, after the lane overview step) to `legendary-event.tutorial.tsx` for desktop and mobile with `tour.legendaryEvent.steps.teams.title/content` keys; verify the tutorial test lists the new step in order.

## 5. V1 import part

- [ ] 5.1 Extend `entities/account/api/account.api.ts` types: `import.legendaryEventPlans`, result `legendaryEventPlans: ImportPartResult`, `legendaryEventOutcomes: V1LegendaryEventOutcome[]`; move the parts tuple to `features/v1-import/model/parts.ts` and add `legendaryEventPlans` with label key `goals.v1Import.parts.legendaryEventPlans` and description; both hosts render it (unchecked on the account page, checked in onboarding); verify `v1-import-panel.test.tsx` covers the new part and the single parts source (design D10).
- [ ] 5.2 Add `features/v1-import/model/legendary-event-outcome-buckets.ts` mapping codes to the four buckets and `reasonKeyForLegendaryEventCode`; render event outcomes in `import-v1-result.tsx` under a "Legendary Event teams" group with event names from `useUnitName` (V1 number fallback), "N teams", and issue lines; include them in `buildDiagnosticText`; invalidate `legendaryEventPlanQueries.all()` after an import with the part selected; verify `import-v1-result.test.tsx` covers the imported-with-issue, not-in-catalog and bucket-omission scenarios.

## 6. i18n

- [ ] 6.1 Add to `legendaryEvents.json` (en/de/es/fr): `teams.*` (section title, add, copy, empty, loadError, retry, partialBadge, reserve, pointsPerBattle, depth.set/clear/label, menu.edit/delete/moveUp/moveDown, editor._, picker._, copy._, toasts.reloaded/copied/deleted/error, deleteConfirm._) and `tour.legendaryEvent.steps.teams.*`, with real German, Spanish and French copy; verify `legendary-events-translations.test.ts` passes.
- [ ] 6.2 Add to `common.json` (en/de/es/fr): `goals.v1Import.parts.legendaryEventPlans`, `goals.v1Import.legendaryEvents.{title,teams_one,teams_other,v1Event}`, `goals.v1Import.legendaryEvents.reasons.{imported,plan_already_exists,event_not_in_catalog,no_legendary_event_imported,missing_legendary_event_plans,invalid_legendary_event_plans,legendary_event_import_failed}` and `.issues.{unknown_unit,unit_not_allowed_on_lane,unknown_objective,unknown_lane,empty_team,team_truncated,duplicate_team_merged}`; verify `common-translations.test.ts` passes.

## 7. Desktop verification (≥768px, Aspire stack, provisioned account with synced progress)

- [ ] 7.1 On `/legendary-events/astarLysander` Alpha: Add team → pick three units → coverage chips follow the members, untick one, set depth 4, save; the card shows 3/5, the chips, points per battle and depth 4; reload and the team is unchanged.
- [ ] 7.2 Create two more teams, drag the third above the first; reload and the order holds; delete the middle one; the remaining order is dense.
- [ ] 7.3 Open the same plan in a second tab, edit there, then save in the first tab: the first tab reloads the plan, shows the reloaded message and keeps the editor draft; saving again succeeds.
- [ ] 7.4 Copy from event: with teams on Uthar, copy one onto Lysander Alpha; the preview lists dropped units and the toast reports the counts.
- [ ] 7.5 Run the event page tour; the Teams step highlights the section after the lane overview step.

## 8. Mobile verification (<768px, same-origin 420px iframe)

- [ ] 8.1 Lane tab order lane overview → Teams → progress grid → leaderboard; Add team opens a bottom sheet; the picker shows four tiles per row and the sixth tap pulses the badge.
- [ ] 8.2 Card menu Move up / Move down reorders and hides at the ends; depth stepper usable with the thumb; tour Teams step scrolls the section into view.

## 9. V1 import verification

- [ ] 9.1 From `/account/v1-import` with a V1 account that has LRE teams: the part is listed unchecked; import with it selected; the result shows one row per V1 event in the right bucket with issue lines and translated reasons; the open event page refreshes its Teams section.

## 10. Gates

- [ ] 10.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format`, `git diff --check`.

## Workflow follow-up

- After both PRs are green and reviewed: `/opsx:sync` and `/opsx:archive` in both repos; amend `tacticus-planner-docs/architecture/data/events.md` per the API change's deferred note.
