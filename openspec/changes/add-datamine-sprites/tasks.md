# Tasks

## 1. Copy the sprites

- [x] 1.1 Match today's `public/game_catalog` images by file name (case-insensitive) against data-mines `sprites-webp/` at `v1.43.157.2989`: 2,054 of 2,066 in the eleven folders match; where a name appears in two game folders, take `atlases/` or `ui/` (byte-identical or same art). Spot-check by size and a 32 px pixel diff: only the mythic XP book differs (V1's copy has a frame drawn in).
- [x] 1.2 Add the 15 source folders to `apps/web/datamine/files.txt`, list the 2,050 sprites in `apps/web/datamine/sprites.txt`, add `scripts/datamine-sprites.mjs` and the `datamine:sprites` script; verify each copy is byte-identical to the cache.
- [x] 1.3 Add the CI check that `datamines/` matches `sprites.txt`.

## 2. Switch the helpers

- [x] 2.1 Add `datamineAssetUrl()` and point the ability, portrait, equipment, trait, upgrade, frame, resource, XP book, damage-type and stat helpers and the app's catalog literals at the game paths; rewrite the NPC and raid-boss portrait maps to `game_catalog`-relative paths.
- [x] 2.2 Delete the old copies; update the icon tests and the asset audits (equipment, NPC portraits, NPC ability icons) to check helper URLs against every shipped catalog image.
- [x] 2.3 Run `pnpm test:run` (web and game-catalog), `pnpm typecheck`, eslint and knip on the changed files, and `pnpm --filter web build`.

## Notes

- Left for S2: `abilities/ui_icon_ability2_LionHelm` (the game ships `LionHelmRelic`), `resources/ui_icon_raid_ticket`, `stat_icons/ui_icon_movement`, five V1 portraits with no game file (`ui_dialogue_portrait_*` and `ui_image_portrait_darka_deathwing_01`, rechecked: not in `sprites-webp/` or `sprites/`), and four unreferenced `upgrade_materials/…M21x` files whose `C`-suffixed twins already moved.
- `characters/ui_image_RoundPortrait_adept_canoness_01 1.webp` (an unreferenced duplicate with a space in its name, only in the game's `quests/`) is dropped rather than copied.
