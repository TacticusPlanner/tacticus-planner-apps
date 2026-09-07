## Why

The goal-creation acquisition-source picker currently shows each source group's yield in a
different, non-comparable unit — Onslaught as "shards per run", Shops as a currency/quantity
line, Campaigns as a per-node energy figure — so a user cannot see at a glance which source
moves the needle most. The Onslaught yield is also hidden until the group is checked (so you
must opt in before you can judge whether to), is keyed off the goal's target tier rather than
the character's current state, and its "Edit Onslaught progress" link points at a route that
does not exist (`/onslaught`) and abandons the half-filled sheet. Finally, the "Resources
needed" summary never tells the user how many Onslaught runs or how much shop currency a
selected source actually costs them.

## What Changes

- Every acquisition-source group (Campaigns, Onslaught, Shops) presents its yield as a single
  comparable figure: **≈ X shards/day**. Onslaught is per-run yield × current run cadence; each
  shop offer is its expected weekly supply averaged to a daily rate; Campaigns is the expected
  shards/day from the selected (or default lowest-energy) nodes at the planning daily-energy
  budget.
- The Onslaught group's shards/day figure (or the "set your progress" prompt) is shown
  **whenever the Onslaught group is offered**, not only when it is checked.
- The Onslaught shards/day figure is derived from the **character's current progression /
  rarity**, independent of the goal's target tier.
- "Edit Onslaught progress" navigates to `/progress/onslaught` and closes the goal-creation
  sheet **without resetting the form**, so the user returns to the same in-progress goal after
  editing their Onslaught progress.
- The "Resources needed" preview gains, per selected non-campaign source, the amount that
  source contributes over the combined estimate window: **Onslaught tokens (runs)** and
  **shop currency per currency type**. Campaign farming keeps its existing energy/raids/days
  line.
- The estimate day-loop attributes contributed shards to the **individual acquisition source**
  that supplied them (today it only totals flat supply per resource id), so the preview can
  report per-source token/currency spend on a contribution-share basis.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `goal-acquisition-source-picker`: the Onslaught group's yield requirement changes — the
  figure is shards/day (not per run), is shown whenever the group is offered (not only when
  selected), and is derived from the character's current progression; a new requirement covers
  the uniform shards/day yield line on the Campaigns and Shops groups; the Edit-Onslaught-
  progress link requirement gains navigation-target and sheet-state behavior; a new requirement
  covers the per-source Onslaught-token and shop-currency figures in the "Resources needed"
  preview.
- `goal-farming-estimates`: the concurrent-simulation requirement gains per-source attribution
  — the estimator reports how many shards each individual selected acquisition source (each
  shop offer, the Onslaught source) contributed over the run, so consumers can derive that
  source's run count or currency spend.

## Impact

- **UI**: `apps/web/src/fsd/pages/goals/ui/create-goal/acquisition-source-field.tsx`,
  `goal-type-cards.tsx`, `goal-farming-fields.tsx`; new i18n keys under
  `goals.create.acquisitionSources.*` in `apps/web/public/locales/*/common.json`.
- **Model**: `apps/web/src/fsd/pages/goals/model/goal-creation-form/use-progression-preview.ts`
  (yield-per-day figures, current-progression Onslaught key, per-source contribution readout),
  and threading a "close the sheet" callback from `create-goal-sheet.tsx` /
  `use-create-goal-form.ts` down to the picker.
- **Estimate engine**: `apps/web/src/fsd/features/goal-farming/lib/estimate.ts`
  (`applyFlatSuppliers`, `estimateGoal` — per-supplier applied totals),
  `model/estimate.domain.ts` (`FlatSupplier` gains a stable key), `lib/shop-supply.ts`
  (`projectShopSupply` / `projectOnslaughtSupply` set that key), and `lib/estimate-plan.ts`
  which shares `applyFlatSuppliers`. `lib/goal-acquisition.ts` is unaffected in behavior but
  passes through the new type.
- **Tests**: `estimate.test.ts`, `shop-supply.test.ts`, `use-progression-preview` coverage,
  `acquisition-source-field.test.tsx`, `create-goal-sheet.test.tsx`,
  `goal-farming-fields`/preview tests, plus the goal-creation onboarding-tour copy is
  unaffected.
- No API or persistence change — this is all client-side estimate presentation.
