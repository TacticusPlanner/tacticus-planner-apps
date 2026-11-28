## 1. Data

- [x] 1.1 Pin the API commit that serves `maps[].board` and regenerate the API types.
- [x] 1.2 Accept an optional `board` on each `guild-war` map in the catalog schema; add the boards to the fixture.

## 2. Overlay

- [x] 2.1 `board-overlay` model: each hex's outline and kind on the art and the crop around the grid, from the hex geometry and the placement fitted per visual board size (13 x 14, 13 x 15), with raised hexes drawn higher.
- [x] 2.2 `BoardPicture`: the cropped art with the hex overlay (cover for the picker tiles, contain and clipped for the viewer), falling back to the plain picture; a legend in the viewer.
- [x] 2.3 Locale keys in every locale and the `--guild-war-*` tokens.

## 3. Checks

- [x] 3.1 Model tests (placement, odd-row shift, elevation, kinds, crop, no fit) and the Offense page test for the picker and viewer.
- [x] 3.2 Checked in the running app against the local API.
