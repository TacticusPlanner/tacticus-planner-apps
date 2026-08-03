## Context

The shared `features/goal-farming` slice currently converts required rank and MoW Ability upgrade ids directly into base-material counts. Loose inventory is allocated afterward by exact resource id. Because a crafted inventory id no longer exists after expansion, owned crafted upgrades cannot reduce the calculated base demand. See `proposal.md` for the observed V1/V2 drift and `specs/goal-farming-estimates/spec.md` for the required behavior.

Goal needs are derived in priority order by both Dailies and Goals/Insights, and some goals are split into ordered farming stages. Today, Bonus Raids, and Raids Plan already consume one canonical schedule result. Completion dates are currently calculated in more than one engine path by adding the full day count to the reference date.

Elite shard battles can list the same shard once as guaranteed and again as a probabilistic bonus. The current estimator turns each catalog entry into an alternative farm node and selects the guaranteed `1` yield, losing the simultaneous `0.079` bonus.

## Goals / Non-Goals

**Goals:**

- Preserve crafted upgrade identity until matching inventory has been consumed.
- Apply one recipe-aware inventory policy to Rank and MoW Ability needs in every shared-engine consumer.
- Keep the existing base-material allocation and day scheduler unchanged after corrected needs are produced.
- Centralize inclusive completion-date math so detailed outcomes and plan summaries cannot drift.
- Treat all reward occurrences for the same resource and battle as one raid yield, including both new combined catalog locations and legacy split cached locations.

**Non-Goals:**

- Reproduce V1's global campaign filters, Home Screen Event ordering, completed-raid tracking, or other settings that V2 does not model.
- Convert crafted inventory into freely spendable base ingredients.
- Change energy budgeting, attempt caps, routes, or presentation beyond correcting simultaneous-reward yield calculation.

## Decisions

### Consume crafted inventory during requirement expansion

Add a recipe-aware expansion operation to `features/goal-farming` that accepts required upgrade ids, the upgrade catalog, and a mutable inventory-count map. For each required id:

1. Remove already-applied rank-slot ids before inventory consideration.
2. If the id is crafted and matching inventory is available, decrement that exact inventory id and stop expanding that copy.
3. Otherwise recursively visit its recipe, applying the same matching-inventory check at each crafted level.
4. Aggregate only leaf/base materials from the unsatisfied branches.

The caller creates one mutable crafted-inventory pool from the inventory snapshot before iterating ordered goals. It passes the same pool through each goal and each ordered stage. Loose base-material inventory remains untouched during expansion and continues into `allocatePlanInventory`, which preserves its existing priority behavior.

This operation belongs inside `features/goal-farming`; pages pass data into its public API and do not implement their own recipe traversal.

**Alternative considered:** recursively expand all crafted inventory into base-material credit. Rejected because that effectively decrafts owned items and lets an unrelated need consume their ingredients, unlike V1 and the specified behavior.

**Alternative considered:** keep already-expanded needs and infer which crafted inventory could have produced them. Rejected because base totals lose recipe provenance and cannot distinguish a matching crafted requirement from an unrelated demand for the same ingredient.

### Treat an empty staged derivation as resolved

Recipe-aware consumption can fully cover a stage, leaving its derived base needs empty. The derivation contract SHALL distinguish "this goal type has staged requirements and all are covered" from "this goal type does not use staged derivation." Callers must not fall back to a second non-staged derivation after an empty staged result, because doing so would consume inventory twice or recreate the ingredients that were just satisfied.

### Use one completion-date helper

Add a pure shared helper that returns the reference date for zero or one required day and otherwise adds `days - 1`. Use it for isolated goal estimates, per-goal outcomes from combined plans, and the whole-plan summary. Day arrays and aggregate totals remain the canonical scheduling result; dates are derived from their day count rather than maintained independently.

**Alternative considered:** adjust only the Raids Plan UI. Rejected because the underlying `EstimateOutcome.date` values would retain different calendar semantics and other consumers could continue displaying a one-day offset.

### Validate parity with focused fixtures

Tests will freeze small catalogs and inventory snapshots that isolate:

- top-level crafted ownership;
- nested crafted ownership;
- two goals competing by priority;
- two stages competing in order;
- a crafted item whose ingredients are needed elsewhere but whose exact item is not required;
- one-day, multi-day, and zero-day completion dates;
- Today as exactly Day 1 of the full Plan.

A compact Neurothrope/Ahriman/Abraxas-style integration fixture will assert that corrected derived demand feeds the same schedule consumers, without embedding the user's private player data.

### Aggregate farm candidates by battle before efficiency selection

Interpret a location's explicit `effectiveRate` before the guaranteed fallback so a consolidated guaranteed-plus-bonus location can carry a rate above one. While building candidates for one resource, group locations by battle id and sum their resolved rates. The resulting `FarmNode` remains unique per battle, so efficiency selection and daily-attempt accounting operate on the actual raid choice.

This deliberately supports both catalog generations: the corrected API emits one `1.079` location, while an IndexedDB cache may temporarily contain separate `1` and `0.079` locations. Both produce the same node and schedule without requiring users to clear storage.

## Risks / Trade-offs

- **[Risk]** Mutating one inventory pool makes order significant. **Mitigation:** construct it once immediately before already-defined priority-ordered goal iteration, thread it explicitly through stages, and cover both order dimensions with tests.
- **[Risk]** Applied rank slots and crafted inventory could both satisfy the same requirement. **Mitigation:** remove applied slot occurrences from raw required ids before consuming loose inventory.
- **[Risk]** A fully covered stage could trigger fallback derivation and recreate demand. **Mitigation:** represent staged applicability separately from stage length and add a fully-covered regression test.
- **[Risk]** Corrected demand changes existing snapshots and completion dates. **Mitigation:** treat affected expectations as correctness updates, run the full shared-engine and consumer suites, and report before/after parity totals in the PR.
- **[Risk]** Duplicate entries that are alternatives rather than simultaneous rewards could be summed. **Mitigation:** aggregate only entries for the same resource already being estimated and the same battle id; raw catalog semantics define repeated occurrences in one battle as simultaneous rewards.

## Migration Plan

No persisted data migration is required. Deploy the calculation change with tests; rollback is a normal code revert because stored goals, inventory, and catalog records are unchanged.
