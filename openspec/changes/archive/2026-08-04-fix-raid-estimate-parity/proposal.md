## Why

V2 overestimates raid energy, attempts, and duration compared with V1 because owned crafted upgrades are expanded into base ingredients before inventory is applied. Elite shard nodes are also underestimated at one shard per raid when they award one guaranteed shard plus a simultaneous probabilistic bonus. Raids Plan also places an inclusive N-day plan's completion date one day after its actual final day.

## What Changes

- Make shared goal-farming need derivation consume matching owned crafted upgrades before recursively expanding only the unsatisfied remainder into farmable base materials.
- Preserve project priority and farming-stage order when multiple goals compete for the same crafted inventory.
- Keep loose base-material inventory in the existing shared allocation path; do not treat crafted items as freely interchangeable with ingredients for unrelated recipes.
- Make plan completion dates inclusive of Today as Day 1.
- Aggregate farm-location entries that share a resource and battle so simultaneous guaranteed and probabilistic rewards contribute to one expected yield; consume a catalog-provided combined `effectiveRate` when available.
- Add focused parity regression coverage for top-level and nested crafted inventory, cross-goal priority, Today/Plan consistency, and completion dates.

## Capabilities

### New Capabilities

- `goal-farming-estimates`: Shared requirements for recipe-aware inventory consumption and inclusive calendar estimates across Goals/Insights, Today, and Raids Plan.

### Modified Capabilities

(none)

## Impact

- Affects the shared `features/goal-farming` need-derivation and scheduling code.
- Affects the Goals/Insights and Dailies callers that construct priority-ordered goal needs.
- Changes calculated base-material demand, energy, raid attempts, plan duration, and completion date where owned crafted inventory exists.
- Changes shard energy, attempt, duration, and completion estimates for nodes with simultaneous reward entries.
- Coordinates with the API catalog denormalizer while remaining backward compatible with cached catalogs that still contain separate entries.
- No persistence, route, or user-interface contract changes.
