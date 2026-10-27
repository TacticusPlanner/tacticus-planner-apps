# Tasks

## 1. Match the images

- [x] 1.1 Match every image left under `public/game_catalog/` (and the app's bundled icon PNGs) against data-mines `sprites-webp/` at `v1.43.157.2989` with a 24 px pixel diff, and confirm each pairing by eye.
- [x] 1.2 Fit the ability-badge layers (frame + emblem centered on the frame's opening) and compare all 18 against the V1 renders.
- [x] 1.3 Recheck the Extremis frame and the Onslaught icon: neither has a game file, so they stay curated.

## 2. Move the files

- [x] 2.1 List the new sprites in `datamine/sprites.txt` and run `pnpm --filter web datamine:sprites`.
- [x] 2.2 Move the images with no game file to `curated/`; delete the copies now served from `datamines/` and the unreferenced ones.
- [x] 2.3 Remove `scripts/convert-catalog-webp.mjs` and `sharp`; extend the CI check to the `game_catalog/` layout.

## 3. Switch the helpers

- [x] 3.1 Point the rank, faction, star, onslaught, campaign, frame, shard, resource and token helpers at the game paths; add `curatedAssetUrl()`, `gameModeTokenIcon()` and `LayeredIcon`.
- [x] 3.2 Render `LayeredIcon` in `EntityIcon`; switch the app's literals and bundled PNGs.
- [x] 3.3 Update the icon tests; run tests, typecheck, eslint, knip and the web build.
