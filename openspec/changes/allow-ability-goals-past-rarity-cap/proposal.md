## Why

UserJot request "Allow Editing Goals Beyond Rarity Caps": V1 let owners create and edit goals past a unit's rarity cap. In V2 the creation form switches off the Ability goal type once both ability tracks reach the cap of the unit's current rarity (for example 50/50 on a Legendary unit), even though an Ability target above the cap is already supported through the auto-suggested Ascension prerequisite. The companion API change (`allow-ability-edits-past-rarity-cap` in `tacticus-planner-api`) lifts the same cap from target edits.

## What Changes

- The creation form treats the Ability goal type as unavailable only when both tracks are at the highest ability level (60), not at the current rarity's cap. A target past the cap gets the existing Ascension suggestion.
- The "abilities maxed" message no longer mentions the current rarity.
- Rank, Ascension and Upgrade are unchanged: they were never limited by rarity in creation or editing.

## Capabilities

### Modified Capabilities

- `goal-creation`: when the Ability goal type is unavailable.

## Impact

- `goal-planning/model/shared/goal-validation.ts` (`isAtMaxAbility`), its two callers in `goal-create`, and the `abilityMaxed` text in en/de/es/fr.
