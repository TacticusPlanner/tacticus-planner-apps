# Proposal

## Why

Stage 5 of the V2 Legendary Event plan ("Clear-depth estimation", docs plan §5) answers the second-ranked LRE pain point: users must guess how far each team gets, and V1's tokenomics shows nothing until they do (pain #1, "tells me to play stages I can't clear"). The plan's principle is "default, don't ask": every team shows an estimated depth the user can override, so Stage 4's next-token card works without manual setup. The Stage 1 follow-up (2026-10-07) also asked for a per-unit estimate on the eligibility leaderboard ("how many battles this unit clears"), scaled by a curated per-unit efficiency coefficient; that work was deferred from Stage 1 and never opened, so it lands here as the single-unit case of the same calculation.

## What Changes

- **Clear estimate calculation** in `entities/legendary-event/lib/clear-estimate.ts`: effective power = combat power (`@workspace/game-domain`) × the unit's efficiency coefficient (1.0 when not curated); a team's effective power is the sum over its owned, non-reserve members; the estimated depth is the number of consecutive battles from battle 1 whose catalog `power` × the calibrated `powerRatio` the team reaches; with the margin above the last battle cleared and the shortfall to the next. A unit's estimate is the same calculation for a team of five copies of that unit.
- **Team cards and editor**: when the current run has no manual depth, the depth shows the estimate ("~6, estimated") with its margin ("21% above battle 6 · 32% short of battle 7"); any stepper edit stores a manual depth as today; **Use estimate** clears the manual depth. Estimates are recalculated from the synced roster on every render and are **not persisted** (design D2), so a sync never overwrites a manual value and needs no write.
- **Leaderboard**: each lane leaderboard row shows the unit's estimated clears beside its Objectives count; locked units show "—".
- **Calibration**: a pure `calibratePowerRatio(samples)` (median of per-sample geometric bounds) and a task to run it on maintainers' manual team depths, producing the first calibrated `powerRatio` for the API dataset. Estimates are labelled "uncalibrated" until the dataset says it has samples.
- **Override logging**: depth analytics carry the estimate beside the manual value, so coefficients and ratio can be tuned from real overrides.
- **Catalog package** reads the new `lre-clear-estimate` dataset; the entity reads `lre-battles` for battle powers.
- **Tour and i18n**: the Teams tour step mentions estimates; all copy in en/de/es/fr.

Out of scope: the anonymised community aggregate (plan's later separate change), suggested teams and upgrade impact (Stage 6, which reuses this calculation), token plans (Stage 4).

## Capabilities

### New Capabilities

- `legendary-event-clear-estimates`: the effective-power and depth calculation (with worked examples and assumption lines), calibration, dataset states, and how estimates and margins are shown.

### Modified Capabilities

- `legendary-event-teams`: the clear depth shows the estimate when no manual depth exists for the current run, offers Use estimate, and logs overrides with the estimate.
- `legendary-event-eligibility`: lane leaderboard rows carry the unit's estimated clears.

## Impact

- Companion API change: `tacticus-planner-api/openspec/changes/add-legendary-event-clear-estimates`; apply API first. Shared contract: the `lre-clear-estimate` dataset.
- `packages/game-catalog` (schema, dataset key, storage, mapper, query for `lre-clear-estimate`; tests), `apps/web/src/fsd/entities/legendary-event/` (`lib/clear-estimate.ts`, `lib/calibrate-power-ratio.ts`, `lib/unit-combat-power.ts`, `model/use-legendary-event-battles.ts`, `model/use-clear-estimate-config.ts`, roster type gains ability levels and applied upgrades), `features/legendary-event-teams/ui/clear-depth-stepper.tsx` and `team-editor-dialog.tsx`, `pages/legendary-events/ui/legendary-event/teams/*`, `leaderboard/*`, `legendary-event.tutorial.tsx`, locales `legendaryEvents.json` in four languages.
- Requires the companion API's catalog route `GET /api/v1/game-catalog/lre-clear-estimate` (the dataset). No calculation endpoint and no plan-shape change: the existing `estimate` depth source stays unused by this client (design D2).
- Independent of `add-legendary-event-run-inputs` (Stage 3).
