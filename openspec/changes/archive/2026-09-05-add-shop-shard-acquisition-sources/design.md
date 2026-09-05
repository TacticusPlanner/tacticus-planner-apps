## Context

See `proposal.md` — Why. Requirements are in
`specs/goal-acquisition-source-picker/spec.md` and
`specs/goal-farming-estimates/spec.md`; this document does not restate them.

Current state that shapes the approach:

- **Source control** — Ascension only. `AscensionFarmingFields`
  (`pages/goals/ui/create-goal/goal-farming-fields.tsx`) renders a single-select
  `Campaign | Onslaught | Both` `<Select>`; `useAscensionFields` holds
  `ascensionFarmingSource`. A separate `GoalShardLocationsField` +
  `useShardLocationSelection` renders regular/mythic campaign-node checkboxes for both
  Unlock and Ascension, defaulting to the lowest-energy node per type.
- **Persisted config** — `GoalConfig` (`entities/goal/model/types.ts`) carries
  `farmingLocationIds: string[] | null` (used by Unlock for shard battle ids **and** by
  Rank/Ability for upgrade-node ids) and `ascensionFarming: { source, shardBattleIds,
mythicShardBattleIds } | null`. `buildCombinedGoalSpecs` maps the form state into these.
- **Edit sheet** — `goal-detail-edit-form.tsx` edits only `farmingLocationIds` via
  `GoalLocationsField`; it has no source control and cannot change `ascensionFarming`.
- **Estimate engine** — `features/goal-farming/lib/estimate.ts`. `estimateGoal` /
  `estimatePlan` run a day loop calling `spendDay`, which spends a day's energy against
  campaign `FarmNode`s cheapest-first, honouring each battle's `dailyAttempts` cap. Orbs,
  Onslaught, and mythic shards are explicitly "deferred fidelity, not ported". The
  create-goal preview (`use-progression-preview.ts`) runs its own parallel Onslaught token
  math and reports `combinedDays = max(campaignDays, onslaughtDays)`.
- **Shop data** — `@workspace/game-catalog` stores the `shops` dataset and exposes
  `resolveShopSlotsForDay` (permissive, per-day, grouped, no roster context needed). Each
  variant already carries typed `reward {type,qty}`, `unitId`, `cost {currency,amount}`,
  `maxPurchasesPerDay`, `weight?`, `days: ShopDayOfWeek[]`, PL bounds, and an opaque
  `lockId`. There is **no** helper that returns a unit's shard offers with a per-weekday
  probability.
- **Onslaught data** — `getOnslaughtRewards()` (game-catalog) + `onslaughtProgressQueries`
  (`entities/player-data-override`) already power `use-progression-preview`.

## Goals / Non-Goals

**Goals**

- One control component and one selection-state model shared by the create-goal sheet and
  the goal detail/edit sheet.
- One canonical per-goal "acquisition plan" structure that both the picker UI and every
  estimate consumer read, so detailed rows (per-source contribution) and the aggregate
  estimate come from the same calculation path.
- A game-catalog primitive that resolves a unit's shard offers to per-weekday,
  weight-derived probabilities, reused by the picker and the estimate.
- An `estimateGoal` / `estimatePlan` extension that folds arbitrary energy-free "flat
  per-day suppliers" (shops, Onslaught) into the existing day loop without a second code
  path.
