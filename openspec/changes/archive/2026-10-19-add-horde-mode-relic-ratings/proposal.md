## Why

The `horde-mode-tiers` dataset gains relic-conditional multipliers (companion API change **`add-horde-mode-relic-ratings`** in `tacticus-planner-api`, which applies first): a character holding a specific Mythic relic is rated higher than one without it. The client has to apply that rating where the roster has the relic equipped and show it on the Tier List.

## What Changes

- Parse `relics` on `horde-mode-tiers` characters in `@workspace/game-catalog`.
- A unit's horde-mode multiplier becomes roster-aware: its relic multiplier while that relic is in its synced `equippedItems`, else its base multiplier. Clear estimates, goals preview, team suggestions and upgrade impact all read it through the one shared lookup.
- Goals preview keeps synced items, so a relic counts there exactly as it does in clear estimates.
- Tier List: a tile with relic ratings gets a relic mark; tile details list each relic (localized name), its multiplier, and whether the synced roster has it equipped. The tile's main multiplier stays the base one, so the ranking does not depend on the viewer's roster.
- New strings `tierList.details.relic`, `tierList.details.relicEquipped`, `tierList.details.relicNotEquipped`, `tierList.relicMark` in en, de, es and fr. The relic mark is added to the tile's accessible name.

Depends on **`revise-horde-mode-tier-list`** (archived). Built in the same PR as **`add-horde-mode-strategy-notes`** (Severyn, 2026-10-19), after it; the relic advice text stays in that change's Strategy section.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `legendary-event-clear-estimates`: the multiplier honours an equipped relic.
- `legendary-event-tier-list`: relic mark and relic details.

## Impact

- `packages/game-catalog/src/schemas/horde-mode-tiers.ts`, `entities/legendary-event/lib/horde-tier-list.ts`, `lib/clear-estimate.ts` and their callers, the Tier List tile and details, locales, fixtures and tests.
