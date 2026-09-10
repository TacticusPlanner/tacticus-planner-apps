## Why

V2 already syncs boss-specific exact Meta teams, but players cannot yet see whether those reference lineups match their own roster. An exact-readiness slice delivers immediate value while keeping substitution rules and performance scoring separate and reviewable.

## What Changes

- Match the active boss to its authored exact Meta and alternate recommendations.
- Compare each exact five-character lineup and Machine of War against the current player's synced roster.
- Classify exact readiness deterministically as Ready, Partial, or Unavailable and report owned and missing units without inventing replacements.
- Display the ideal lineup, Comp attribution, roster gaps, and source/update attribution in authored order.
- Handle absent catalog data, no recommendations for the boss, missing player roster data, and no buildable exact team distinctly.
- Add desktop/mobile presentation, localized copy, tutorial coverage, and focused matching tests.
- Defer Playable Variant classification, substitutions, investment comparison, effectiveness, ranking, and strategy scoring.

## Capabilities

### New Capabilities

- `guild-raid-exact-meta-readiness`: Defines boss-specific exact-lineup matching and non-scored readiness presentation against the player's roster.

### Modified Capabilities

None.

## Impact

- Affects the Guild Raids Dailies page, guild-raid-meta entity logic, player roster queries, responsive recommendation UI, i18n, tutorial steps, and tests.
- Depends on `add-dailies-guild-raid-status` and the existing `guild-raid-meta-catalog` capability.
- Does not require an API change because exact Meta data and player roster data already exist client-side.
