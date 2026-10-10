# Tasks

Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-run-inputs` (apply it first; the run and annotation endpoints and `lres[].rewards` must exist in the Aspire stack, and `lre-common` is gone once it lands).

## 1. Catalog package: per-event ladder

- [ ] 1.1 In `packages/game-catalog/src/schemas/lre.ts` add `rewards` (`pointsMilestones`, `chestsMilestones`, `progression`, `shardsPerChest`) to `lreViewSchema` and remove `lreCommonSchema`; remove `lre-common` from `dataset-keys.ts`, `dataset-payloads.ts`, `record-types.ts`, `game-catalog.storage.ts`, `game-catalog.mapper.ts`, `queries.ts` and `index.ts`; verify `schemas.test.ts` and `game-catalog-sync.test.ts` pass with a fixture carrying two different chest ladders and no `lre-common`.
- [ ] 1.2 Replace `useLegendaryEventCommon` with the event's `rewards` in `entities/legendary-event` (`model/types.ts`, `lib/next-points-milestone.ts` taking `rewards`), update `legendary-event-page.view-model.ts`, `run-status-card.tsx` and `apps/web/src/test/fixtures/legendary-events.json`; verify `next-points-milestone.test.ts` and `run-status-card.test.tsx` pass and a new case shows Uthar and Lysander reading their own ladders.

## 2. Entity: plan runs, shared write queue, projection

- [ ] 2.1 Add `LegendaryEventRunInputs` and `runs` to `model/plan.types.ts`, `UpdateRunInputsRequestDto`, and `updateLegendaryEventRunInputs(eventId, run, body)` (`PUT /api/v1/me/legendary-event-plans/{eventId}/runs/{run}`) in `api/legendary-event-plan.api.ts`; verify the api test asserts path and body.
- [ ] 2.2 Move the write queue, adopt-on-success and 409 adoption from `features/legendary-event-teams/model/use-legendary-event-plan.ts` into `entities/legendary-event/model/use-plan-write-queue.ts` unchanged; rewire the teams hook onto it; verify the existing `use-legendary-event-plan.test.tsx` passes untouched and `pnpm lint:fsd` passes (design D1).
- [ ] 2.3 Add `lib/reward-projection.ts` (`projectRewards`) returning the `RewardProjection` shape in design D2; verify `reward-projection.test.ts` covers both Uthar worked examples with every intermediate value, started runs not added again, no synced entry, fewer shards held than chests claimed, enough currency now, beyond the chest ladder, beyond the points ladder, every step reached, paid options off, and the two V1 parity cases on a Dante ladder fixture (design D2, D3).
- [ ] 2.4 Add `LegendaryEventAnnotation` and `annotations` to `model/plan.types.ts`, `UpdateAnnotationsRequestDto` and `updateLegendaryEventAnnotations(eventId, body)` (`PUT …/annotations`); add `lib/applicable-annotations.ts` (`applicableAnnotations(annotations, laneId, syncedLane)` keeping only not-cleared cells); verify the api test asserts path and body, and `applicable-annotations.test.ts` covers a kept mark, a mark on a cleared cell dropped, a complete battle with none, and a lane with no synced entries (design D9).
- [ ] 2.5 Export the new types, functions and hook from `entities/legendary-event/index.ts`.

## 3. Feature: run inputs drawer

- [ ] 3.1 Add `features/legendary-event-run-inputs/model/use-run-inputs.ts`: per-run drafts seeded from the plan, 600 ms settle then one `updateLegendaryEventRunInputs` through the shared queue (nothing sent when unchanged), re-seed on adopted plan, rollback and translated toast on other errors, paid-options toggle through `updateLegendaryEventPlan` keeping `notes`; verify `use-run-inputs.test.tsx` covers settle-once, no-op, conflict adoption and paid values kept when hidden (design D4).
- [ ] 3.2 Add `features/legendary-event-run-inputs/ui/run-inputs-drawer.tsx`: right `Sheet` ≥768px, bottom `Sheet` <768px, runs 1–3 labelled Done / Now / Planned, `NumberStepper` fields bounded by the event's mission counts and 0–75, bundle switch, paid fields only when Show paid options is on; verify `run-inputs-drawer.test.tsx` covers labels for a run-2 account, hidden and shown paid fields, bounds, and focus returning to the Inputs button (design D5).
- [ ] 3.3 Analytics `legendary_event_run_inputs_saved` and `legendary_event_paid_options_toggled` through the existing entry point; verify a test asserts the properties (design D8).

## 3a. Feature: Maybe clear / Stop here marks

- [ ] 3a.1 Add `features/legendary-event-annotations/model/use-annotations.ts`: `markCell` and `markBattle` (all not-cleared cells of a battle), optimistic, one write per action through the shared queue, 409 adoption, rollback and toast on other errors, analytics `legendary_event_annotation_set`; verify `use-annotations.test.tsx` covers one-cell and whole-battle bodies (cleared cells excluded), clear, conflict adoption and rollback (design D8, D9).
- [ ] 3a.2 Add `ui/annotation-menu.tsx` (Not marked / Maybe clear / Stop here, current choice checked) and `ui/battle-annotation-menu.tsx` (Maybe clear / Stop here / Clear marks); verify tests cover keyboard operation and the checked state.
- [ ] 3a.3 Wire them into `pages/legendary-events/ui/legendary-event/progress/` (`progress-rows.tsx`, `progress-parts.tsx`, `progress-grid.tsx`, `progress-section.tsx`): not-cleared cells become menu buttons showing the applicable mark's icon and accessible text, cleared cells stay indicators, incomplete rows get the "⋯" action (desktop) or the battle-number action (mobile), the legend sits beside "how points work"; verify `progress-grid.test.tsx` covers every scenario in `specs/legendary-event-synced-progress/spec.md` (mark one cell, mark a battle, sync clears a mark, complete battle, points unchanged, accessible text).

## 4. Page: Run status card

- [ ] 4.1 Add the Inputs button (`legendary-event-run-inputs`) and the Reward outlook block with its states and "How this is worked out" disclosure to `run-status-card.tsx`, fed by `projectRewards` in the page view model; verify `run-status-card.test.tsx` covers the Uthar outlook lines, the explanation lines, each state (every step reached, beyond chests, enough now, beyond points, no synced entry, loading skeleton, catalog failure) (design D6).
- [ ] 4.2 Add the Inputs tour step after Run status to `legendary-event.tutorial.tsx` (desktop and mobile, `tour.event.steps.runInputs.title/content`) and update the progress grid step copy to mention marks; verify the tutorial test lists it in order.

## 5. V1 import

- [ ] 5.1 Extend `entities/account/api/account.api.ts` outcome type with `runInputsImported` and `annotationsImported`; bucket `inputs_imported` as imported in `legendary-event-outcome-buckets.ts`; render "inputs for N runs", "N marks" and the new issue reasons (run inputs, `unknown_battle`, `existing_annotations_kept`, team-less `unknown_objective` / `unknown_lane`) in `legendary-event-import-result.tsx` and the diagnostic text; update the part description; verify `import-v1-result.test.tsx` covers the inputs-only outcome, the clamp line, marks imported with a skipped one, and the description (design D7).

## 6. i18n

- [ ] 6.1 Add to `legendaryEvents.json` (en/de/es/fr): `runInputs.*` (button, title, run labels Done/Now/Planned, regularMissions, premiumMissions, bundle, closeShards, showPaidOptions, toasts.error), `outlook.*` (next step names, shards, chests, points, battles per lane, every state, explanation lines), `annotations.*` (maybeClear, stopHere, notMarked, clearMarks, rowAction, legend, cell accessible text, toasts.error), `tour.event.steps.runInputs.*` and the updated progress step copy, with real German, Spanish and French copy; verify `legendary-events-translations.test.ts` passes.
- [ ] 6.2 Add to `common.json` (en/de/es/fr): the updated `goals.v1Import.parts.legendaryEventPlans` description, `goals.v1Import.legendaryEvents.runs_one/runs_other` and `marks_one/marks_other`, `reasons.inputs_imported` and `issues.{run_input_clamped,unknown_run,existing_run_inputs_kept,unknown_battle,existing_annotations_kept}` plus team-less variants of `unknown_objective` and `unknown_lane`; verify `common-translations.test.ts` passes.

## 7. Platform-independent verification

Data states: a profile with a synced Uthar entry in run 2 and a plan with run 1 inputs; a profile with no synced entry for an event; an event whose next goal is beyond the chest ladder (fixture).

- [ ] 7.1 With the Aspire stack, open Uthar, compare the outlook's chests and shards against the in-game event screen on the same account, and confirm a saved run input survives reload.
- [ ] 7.2 Run a V1 import with run inputs and marks on a profile that already has imported teams and confirm the inputs appear in the drawer and the marks on the grid.
- [ ] 7.3 Mark a not-cleared cell and a whole battle, reload and confirm they persist; confirm a cell cleared in the synced progress shows no mark even when one is stored.

## 8. Desktop verification (≥768px)

- [ ] 8.1 Inputs opens the right-side sheet beside the card; steppers respect bounds; Show paid options reveals the paid fields; closing returns focus to Inputs.
- [ ] 8.2 The Reward outlook lines and disclosure render on the Overview tab; the tour's Inputs step highlights the button.
- [ ] 8.3 A not-cleared cell opens its popover menu; the "⋯" row action marks the battle; marked cells show the V1 icons; the grid still fits without horizontal scroll.

## 9. Mobile verification (<768px, same-origin iframe per the `tp-manual-ui-verification` skill)

- [ ] 9.1 Inputs opens the bottom sheet; − / + are touch-sized; swipe down dismisses.
- [ ] 9.2 The Reward outlook fits the card without horizontal scroll; the tour's Inputs step highlights the button.
- [ ] 9.3 Tapping a not-cleared cell opens its menu; the battle number opens the row action; rows stay within the viewport width.

## 10. Gates

- [ ] 10.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`.

## Deferred / out-of-session

- Amend `tacticus-planner-docs/product/features/lre-planning.md` (Stage 3 requirements as built, `MaybeClear` / `StopHere` kept for uncleared cells) when this change is archived.
