## Why

Players can't match the Guild War map pictures to the game: the picker shows each board's whole zoomed-out art, with no outline of the playable area and no deployment hexes. The game ships each board's battle grid, and the API now serves it on each `guild-war` map (`maps[].board`, API change `guild-war-board-grids`).

## What Changes

- Each map-pool board picture (the picker tiles and the large viewer) is cropped to its battle grid and drawn with the hex grid on top, as the game's deploy screen shows it: the attacker's deployment hexes in blue, the defender's in red and the blocked hexes dark. A raised hex is drawn higher, as the game's angled camera shows it, and the art's transparent water gets a water colour behind it.
- The large viewer explains the fills with a legend (Your deployment, Enemy deployment, Blocked).
- A map served without a board grid, or a board whose art size has no fitted placement, keeps the plain picture.

## Capabilities

### Modified Capabilities

- `guild-war-offense`: map-pool board pictures show their battle grid.

## Impact

- `apps/web`: the API pin and generated types, a `board-overlay` model (hex geometry and the per-art-size placement fitted to the game's art), a `BoardPicture` component used by the map picker and viewer, three `guildWar` locale keys in every locale, and five `--guild-war-*` colour tokens.
- `packages/game-catalog`: the `guild-war` schema accepts an optional `board` on each map; the fixture carries the boards of its maps.