- A persisted config shape that admits a future `Incursion` `kind` additively (#106).

**Non-Goals**

- No `Incursion` source kind, UI, or estimate wiring (that is #106).
- No change to ascension-orb need or its estimate — Onslaught does not grant orbs (its dataset
  has no orb reward field; it grants shards and forge badges only), so there is nothing to add
  or display there.
- No change to how Rank/Ability goals use `farmingLocationIds` for upgrade nodes.
- No new shop dataset fields; no change to the daily-shop-recommendations page.
- No "limit shop purchases by affordable currency" modelling — cost is shown, never gating.

## Decisions

### D1. One `AcquisitionSourceField` component + `useAcquisitionSourceSelection` model

A single controlled component under `pages/goals/ui/create-goal/` renders the group tree
(Campaigns / Onslaught / Shops) as Radix `Collapsible` sections, with the existing
`GoalShardLocationsField` reused verbatim as the Campaigns body and a new rows component for
the Shops body. `useAcquisitionSourceSelection` (in
`pages/goals/model/goal-creation-form/`) replaces `useShardLocationSelection` and absorbs
`ascensionFarmingSource`; it owns group-checked flags, the regular/mythic campaign node
sets, and the selected shop-offer ids, and exposes derived `selected{Regular,Mythic}`
node lists plus the canonical plan (D4) for previews.

The edit sheet gets a thin adapter that seeds the same model from `GoalConfig` and writes
back through the edit mutation, so `goal-detail-edit-form.tsx` renders the identical
control for Unlock/Ascension goals.

_Alternatives:_ keep two components (dropdown + checklist) and just add a third for shops —
rejected: the spec requires a single multi-select where any combination is valid, and three
independently-wired widgets re-introduce the "Both" ambiguity. Put the model in `entities/`
— rejected: it is creation-form state, not a domain entity, and only two sibling UIs
consume it.

### D2. Group visibility derived, not stored

Each group renders iff it can contribute (spec: _A source group is shown only when it can
contribute_). Campaigns: unit has ≥1 shard node of a needed type (already computed in
`useShardLocationSelection`). Onslaught: `entityType === "Character" && ascensionEnabled`.
Shops: the D3 resolver returns ≥1 offer of a needed shard type. Visibility is recomputed
from live queries each render; it never gates what is _persisted_ (a saved selection for a
briefly-unavailable group is retained — spec: _selection retained during data load_).

### D3. `resolveUnitShardShopOffers` in `@workspace/game-catalog`

New pure resolver in `packages/game-catalog/src/shops/shop-resolve.ts`, exported from the
package index:

```
resolveUnitShardShopOffers(shops, unitId, { powerLevel?, lockContext? }) =>
  ShopShardOffer[]

ShopShardOffer = {
  offerId: string            // `${shopId}:${rewardType}` — stable, slot-position-independent
  shopId: string
  rewardType: string         // `shards_<unitId>` | `mythicShards_<unitId>`
  isMythic: boolean
  rewardQty: number
  cost: { currency: string; amount: number }
  maxPerDay: number
  days: ShopDayOfWeek[]                       // union of contributing variants' days
  probabilityByDay: Partial<Record<ShopDayOfWeek, number>>  // 0..1, see below
}
```

For each shop/slot/day it reuses the existing day + permissive PL/lock filter, groups
day-matching variants by reward type, and for the bucket matching the unit computes
`probabilityByDay[d] = Σ weight(unit bucket) / Σ weight(all day-matching buckets)` (missing
`weight` ⇒ 1). A single day-matching bucket ⇒ `1` (guaranteed). If the same unit's shards
appear in more than one slot of one shop, the entries are merged by `offerId` (days unioned,
per-day probabilities summed and clamped to 1).

_Alternatives:_ extend `ResolvedShopSlot.offers` with a `weight` field and make callers do
the per-day maths — rejected: every caller (picker, estimate, tests) would re-implement the
same normalization. Use `resolveShopOffersForToday` (strict, single-day) in a 7× loop —
rejected: it needs a real `lockContext`/roster and drops "possible" variants the goal
planner explicitly wants to keep at reduced probability.

### D4. Canonical `GoalAcquisitionPlan`, consumed by both UI and estimate

The selection model produces one structure:

```
GoalAcquisitionPlan = {
  campaign: { enabled: boolean; regularBattleIds: string[]; mythicBattleIds: string[] }
  onslaught: { enabled: boolean }                    // Ascension + Character only
  shops: { enabled: boolean; offers: ShopShardOffer[] }  // only the selected offerIds
}
```

The picker renders its rows from this; `use-progression-preview` and every page-level
estimate consumer build their `estimateGoal` inputs from it. Per the schema rule (_one
canonical result structure_), per-source contribution numbers shown in the UI are read back
from the estimate's breakdown (D5), not recomputed.

### D5. `estimateGoal` / `estimatePlan` gain `flatSuppliers`

New optional input:

```
flatSuppliers?: Array<{
  resourceId: EstimateResourceId
  supplyOnDay: (dayIndexFromReference: number) => number   // 0-based; maps to weekday via referenceDate
}>
```

The day loop, before each `spendDay`, subtracts `min(supply, remaining)` per supplier
resource and records it in a `flatSupplyTotal` breakdown alongside `energyTotal` /
`raidsTotal`. `spendDay` itself is untouched. A shard need that has **no** campaign nodes
(Campaigns group unselected) but **is** covered by a flat supplier must not `blocked(...)`
— `estimateGoal` special-cases "no nodes but a flat supplier exists for this resource" as
estimable. Weekday cursor = `(referenceDate.getUTCDay() + dayIndex) % 7` mapped through the
package's `DOW_MAP`.

- **Shop supplier:** `supplyOnDay(i)` = `offer.rewardQty * offer.maxPerDay *
(offer.probabilityByDay[weekday(i)] ?? 0)` — the spec's expected-value rule, including
  rotating-slot probability, in one place.
- **Onslaught supplier:** constant every day = `avgShardsPerRun(progress, rarity) *
runsPerDay` where `runsPerDay = 1.5` and `avgShardsPerRun` is the existing
  `onslaughtReward` mean. This replaces `use-progression-preview`'s `max(campaignDays,
onslaughtDays)`; that function becomes a thin consumer of the unified estimate.

_Alternatives:_ pre-compute a lump-sum supply and subtract once before the loop — rejected
and called out in the spec: supply is a per-day rate whose total depends on the run length,
which depends on the campaign contribution (circular). A separate "shop/onslaught estimate"
returning its own day count, then `min`/`max` combined — rejected: same parallel-model flaw,
and it cannot express "campaign covers the weekday gaps a shop can't".

### D6. Persisted config: open `acquisitionSources` set (companion API change)

Replace `ascensionFarming.source` and the shard use of `farmingLocationIds` with:

```
GoalConfig.acquisitionSources: Array<{ kind: string; ids: string[] }> | null
```

- `kind` allow-list (API-validated, growable): `"Campaign"`, `"Onslaught"`, `"Shop"`.
- `ids`: Campaign ⇒ battle ids (regular + mythic together; the client re-splits by the
  catalog's `isMythic`); Shop ⇒ `offerId`s; Onslaught ⇒ `[]`.
- Absent/`null` ⇒ treated as `[{ kind: "Campaign", ids: [] }]` (unrestricted campaign) so
  untouched goals keep today's behaviour.
- `farmingLocationIds` **stays** for Rank/Ability upgrade-node selection; only its
  Unlock/Ascension shard role moves.
- `ascensionFarming` is removed outright in the same coordinated release (D7).

The companion `tacticus-planner-api` OpenSpec change `add-goal-acquisition-sources-config`
(delta on `goal-target-model`) owns: the request/response model + validation (`kind`
allow-list, `ids` shape per kind, entity/goal-type gating), OpenAPI regen, and a one-way
data migration (`Campaign` from `ascensionFarming.shardBattleIds ∪ mythicShardBattleIds` or
Unlock `farmingLocationIds`; `Onslaught` when `source ∈ {Onslaught, Both}`; `[{ kind:
"Campaign", ids: [] }]` when neither). This repo's hand-written goal types are edited to
match (no codegen).

_Alternatives:_ fixed columns `shopOfferIds` / `onslaughtEnabled` next to the old enum —
rejected in the proposal: adding `Incursion` would then be another schema break, and the
enum drifts from the real multi-select. A client-only local override store — rejected: the
selection must round-trip with the goal for every device and every estimate consumer.

### D7. Coordinated single-release cutover

Per the api companion's DA4: V2 is pre-production with one coordinated deploy, so there is
**no** additive/dual-read phase.

1. API change: replace `ascensionFarming` + the Unlock shard role of `farmingLocationIds`
   with `acquisitionSources`; one-way migration (`Down` throws); regenerate OpenAPI.
2. Client change (this repo), landing in the same release: edit the hand-written goal types,
   then ship the resolver (D3), estimate `flatSuppliers` (D5), selection model + control
   (D1), edit-sheet wiring, tour (D8), i18n.

Rollback: restore a database backup (the migration is one-way) and revert both repos to the
prior release together.

### D8. Create-goal sheet onboarding tour

No tour covers the create-goal sheet today. Add `create-goal-sheet.tutorial.tsx`
(`useCreateGoalSheetTutorial`, `useTourPageSteps`, desktop + mobile step sets), registered
while the sheet is open, with one step now targeting
`[data-testid="create-goal-acquisition-sources"]`. `tour.createGoal.steps.*` i18n keys
added across locales.

_Alternative:_ bolt a step onto `goals-page.tutorial.tsx` — rejected: its steps target
board elements and cannot point into an unopened sheet.

### D9. Desktop vs mobile

One component; the split is presentational. Mobile (`<768px`): groups are
`Collapsible` and start collapsed; the Onslaught yield panel and shop rows are dense
single-column. Desktop (`≥768px`): groups start expanded; shop rows may use a two-column
grid. Same `data-testid`s, same options, same selection on both (spec: _Desktop and mobile
present the same sources_). Joyride target is identical on both step sets.

## Risks / Trade-offs

- **Rotating-slot probability is an approximation** → the estimate can be optimistic or
  pessimistic for a player who refreshes the shop or whose `current`/`next` rotation differs
  from the 50/50 assumption. Mitigation: the picker row shows the assumed weekdays and
  chance (spec) so the number is legible as an estimate, and the game-catalog resolver
  centralizes the maths for later refinement.
- **`offerId = ${shopId}:${rewardType}`** assumes a unit's shards occupy one slot per shop.
  If a future dataset puts them in two slots of one shop, D3 merges them under one id — a
  saved selection stays valid, but the two slots can't be toggled independently. Accepted;
  revisit only if the data does this.
- **Onslaught cadence constant (1.5 runs/day)** → wrong for players who bank or skip runs.
  Mitigation: same figure V1 and the current preview use; not a regression.
- **Cross-repo change** → client depends on the API field existing. Mitigation: both OpenSpec
  changes land in one coordinated release (D7); the client still guards
  `acquisitionSources == null` as unrestricted campaign.
- **Count-only shard needs now get a completion date** (a flat supplier can complete a need
  with zero campaign nodes) → previously these showed no estimate. This is an improvement
  but changes output for such goals; call out in the change's verification.
- **`estimatePlan` flat suppliers across a shared project** → a shop offer for a unit needed
  by two goals must not be double-counted. Mitigation: flat suppliers are keyed by
  `resourceId` and consumed in the same priority order as inventory (D5 subtracts against
  the shared `remaining` map), mirroring `allocateInventory`.

## Migration Plan

Single coordinated release (D7):

1. `tacticus-planner-api` `add-goal-acquisition-sources-config`: model + validation + one-way
   data migration + OpenAPI regen.
2. This client change, same release: edit the hand-written goal types, then resolver (D3),
   estimate `flatSuppliers` (D5), selection model + control (D1), edit-sheet wiring, tour
   (D8), i18n.
3. Verify parity: a goal migrated from `source: "Both"` opens with Campaigns + Onslaught
   selected and the same estimate; a `Campaign`-only goal's numbers are unchanged.

Rollback: restore a database backup and revert both repos to the prior release together (the
migration is one-way by design).

## Open Questions

- Exact `data-testid` names for the group headers and shop rows (naming only; does not
  affect specs, approach, or task breakdown).
- Whether the Onslaught yield panel shows a single blended shards/run figure or separate
  regular vs mythic lines when an Ascension range crosses the Mythic tier — presentation
  detail, resolvable during implementation against the existing preview copy.
