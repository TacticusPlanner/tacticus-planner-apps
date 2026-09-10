## Why

The client cannot safely infer substitutions from the existing Comp pools because the curated exact teams and broad Comp membership are not strict replacements for one another. It needs a validated local representation of explicit authored slot rules before generating playable variants.

## What Changes

- Extend the client schema and record types with stable recommendation ids, five slot rules, role ids, essential flags, ordered replacement character ids, and ordered Machine-of-War replacements.
- Preserve and expose the authored rule ordering through reactive catalog queries.
- Resolve role labels and all unit presentation on the client while retaining readable fallbacks for unknown ids.
- Distinguish an absent rules dataset from a recommendation that validly has no replacement for a slot.
- Update sync, persistence-upgrade, schema, and presentation tests for the expanded contract.
- Exclude matching, Playable Variant generation, investment-aware choice, effectiveness, and scoring from this catalog-contract slice.
- Coordinate the matching `add-guild-raid-variant-rules` API change; the API side applies first.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `guild-raid-meta-catalog`: Adds explicit, queryable slot-level variant rules and client-side role presentation to the synced Meta contract.

## Impact

- Affects `packages/game-catalog`, IndexedDB catalog records/upgrades, the guild-raid-meta entity presentation boundary, and catalog tests.
- Consumes the expanded `guild-raid-meta` payload from the companion API change.
- Prepares data for `add-dailies-guild-raid-playable-variants` without changing visible recommendations by itself.
