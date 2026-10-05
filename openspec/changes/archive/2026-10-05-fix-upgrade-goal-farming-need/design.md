## Context

Every estimate consumer funnels goals through `calculateGoalFarmingStages` and
`calculateGoalResourceNeed`; `calculateDailyRaids` iterates goals in global-priority order and
skips a goal when both return `null`. Upgrade goals fall through both. Rank and Ability goals
avoid double-charging via per-unit coverage state created in `daily-raids-calc.ts`
(`UnitCoverage`: `rankSlots`, `coveredAbilityTransitions { primary, secondary }`). Companion API
change: `fix-upgrade-goal-farming-need` (persists the range).

## Goals / Non-Goals

**Goals:** Upgrade goals appear in every planner view in priority order; overlapping Rank/Ability
demand is not charged twice; legacy goals unchanged.

**Non-Goals:** stages/milestones for Upgrade goals; crafted-upgrade targets (the picker offers
base upgrades only); changing relevance rules; Pre-Farm goals.

## Decisions

1. **One `Upgrade` branch in `calculateGoalResourceNeed`; stages stay `null`.** Callers already
   fall back to it when stages are `null`. The need is the targets as base upgrades
   (`aggregateBaseUpgrades`), `shardId: null`, no shards/orbs, `upgradeSlotsRemaining: null`.
   Inventory is **not** deducted in the branch: loose inventory is netted afterwards by the existing
   priority-ordered allocation, so Rank and Upgrade goals share stock in priority order.
2. **Global priority is respected.** No special ordering for Upgrade goals.
3. **Slot-level de-duplication, not material-level.** For an Upgrade goal with a range and target
   `(m, q)`:
   - collect the slots of material `m` inside the range (character: `rankUpSlotOccurrences` over
     the rank range; MoW: transition levels per track via the recipe rows);
   - `overlap` = those slots already in the unit's covered set (claimed by an earlier goal);
   - `need(m) = q - min(q, overlap)`;
   - then claim up to `q` of those slots into the covered set so a later Rank/Ability goal sees
     them covered.
     Claiming is symmetric: processing order changes who shows the demand, not the total.
     Only slots a goal actually charged are claimed, so slots the player already applied never count
     as overlap.
4. **Cap at the stockpile quantity.** The deduction never exceeds `q`, so an Upgrade goal can never
   remove more demand than it holds.
5. **No range ⇒ additive.** `null` range groups skip steps 3–4 entirely (all pre-existing goals,
   and any MoW track left blank).
6. **Persisted shape** (from the API change): `rankRange {start,end}` for a Character;
   `activeRange`/`passiveRange {start,end}` for a MoW. Client types in `entities/goal`.
7. **Owning FSD slice.** The Upgrade need and the claiming helper live in
   `features/goal-farming` (public API `goal-farming/index.ts`, plus the existing
   `@x/daily-raids` cross-slice export). Pages and `daily-raids` consume it through that API;
   no page-to-page or feature-to-feature imports.
8. **Desktop vs mobile.** No behavioural difference: the range selectors reuse the Upgrade card's
   existing layout in the create dialog (desktop) and sheet (mobile); the planner views are
   unchanged in structure. Verified on both, but no split requirements.
9. **Tutorial.** The Upgrade card is not a tour target today, so no tutorial change is made;
   re-check when implementing.

## Risks / Trade-offs

- A range-less Upgrade goal still double-counts with a Rank goal → accepted; additive is the
  legacy-safe behaviour and the user can edit the goal to add a range.
- MoW transition indexing relies on the recipe-row ↔ level mapping used by
  `mowAbilityUpgradeIds`; the claiming helper reuses that function rather than re-deriving it.
- Cross-repo ordering: ship the API first; until then the client must treat missing range fields
  as `null`.

## Migration Plan

No data migration. Existing goals read as range-less. Rollback = ignore the range fields.

## Open Questions

None blocking.
