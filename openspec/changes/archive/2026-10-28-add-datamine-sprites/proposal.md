# Proposal

## Why

The catalog images in `apps/web/public/game_catalog/` were copied out of the V1 `tacticusplanner` checkout and converted to WebP by hand. Since `add-datamine-pin`, the apps pin a `tacticus-planner-data-mines` commit whose `sprites-webp/` folder holds WebP q82 copies of every game sprite. About 2,050 of today's images are game sprites with the same file name there, so they can come straight from the pin.

This is step S1 of datamine roadmap steps 8 and 10. It moves only the images that match by name. Renamed, layered and planner-made images move in S2, which also adds `public/game_catalog/curated/`.

## What Changes

- `apps/web/public/game_catalog/datamines/` holds game sprites copied byte for byte from the pinned data-mines `sprites-webp/`, at the same relative path and name (for example `datamines/atlases/ui_icon_trait_flying_01.webp`). Nothing there is renamed, resized or re-encoded.
- `apps/web/datamine/sprites.txt` lists the 2,050 copied sprites. `pnpm --filter web datamine:sprites` (`scripts/datamine-sprites.mjs`) copies exactly those from the datamine cache and deletes anything else in `datamines/`. `apps/web/datamine/files.txt` gains the 15 `sprites-webp/` folders they come from.
- The icon helpers in `packages/game-catalog` (abilities, character / MoW / NPC / raid-boss portraits, equipment, traits, upgrades and their frames, resources, XP books, damage types, stats) and the app's own catalog literals build the data-mines path through a new `datamineAssetUrl()`. The NPC and raid-boss portrait maps now hold paths relative to `game_catalog/`. A few ids whose game file differs only in capitalisation or sits in the game's misspelled `abilties/` folder get small override maps.
- The 2,054 old copies under `abilities/`, `characters/`, `equipment/`, `traits/`, `upgrade_materials/`, `resources/`, `books/`, `frames/`, `hero_frames/`, `damage_icons/` and `stat_icons/` are deleted. What is left in those folders has no same-name game file and moves in S2.
- CI checks that `datamines/` holds exactly the files `sprites.txt` lists.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `datamine-source`: catalog images that are game sprites are byte-for-byte copies of the pinned data-mines sprites, listed in an allowlist and checked in CI.

## Impact

- `apps/web/public/game_catalog/**` (images move), `apps/web/datamine/{files,sprites}.txt`, `apps/web/scripts/datamine-sprites.mjs`, `apps/web/package.json`, `.github/workflows/_build-web.yml`, `AGENTS.md`.
- `packages/game-catalog/src/game-entities/icons/*`, `npc-portrait-overrides.ts`, `raid-boss-portrait-overrides.ts`; the app's shop, goal and insights icon literals; the asset tests.
- Image URLs change, so the `?v=` asset version changes and clients fetch the moved images once.
- The mythic XP book (`ui_icon_consumable_xp_book_5`) changes look: the V1 copy had a frame drawn in, the game's sprite matches the other five books.
