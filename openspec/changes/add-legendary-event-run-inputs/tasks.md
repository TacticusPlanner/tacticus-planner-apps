# Tasks

Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-run-inputs` (apply it first; the run endpoint and `lres[].rewards` must exist in the Aspire stack, and `lre-common` is gone once it lands).

## 1. Catalog package: per-event ladder

- [ ] 1.1 In `packages/game-catalog/src/schemas/lre.ts` add `rewards` (`pointsMilestones`, `chestsMilestones`, `progression`, `shardsPerChest`) to `lreViewSchema` and remove `lreCommonSchema`; remove `lre-common` from `dataset-keys.ts`, `dataset-payloads.ts`, `record-types.ts`, `game-catalog.storage.ts`, `game-catalog.mapper.ts`, `queries.ts` and `index.ts`; verify `schemas.test.ts` and `game-catalog-sync.test.ts` pass with a fixture carrying two different chest ladders and no `lre-common`.
- [ ] 1.2 Replace `useLegendaryEventCommon` with the event's `rewards` in `entities/legendary-event` (`model/types.ts`, `lib/next-points-milestone.ts` taking `rewards`), update `legendary-event-page.view-model.ts`, `run-status-card.tsx` and `apps/web/src/test/fixtures/legendary-events.json`; verify `next-points-milestone.test.ts` and `run-status-card.test.tsx` pass and a new case shows Uthar and Lysander reading their own ladders.

## 2. Entity: plan runs, shared write queue, projection

- [ ] 2.1 Add `LegendaryEventRunInputs` and `runs` to `model/plan.types.ts`, `UpdateRunInputsRequestDto`, and `updateLegendaryEventRunInputs(eventId, run, body)` (`PUT /api/v1/me/legendary-event-plans/{eventId}/runs/{run}`) in `api/legendary-event-plan.api.ts`; verify the api test asserts path and body.
- [ ] 2.2 Move the write queue, adopt-on-success and 409 adoption from `features/legendary-event-teams/model/use-legendary-event-plan.ts` into `entities/legendary-event/model/use-plan-write-queue.ts` unchanged; rewire the teams hook onto it; verify the existing `use-legendary-event-plan.test.tsx` passes untouched and `pnpm lint:fsd` passes (design D1).
- [ ] 2.3 Add `lib/reward-projection.ts` (`projectRewards`) returning the `RewardProjection` shape in design D2; verify `reward-projection.test.ts` covers both Uthar worked examples with every intermediate value, started runs not added again, no synced entry, enough currency now, beyond the chest ladder, beyond the points ladder, every step reached, paid options off, and the two V1 parity cases on a Dante ladder fixture (design D2, D3).
- [ ] 2.4 Export the new types, function and hook from `entities/legendary-event/index.ts`.

## 3. Feature: run inputs drawer

- [ ] 3.1 Add `features/legendary-event-run-inputs/model/use-run-inputs.ts`: per-run drafts seeded from the plan, 600 ms settle then one `updateLegendaryEventRunInputs` through the shared queue (nothing sent when unchanged), re-seed on adopted plan, rollback and translated toast on other errors, paid-options toggle through `updateLegendaryEventPlan` keeping `notes`; verify `use-run-inputs.test.tsx` covers settle-once, no-op, conflict adoption and paid values kept when hidden (design D4).
- [ ] 3.2 Add `features/legendary-event-run-inputs/ui/run-inputs-drawer.tsx`: right `Sheet` ≥768px, bottom `Sheet` <768px, runs 1–3 labelled Done / Now / Planned, `NumberStepper` fields bounded by the event's mission counts and 0–75, bundle switch, paid fields only when Show paid options is on; verify `run-inputs-drawer.test.tsx` covers labels for a run-2 account, hidden and shown paid fields, bounds, and focus returning to the Inputs button (design D5).
- [ ] 3.3 Analytics `legendary_event_run_inputs_saved` and `legendary_event_paid_options_toggled` through the existing entry point; verify a test asserts the properties (design D8).

## 4. Page: Run status card

- [ ] 4.1 Add the Inputs button (`legendary-event-run-inputs`) and the Reward outlook block with its states and "How this is worked out" disclosure to `run-status-card.tsx`, fed by `projectRewards` in the page view model; verify `run-status-card.test.tsx` covers the Uthar outlook lines, the explanation lines, each state (every step reached, beyond chests, enough now, beyond points, no synced entry, loading skeleton, catalog failure) (design D6).
- [ ] 4.2 Add the Inputs tour step after Run status to `legendary-event.tutorial.tsx` (desktop and mobile, `tour.event.steps.runInputs.title/content`); verify the tutorial test lists it in order.

## 5. V1 import

- [ ] 5.1 Extend `entities/account/api/account.api.ts` outcome type with `runInputsImported`; bucket `inputs_imported` as imported in `legendary-event-outcome-buckets.ts`; render "inputs for N runs" and the three new issue reasons in `legendary-event-import-result.tsx` and the diagnostic text; update the part description; verify `import-v1-result.test.tsx` covers the inputs-only outcome, the clamp line and the description (design D7).

## 6. i18n

- [ ] 6.1 Add to `legendaryEvents.json` (en/de/es/fr): `runInputs.*` (button, title, run labels Done/Now/Planned, regularMissions, premiumMissions, bundle, closeShards, showPaidOptions, toasts.error), `outlook.*` (next step names, shards, chests, points, battles per lane, every state, explanation lines) and `tour.event.steps.runInputs.*`, with real German, Spanish and French copy; verify `legendary-events-translations.test.ts` passes.
- [ ] 6.2 Add to `common.json` (en/de/es/fr): the updated `goals.v1Import.parts.legendaryEventPlans` description, `goals.v1Import.legendaryEvents.runs_one/runs_other`, `reasons.inputs_imported` and `issues.{run_input_clamped,unknown_run,existing_run_inputs_kept}`; verify `common-translations.test.ts` passes.

## 7. Platform-independent verification

Data states: a profile with a synced Uthar entry in run 2 and a plan with run 1 inputs; a profile with no synced entry for an event; an event whose next goal is beyond the chest ladder (fixture).

- [ ] 7.1 With the Aspire stack, open Uthar, compare the outlook's chests and shards against the in-game event screen on the same account, and confirm a saved run input survives reload.
- [ ] 7.2 Run a V1 import with run inputs on a profile that already has imported teams and confirm the inputs appear in the drawer.

## 8. Desktop verification (≥768px)

- [ ] 8.1 Inputs opens the right-side sheet beside the card; steppers respect bounds; Show paid options reveals the paid fields; closing returns focus to Inputs.
- [ ] 8.2 The Reward outlook lines and disclosure render on the Overview tab; the tour's Inputs step highlights the button.

## 9. Mobile verification (<768px, same-origin iframe per the `tp-manual-ui-verification` skill)

- [ ] 9.1 Inputs opens the bottom sheet; − / + are touch-sized; swipe down dismisses.
- [ ] 9.2 The Reward outlook fits the card without horizontal scroll; the tour's Inputs step highlights the button.

## 10. Gates

- [ ] 10.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`.

## Deferred / out-of-session

- Amend `tacticus-planner-docs/product/features/lre-planning.md` (Stage 3 requirements as built, the `MaybeClear` / `StopHere` decision once confirmed) when this change is archived.
