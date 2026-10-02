## Context

See proposal.md for motivation. Relevant current state:

- **Offers.** `packages/game-catalog/src/shops/shop-resolve.ts` `resolveUnitShardShopOffers`
  walks every shop slot × weekday, computes each variant's per-day probability, and returns
  `ShopShardOffer` (`offerId = <shopId>:<rewardType>`) — filtered to one unit's `shards_*` /
  `mythicShards_*` rewards. Mythic materials appear in the same slots as plain reward ids
  (`upgHpM001..004`) in the `guild`, `crusade`, and `rogue-trader` shops.
  `MYTHIC_UNCRAFTABLE_UPGRADES` already lists the four ids.
- **Locks.** `resolveEventLockId` resolves `lock_crusade_shop_owns_unit_at_mythic` from
  `lockContext.starsByUnitId`; with an empty context it evaluates to _not owned_ and hides every
  Crusade Mythic-material offer. Unrecognised locks (the Rogue Trader event lock) default to shown.
- **Estimator.** `FlatSupplier { key, resourceId, supplyOnDay }` is resource-agnostic
  (`EstimateResourceId` includes `UpgradeId`). `applyFlatSuppliers` applies a goal's suppliers to its
  current stage each day; `estimatePlan` calls it per goal in priority order with no cross-goal
  limit. `classifyNeed` already treats a need with a supplier as not blocked.
- **Acquisition wiring.** `features/goal-farming/lib/goal-acquisition.ts` `computeGoalAcquisition`
  is the single place Today/Raids Plan (`daily-raids-calc.ts`) and Goals/Insights
  (`plan-insights-calc.ts`) turn a goal's `acquisitionSources` into suppliers. It returns
  `acquisitionSources = null` for every goal type except Unlock/Ascension, and
  `daily-raids-calc.ts` uses that to choose between `campaignSource.ids` and
  `config.farmingLocationIds` for campaign overrides.
- **Plan schedule.** `ShopScheduleEntry { goalId, offerId, expectedShards }` →
  `plan-day-cells.ts` → `plan-shop-purchases.tsx`, which resolves offers through a
  `shopOffersById: Map<string, ShopShardOffer>`.
- **UI.** `pages/goals/ui/create-goal/acquisition-source-field.tsx` exports `ShopOfferRow`
  (shard-offer row with rotating-slot indicator and ≈ shards/day). Rank, Upgrade, and Ability cards
  live in `goal-type-cards.tsx`; edit fields in `goal-edit/goal-edit-fields.tsx`.
- **API.** Companion `tacticus-planner-api` change `add-mythic-material-shop-sources` accepts
  `[{ kind: "Shop", ids: ["<shopId>:upgHpM00x", ...] }]` on Character Rank, Character/MoW Upgrade,
  and MoW Ability goals; `null` stays `null`; `[{ Shop, [] }]` round-trips.

## Goals / Non-Goals

**Goals:**

- One offer resolver, one supplier projection, and one acquisition entry point for both shard and
  Mythic-material offers.
- Correct account-wide shop capacity in every plan-based surface.

**Non-Goals:**

- Extremis event campaign drops (stay on the campaign/event-eligibility path).
- Legendary or other shop-sold materials (only the four Mythic ids).
- Modelling currency budgets (cost never blocks an estimate, as today).
- Changing Dailies › Shops recommendations (`daily-shop-recommendations`), which already list
  Mythic-material purchases from goal needs independently.

## Decisions

### 1. Generalize the offer resolver by reward predicate (game-catalog)

Extract the slot × weekday × probability walk from `resolveUnitShardShopOffers` into an internal
`resolveShopRewardOffers(shops, matches: (variant) => boolean, options)` returning
`ShopRewardOffer { offerId, shopId, rewardType, rewardQty, cost, maxPerDay, days,
probabilityByDay }`. `ShopShardOffer` becomes `ShopRewardOffer & { unitId, isMythic }` and
`resolveUnitShardShopOffers` a thin wrapper (unchanged output). Add exported
`resolveMythicMaterialShopOffers(shops, materialIds, options)`.
_Alternative:_ a parallel copy for materials. Rejected: two probability implementations drift.

### 2. Callers must pass roster lock context

Mythic-material resolution is called with `lockContext.starsByUnitId` built from the player's
synced roster (characters and MoWs), so the Crusade lock resolves correctly. Without roster data
(still loading) the control shows its loading state rather than resolving with an empty context,
which would silently drop the Crusade offer. Shard resolution is left as-is.

### 3. One acquisition entry point; a separate output for material suppliers

`computeGoalAcquisition` takes the goal's needed upgrade ids (from the stage needs / need already
computed by its callers) plus the roster lock context and, for Character Rank, Upgrade, and MoW
Ability goals:

