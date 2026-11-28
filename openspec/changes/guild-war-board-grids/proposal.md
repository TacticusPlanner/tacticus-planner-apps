## Why

Players can't match the Guild War map pictures to the game: the picker shows each board's whole zoomed-out art, with no outline of the playable area and no deployment hexes. The game ships each board's battle grid, and the API now serves it on each `guild-war` map (`maps[].board`, API change `guild-war-board-grids`).

## What Changes

- Each map-pool board picture (the picker tiles and the large viewer) is cropped to its battle grid and drawn with a light overlay, as the game's deploy screen shows it: a faint hex grid, the attacker's deployment hexes outlined in blue, the defender's in a thinner red and the blocked hexes lightly shaded, so the art stays readable. A picker tile is squared around the whole grid and marks only the deployment and blocked hexes. A raised hex is drawn higher, as the game's angled camera shows it, and the art's transparent water gets a water colour behind it.
- The large viewer explains the marked hexes with a legend (Your deployment, Enemy deployment, Blocked).
- A map served without a board grid, or a board whose art size has no fitted placement, keeps the plain picture.

## Capabilities

### Modified Capabilities

- `guild-war-offense`: map-pool board pictures show their battle grid.

## Impact

- `apps/web`: the API pin and generated types, a `board-overlay` model (hex geometry and the per-art-size placement fitted to the game's art), a `BoardPicture` component used by the map picker and viewer, three `guildWar` locale keys in every locale, and five `--guild-war-*` colour tokens.
- `packages/game-catalog`: the `guild-war` schema accepts an optional `board` on each map; the fixture carries the boards of its maps.
