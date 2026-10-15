# Proposal

## Why

Stage 3 of the V2 Legendary Event plan ("Economy inputs and reward projection", docs plan §5; survey row "chest / milestone / points planning", 29%; pain #9 "points/unlock calc off with purchased packs"). The run status card shows where the user is (points, currency, chests, shards from sync) but not where that leads: how many more points until the event unit unlocks or reaches its next star, given the missions and packs the user buys. V1 answers that with `LeProgressService` and a per-run "overview" of missions done, premium missions, bundle and "Oh So Close" shards. V2 has neither the inputs nor the projection, and the run status card's milestone line reads the shared `lre-common` ladder, which is wrong for events whose chest ladder differs (the companion API change removes it).

## What Changes

- **Run inputs drawer.** The Run status card gains an **Inputs** button opening a drawer (side sheet on desktop, bottom sheet on mobile) with one block per run 1–3: regular missions (0–10), and, when **Show paid options** is on, premium missions (0–10), the 300-currency bundle and "Oh So Close" shards (0–75). The drawer also carries the **Show paid options** switch (the plan's `showPaidOptions`). Values save per run through the new API write with the plan's revision contract.
- **Reward projection.** A pure `entities/legendary-event/lib/reward-projection.ts`, ported from V1 `LeProgressService` with the synced state as its base, produces one canonical result: the next ascension step of the event unit (unlock, 4★, 5★, blue star, mythic, two blue stars), shards toward it, chests still to open, the currency those chests cost, how much of it future missions and bundles cover, and the points milestone whose payouts cover the rest. The Run status card shows "Next: <step>", "N more chests", "N points to <milestone points>" and "about N battles per lane", each with a one-line explanation (pain #1 principle: lead with the answer).
- **Per-event ladder.** The run status milestone line and the projection read the event's own `lres[].rewards`; `lre-common` is removed from the catalog package.
- **Maybe clear / Stop here marks.** V1's planning reminders are kept (Severyn, 2026-10-10), applicable only to battles not yet cleared: on the Synced progress grid each not-cleared cell can be marked Maybe clear or Stop here, and each incomplete battle row has an action that marks all of its not-cleared cells at once. Marks are stored on the plan (`annotations`) and are ignored once sync shows the cell cleared. They never change points; Stage 4's token plan will skip marked tokens.
- **V1 import.** The Legendary Event part's description and per-event outcomes cover run inputs and marks (`runInputsImported`, `annotationsImported`, code `inputs_imported`, issues `run_input_clamped`, `unknown_run`, `existing_run_inputs_kept`, `unknown_battle`, `existing_annotations_kept`, and `unknown_objective` / `unknown_lane` without a team).
- **Tour and i18n.** The event page tour gains an Inputs step and the progress grid step mentions marks; all copy in en/de/es/fr.

Out of scope: notes UI, token plan and run forecast (Stage 4), estimated clear depth (Stage 5, `add-legendary-event-clear-estimates`), using marks in the token plan (Stage 4), marks on lanes with no synced progress yet (the grid shows its empty body there).

## Capabilities

### New Capabilities

- `legendary-event-run-inputs`: the inputs drawer, its fields and bounds, the paid-options switch, and persistence through the plan's revision contract.
- `legendary-event-reward-projection`: the projection calculation (with worked examples and its assumption lines) and how it is shown on the run status card.

### Modified Capabilities

- `legendary-event-synced-progress`: not-cleared grid cells and incomplete battle rows carry Maybe clear / Stop here marks; the grid is no longer wholly read-only.
- `legendary-events-hub`: run status reads the event's own reward ladder and carries the Inputs entry point and the projection lines.
- `v1-profile-import`: the Legendary Event part describes and reports run inputs and marks.

## Impact

- Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-run-inputs`; apply API first. Shared contracts: `LegendaryEventPlanResponse.runs` and `.annotations`, `PUT /api/v1/me/legendary-event-plans/{eventId}/runs/{run}`, `PUT …/annotations`, `lres[].rewards`, removal of `lre-common`, `legendaryEventOutcomes[].runInputsImported` and `.annotationsImported`, and the new codes.
- `packages/game-catalog` (`schemas/lre.ts` rewards on `lreViewSchema`, removal of `lreCommonSchema`, dataset keys, storage, mapper, queries, tests), `apps/web/src/fsd/entities/legendary-event/` (`model/plan.types.ts` runs and annotations, `api/legendary-event-plan.api.ts` run and annotation writes, `lib/applicable-annotations.ts`, `lib/reward-projection.ts`, `lib/next-points-milestone.ts` reading event rewards, `model/use-legendary-event-common.ts` removed, shared plan write queue moved here from the teams feature), new `features/legendary-event-run-inputs/` and `features/legendary-event-annotations/`, `pages/legendary-events/ui/legendary-event/progress/*`, `features/legendary-event-teams/model/use-legendary-event-plan.ts` (uses the shared queue), `pages/legendary-events/ui/legendary-event/run-status-card.tsx` and view model, `legendary-event.tutorial.tsx`, `features/v1-import/*`, `entities/account/api/account.api.ts`, test fixtures, locales `legendaryEvents.json` and `common.json` in four languages.
- No infra change.