```
neededMythic = needIds ∩ MYTHIC_UNCRAFTABLE_UPGRADE_IDS
offers       = resolveMythicMaterialShopOffers(shops, neededMythic, { lockContext })
shopSource   = config.acquisitionSources?.find(kind == "Shop")
used         = config.acquisitionSources == null ? offers                     // default: all
             : offers.filter(o => shopSource?.ids.includes(o.offerId))       // explicit
-> flatSuppliers += used.map(projectShopSupply)   // resourceId = rewardType (the upgrade id)
-> shopOffers    += used
```

The existing `acquisitionSources` return value stays `null` for these goal types, so
`daily-raids-calc.ts` keeps using `config.farmingLocationIds` for their campaign override with no
change. Default-all logic lives only here (plus the UI's display of it, which reuses the same
resolver); it is never written to the goal.
_Alternative:_ materialize the default at create time. Rejected by the user decision: existing
goals must benefit and new offers should flow in automatically.

`projectShopSupply` derives `resourceId` from the offer: `shard:` / `mythic-shard:` for shard
rewards, the upgrade id itself for a Mythic material.

### 4. Shared per-offer capacity in `estimatePlan`

Shop suppliers already carry `shop` and use the offer id as `key`, so a supplier with `shop` set is
pooled by `key`; Onslaught suppliers (no `shop`) keep per-goal behaviour. `estimatePlan`'s day loop
keeps `offerSupplyUsed: Map<key, number>` beside `attemptsUsedByBattle`, reset each day, and passes
it to `applyFlatSuppliers`, which caps each shop supplier at `supplyOnDay(day) − used(key)` and
records what it took. Goals are already iterated in
canonical priority order, so priority consumption falls out of the loop. `estimateGoal`
(single-goal preview) passes no pool and is unchanged.
This mirrors the existing per-battle attempt cap rather than adding a pre-allocation pass.
_Alternative:_ pre-split each offer's weekly supply across goals. Rejected: needs its own priority
logic and breaks once a higher goal finishes mid-week.

Shard offers also go through the pool. That only changes results when two goals of the same unit
(Unlock + Ascension) select the same offer — today that double-counts; after, it is correct.

### 5. One canonical schedule record

`ShopScheduleEntry.expectedShards` becomes `expectedAmount` (plus the existing `offerId`); the
Raids Plan resolves the offer from `shopOffersById: Map<string, ShopRewardOffer>` and renders
material art for a Mythic-material reward or the unit portrait + shards for a shard reward. The
per-day entries are still derived from the same per-supplier attribution that produces totals,
spend, and the preview lines (no second calculation path).

### 6. UI: one control, owned by the goals page

`pages/goals/ui/create-goal/mythic-material-source-field.tsx` renders, per needed material, a
section of offer rows reusing a generalized `ShopOfferRow` (accepts `ShopRewardOffer`; shows the
material icon/name via the existing upgrade icon helper, and "≈ X per day"). State lives in a
`pages/goals/model` hook shared by create and edit (same page slice, no cross-page import):
draft `materialShopIds: string[] | null` where `null` = default. The first toggle materializes the
currently listed offers, then toggles. Submission: create omits `acquisitionSources` while `null`;
edit sends `[{ kind: "Shop", ids }]` only when the draft changed (the API treats a missing field as
unchanged). Needed materials come from the same need derivation the cards' previews already run.
The control is rendered in the Rank, Upgrade, and (MoW only) Ability cards and in
`goal-edit-fields.tsx` for the same kinds.

### 7. Desktop / mobile and tour

Same split as the shard picker: below 768px each material is a collapsible section (collapsed
when it has more than one offer), at or above 768px expanded. Both forms use one
`data-testid="goal-mythic-material-sources"` target, so desktop and mobile tour steps share a
selector. A step is added to `create-goal-sheet.tutorial.tsx` and `goal-edit-dialog.tutorial.tsx`
for both step sets; like the existing acquisition-source step, it relies on Joyride skipping a
step whose target is not rendered.

### 8. Blocker text

No change: once an offer supplies a material, `classifyNeed` stops reporting it; an opted-out
goal keeps the existing `NoFarmLocation` reason.

## Risks / Trade-offs

- [Rotating-slot expected values are fractional] → The schedule shows fractional expected
  purchases on Sat/Sun (e.g. 0.25), as it already does for rotating shard offers.
- [Default-all assumes the player spends Guild, crusade, and Elder currency] → The preview shows
  the currency spend, and the control makes opting out a single uncheck.
- [Lock evaluated against the current roster] → An offer unlocked later (first blue-star unit)
  joins the default automatically; an explicit selection does not pick it up, as with shard offers.
- [Shared pool changes same-unit Unlock+Ascension double counting] → Intended correctness fix;
  covered by a regression test.

## Migration Plan

Apply the API companion first. No data migration: goals with `null` immediately use the default.
Rollback: revert the apps change; persisted `Shop` entries on Rank/Upgrade/Ability goals are then
ignored by the estimator (it only reads them for Unlock/Ascension).
