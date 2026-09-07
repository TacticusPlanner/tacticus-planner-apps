## Context

See proposal.md — Why. Relevant current state:

- The picker (`acquisition-source-field.tsx`) renders three groups. Onslaught's panel — the
  yield line and the "Edit Onslaught progress" `<Link to="/onslaught">` — is inside
  `{onslaughtEnabled ? … : null}`. `/onslaught` is not a registered route; the real page is
  `/progress/onslaught` (`app/routes.tsx`).
- `use-progression-preview.ts` computes the yield: `onslaughtShardsPerRun = (min+max)/2` from
  `onslaughtReward(rewards, sector, tier, key)`, where `key` is `"Mythic"` when
  `mythicShards > 0` (a target-derived quantity) else `regularRewardKey(currentRarity)`. It
  builds `flatSuppliers: FlatSupplier[]` (shop offers via `projectShopSupply`, Onslaught via
  `projectOnslaughtSupply`, cadence `runsPerDay = 1.5`) and calls `estimateGoal`.
- `estimateGoal` (`lib/estimate.ts`) returns `flatSupplyTotal: Map<resourceId, number>` —
  total flat supply per resource, summed across all suppliers of that resource. Onslaught and
  a shop offer for the same unit both write `shardResourceId(unit)`, so their contributions
  are indistinguishable in the result. `applyFlatSuppliers` is shared with
  `estimate-plan.ts`.
- `FlatSupplier` is `{ resourceId, supplyOnDay(dayIndex) }` — no identity.
- `CreateGoalSheet` stays mounted while `open` toggles; `useCreateGoalForm` holds the form in
  `useState` and only calls `resetForm()` on a "create another" success — closing the sheet
  already preserves state. What's missing is a way for the picker to _trigger_ the close.
- The "Resources needed" block is `ProgressionPreview` in `goal-farming-fields.tsx`, fed by
  `useProgressionPreview`'s return object.

## Goals / Non-Goals

**Goals:**

- One comparable yield unit (shards/day) on all three groups, driven off live selection state.
- Onslaught yield visible without opting in, and stable against target-tier changes.
- A working Edit-progress affordance that doesn't cost the user their half-filled goal.
- Per-source contribution readout (Onslaught runs, shop currency by currency) on a
  contribution-share basis, which requires per-supplier attribution from the day-loop.

**Non-Goals:**

- No change to how the estimate's day count / energy / raids are computed — attribution is
  additive readout only.
- No change to persistence, the API, or the goal config shape.
- No new Campaigns sub-option UI — the Campaigns shards/day figure is derived from the nodes
  already selectable there.
- Not touching `daily-raids-calc.ts` / `plan-insights-calc.ts` consumers of
  `computeGoalAcquisition`; those keep treating mythic shards as count-only (unchanged).

## Decisions

### 1. Give `FlatSupplier` a stable `key`, attribute applied shards per key

Add `key: string` to `FlatSupplier`. `applyFlatSuppliers` already iterates suppliers and
computes `amount` per supplier; change its return from `Map<resourceId, number>` to also carry
per-key totals (return `{ byResource, bySupplier }`, or switch callers to a
`Map<key, { resourceId, amount }>` and let callers roll up by resource). `estimateGoal`
accumulates `flatSupplyBySupplier: Map<key, number>` alongside the existing
`flatSupplyTotal`, and adds it to `EstimateOutcome`. `estimate-plan.ts` gets the same
per-goal accumulation (its per-goal loop already mirrors `estimateGoal`).

- **Why key over array index:** call sites rebuild the supplier array on every render;
  a semantic key (`"onslaught:regular"` / `"onslaught:mythic"`, and `offer.offerId` for
  shops) survives reordering and is what the preview needs to map back to an offer.
- **Alternative rejected — separate resource ids per source:** would ripple into node
  selection, blocked-reason logic, and the `needs` array; attribution is a reporting concern,
  not a demand-modeling one.
- **Back-compat:** `flatSupplyTotal` stays (other consumers read it); `flatSupplyBySupplier`
  is optional on the outcome, populated only when suppliers are present.

### 2. `projectShopSupply` / `projectOnslaughtSupply` set the key

`projectShopSupply(offer, refDate)` → `key: offer.offerId`. `projectOnslaughtSupply({…})` →
`key: isMythic ? "onslaught:mythic" : "onslaught:regular"`. `goal-acquisition.ts` passes the
type through unchanged (it never reads `flatSupplyBySupplier`).

