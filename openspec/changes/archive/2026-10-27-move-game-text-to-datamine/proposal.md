# Proposal

## Why

The ability rules text (`npcAbilityText`) and the raid-boss text (`raidBoss*`) are generated from sibling checkouts: the game catalog's raw files in `tacticus-planner-api` (whose `units`, `npcs` and `equipment` folders no longer exist, so the ability generator can't run) and V1's `tacticusplanner` tables. The `add-datamine-pin` change pinned a `tacticus-planner-data-mines` commit for exactly this. This is step T1 of datamine roadmap steps 8 and 10: move both generators to the pinned datamine. The name namespaces follow in T2.

## What Changes

- `generate-ability-text-i18n.mjs` reads the referenced ability ids from the datamine's game config (`units/lineup.json` for characters and MoWs, `units/npc.json`, relic `abilityId`s in `items.json`), the tables from `units/abilities.json`, and the descriptions from `raw/languages/{en,de,es,fr}.json` (`Abilities/<id>_CurrentLevelDescription`).
- `generate-raid-boss-i18n.mjs` reads the guild-boss unit sets (union of the game's unit-set variants), the same ability tables and language files, the trait names and text (`Traits/<id>_Name`, `_StyledName`, `_Description`), and the trait constants from `globalValues.json` instead of the API's served fixture.
- Raid-boss ability names, trait names, ability rules text and trait rules text are now generated in German, Spanish and French too. Boss names stay English-only (they are derived from the unit-set ids).
- The relic icon check looks for `.webp`, the format the icons are now in.
- `apps/web/datamine/files.txt` lists the files the two generators read (16 MB).
- Both generators run from the committed pin with no sibling checkout.

## Output changes

- `npcAbilityText`: the same 434 ids in every locale and the same 4 gaps. Five abilities change text in every locale. `HammerOfWrath` gets the game's longer current wording. `Nightshroud`, `HammerOfWrath`, `LightOfSanguinius`, `LeadingTheCharge` and `SpiritualLeader` keep the game's bare `<style=Buff_…>` tags, which V1 had hand-quoted; the renderer already parses both forms.
- `raidBossAbilityText` (en): 16 of 152 files change. Their variable tables and `scaled` lists are the game's current values; the committed files came from an older V1 table. `raidBossTraitText` (en) takes the game's current `TeleportStrike` text.
- `raidBosses`, `raidBossAbilities`, `raidBossTraits` and `raidBossAbilityTextGaps` (en) are unchanged.

## Capabilities

### Modified Capabilities

- `ability-rules-text`: the source is the pinned datamine, not the catalog and V1.
- `raid-boss-library`: raid-boss ability and trait text is localized.

## Impact

- `apps/web/scripts/generate-ability-text-i18n.mjs`, `apps/web/scripts/generate-raid-boss-i18n.mjs`, `apps/web/datamine/files.txt`.
- Generated: `public/locales/*/npcAbilityText/`, `public/locales/*/raidBoss*`.
- Comments in `i18next.d.ts`, `use-raid-boss-labels.ts`, `use-raid-boss-text.ts`; the rules-text test checks the four raid-boss locales.
- No API change.
