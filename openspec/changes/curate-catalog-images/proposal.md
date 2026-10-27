# Proposal

## Why

After `add-datamine-sprites` (S1), 482 catalog images still sat directly under `apps/web/public/game_catalog/`, copied from the V1 `tacticusplanner` checkout: game art saved under planner names (ranks, faction emblems, stars, campaign icons, tokens, item frames), images the game draws from stacked sprites (ability badges), planner-made art, and files nothing referenced. A few game icons were also bundled from `src/` as PNGs. `scripts/convert-catalog-webp.mjs` and the `sharp` dependency existed only to convert those V1 copies.

This is step S2 of datamine roadmap steps 8 and 10.

## What Changes

- Renamed game art comes from the pin: the helpers build the game's own path, and 116 more sprites are listed in `datamine/sprites.txt`.
  - Ranks: `fonts/Rank_<n>.webp` in ladder order (Silver III ships as `fonts/IdunTextRRank_11.webp`).
  - Faction emblems: `atlases/ui_icon_faction_<key>_01.webp`, with a small id-to-key map.
  - Stars: the game's hero-detail stars and mythic wings.
  - Onslaught: tier glyphs `atlases/ui_onslaught_button_rank_<metal>_<n>.webp` (the game calls adamantine "mythic"), alliance emblems `atlases/ui_ability_badges_<alliance>.webp`.
  - Campaigns: storylines use `atlases/ui_icon_campaign_0<n>[_mirror][_elite].webp`; an event's Standard tier uses its faction's emblem.
  - Item frames, shard, coin, energy, raid ticket, summoning tokens, game-mode battle tokens and the bomb, and the Deathwing Terminator portrait.
  - The app's bundled token, energy and stat PNGs are replaced by the same sprites.
- Ability badges are a `LayeredIcon`: the rarity's hex frame with the alliance emblem centered on its opening. `EntityIcon` stacks the layers in a square box. No combined image is committed.
- `apps/web/public/game_catalog/curated/` holds the 291 images with no game file: 272 battle maps, 6 rarity markers (curated by choice), the 6 Extremis and the Onslaught campaign icons, 4 generic "?" icons, the LionHelm ability icon (the game's `LionHelmRelic` is different art) and the crafted-upgrade badge. Helpers reach them with `curatedAssetUrl()`.
- 191 old copies are deleted. 134 of them are now served from `datamines/` (the 18 ability badges as layers). The other 57 were unreferenced: pre-rendered onslaught buttons and their frames, four dialogue portraits, unused token and misc icons, and four `upgrade_materials` duplicates.
- `scripts/convert-catalog-webp.mjs` and `sharp` are removed. CI also checks that nothing but `datamines/` and `curated/` sits under `game_catalog/`.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `datamine-source`: every catalog image is either a pinned game sprite or a curated image in its own folder; layered game icons are stacked at render time.

## Impact

- `apps/web/public/game_catalog/**` (images move or go), `apps/web/datamine/sprites.txt`, `.github/workflows/_build-web.yml`, `apps/web/package.json`, `pnpm-lock.yaml`, `AGENTS.md`.
- `packages/game-catalog/src/game-entities/icons/*`, `npc-portrait-overrides.ts`, `le-map-ids.ts`, `quest-map-ids.ts`.
- `EntityIcon` and the ability-badge consumers (goal chips, MoW upgrades, mythic quests, quest-event rewards); token availability, objective labels and the energy icon drop their bundled PNGs.
- Some icons change look slightly: the game's sprites replace V1's resized copies, the rank badges are the game's `fonts/` set, and the Sisterhood emblem is the game's `adeptas` art.
