## Why

Exact Meta readiness still leaves most players with a list of teams they cannot field. Explicit replacement rules can turn those gaps into deterministic, realistic playable variants without introducing speculative damage or synergy scoring.

## What Changes

- Extend Guild Raid recommendation matching to assign owned replacements to missing ideal slots using authored rule order and unique-unit constraints.
- Classify recommendations as Ready, Playable Variant, Partial, or Unavailable using explicit essential-slot and Machine-of-War rules.
- Show the ideal Meta team beside the recommended owned variant, including each replacement mapping, role, and concise reason.
- Prefer fewer substitutions, then authored recommendation/rule order; use current investment only to choose between otherwise equivalent allowed owned candidates.
- Recompute when boss context, player roster, or Meta rules change and handle no viable team explicitly.
- Add responsive UI, localized copy, tutorial updates, and deterministic matching tests.
- Defer expected-effectiveness estimates, damage prediction, synergy/performance scoring, global ranking, multi-token sequencing, and cross-attack character locking.

## Capabilities

### New Capabilities

- `dailies-guild-raid-playable-variants`: Defines deterministic roster-achievable variants, four-state readiness, replacement explanations, and non-scored ordering.

### Modified Capabilities

None.

## Impact

- Affects the Guild Raid recommendation domain/entity logic, Dailies Guild Raids UI, player roster integration, i18n, tutorial steps, and tests.
- Depends on `add-guild-raid-exact-meta-readiness` and `add-guild-raid-variant-rules`.
- Reuses player investment data only as a narrow tie-break and does not extend the generic Dailies team engine with advanced scoring.