### 3. shards/day figures, computed in `useProgressionPreview`

- **Onslaught:** `onslaughtShardsPerRun * runsPerDay` (reuse the `1.5` from
  `projectOnslaughtSupply`; export it as a named constant to avoid drift). Compute it whenever
  `onslaughtProgress && rewards?.length` — drop the `plan.onslaught.enabled` and
  `mythicShards > 0` gates. The reward `key` becomes purely current-progression:
  `regularRewardKey` / `"Mythic"` chosen from `playerEntity.progressionIndex` (falling back to
  `progressionStart`) rarity, via the existing `isMythicProgression` helper. Still gated on
  `ascensionEnabled` and Character (matches `showOnslaught`).
- **Shops:** per offer, average `projectShopSupply(offer).supplyOnDay(0..6)` over 7 days →
  `weeklyTotal / 7`. Sum the selected offers for an optional group total.
- **Campaigns:** expected shards/day from the selected nodes (or default lowest-energy nodes)
  at `dailyEnergy`. Derive from the same `selectFarmNodes` + `dropRate` the estimator uses:
  `min(dailyEnergy / energyCost, dailyAttempts) * dropRate` summed over the chosen nodes,
  capped at what one day's energy actually affords across nodes. Expose as
  `campaignShardsPerDay` (regular) and `campaignMythicShardsPerDay`.

Return these on the preview object; the field components read them. The picker gets the
figures as props from `goal-type-cards.tsx` (same path the current `onslaughtShardsPerRun`
prop takes).

### 4. Edit-Onslaught-progress: navigate + close, no reset

Thread an `onNavigateAway: () => void` callback from `CreateGoalSheet`
(`() => onOpenChange(false)`) through `useCreateGoalForm`'s return → `goal-type-cards.tsx` →
`AcquisitionSourceField`. The link becomes
`<Link to="/progress/onslaught" onClick={() => onNavigateAway()}>`. No `resetForm` call, so
the mounted form keeps its state; reopening the sheet shows it as-is. `use-create-goal-prefill`
already no-ops when `prefill` is unchanged, so it won't clobber the restored state.

- **Alternative rejected — router-state stash / query param:** the form already survives a
  close because the component stays mounted; persisting to the URL would be new surface area
  for no benefit.

### 5. Resources-needed token/currency lines

In `useProgressionPreview`, after `estimateGoal`, read `combined.flatSupplyBySupplier`:

- Onslaught: `contributed = bySupplier["onslaught:regular"] + bySupplier["onslaught:mythic"]`;
  `tokens = ceil(contributed / onslaughtShardsPerRun)` when `onslaughtShardsPerRun > 0`.
- Shops: for each selected offer, `purchases = ceil(bySupplier[offerId] / offer.rewardQty)`;
  `cost = purchases * offer.cost.amount`; group-sum `cost` by `offer.cost.currency`.

Return `onslaughtTokens` and `shopCurrencySpend: { currency, amount }[]`. `ProgressionPreview`
renders a line per entry (currency icon via the existing `shopCurrencyIcon`, label via the
`shops:currency.*` namespace already used in `ShopOfferRow`). New i18n keys under
`goals.create.acquisitionSources.*`: `shardsPerDay`, `onslaughtTokens`, `shopCurrencySpend`
(and adjust `onslaughtYield`). English only in this change; de/es/fr stay on the existing
translation-debt backlog.

## Risks / Trade-offs

- **Campaign shards/day is a second, simpler model of the same farming the day-loop already
  simulates** → keep it a transparent "at your daily energy, these nodes yield ≈ N/day"
  helper, documented as approximate; it is not fed back into the estimate, so it can't skew
  the day count. Cover the two-node / attempt-capped cases with unit tests.
- **`applyFlatSuppliers` signature change touches `estimate-plan.ts`** → both call sites are
  in this feature slice with direct tests; change them together and run the full
  `features/goal-farming` + `pages/goals` vitest projects.
- **Always-on Onslaught yield could read as "already applied"** even when the group is
  unchecked → the shards/day figure sits under the group header with the checkbox visibly
  unchecked, same as the current pattern; wording stays "≈ X shards/day" (a rate, not a
  total). The Resources-needed token line only appears when the group is selected.
- **`flatSupplyBySupplier` empty when the goal completes from campaign alone** → callers must
  treat a missing key as zero; `ceil(0 / y) = 0` so no spurious lines.

## Migration Plan

Pure client-side, no data migration. Ship behind no flag. Rollback = revert the commit; no
persisted state depends on it.
