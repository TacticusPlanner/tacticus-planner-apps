## Why

Players miss opening a unit from their collection to see its details (survey: "missed clicking a unit
for detail"; beta feedback LIB-04). The Library character and Machine of War pages now carry the full
V1 unit details (#205, #206, #244), but Collection tiles are still deliberately non-interactive, which
leaves the last three acceptance criteria of #203 open. Linking was held back until those pages were
complete; they are, so the tiles can open them now.

## What Changes

- Every Collection tile (owned, unowned, and the greyed-out tiles shown without a roster) becomes a link
  to its unit's Library page: `/library/characters/:id` for a character, `/library/machines-of-war/:id`
  for a Machine of War. The whole tile is the target, it stays keyboard reachable in DOM order, and it
  keeps its spelled-out accessible name. Signed out it still opens the page, which then shows catalog
  data only.
- A unit page opened from Collection remembers that origin: its back button reads "Collection" and
  returns to `/my-game/collection`, and Previous/Next walk the units of the same kind in Collection
  order (a character page steps through characters only, a Machine of War page through Machines of
  War only). Opening from the Library lists, bookmarks and shared links is unchanged.
- The Collection page tour tells the player that a tile opens the unit's Library page (en/de/es/fr).
- Removes the `player-collection` rule that tiles are not interactive.
- The unit-origin router state (today private to the Library page slice) moves to the `unit` entity so
  the Collection page can produce it without a page-to-page import.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `player-collection`: tiles link to the unit's Library page instead of being non-interactive; the page
  tour mentions it.
- `character-unit-details`: unit navigation adds the Collection origin (back to Collection, prev/next
  over characters in Collection order).
- `mow-unit-details`: MoW unit navigation adds the Collection origin (back to Collection, prev/next over
  Machines of War in Collection order).

## Impact

- `apps/web/src/fsd/entities/unit`: `UnitTile` gains an optional link target; the unit-origin helpers
  (`UnitOrigin`, `readUnitOrigin`, `unitOriginState`, `unitNeighbours`) and the Library unit path
  builder move here from `pages/library/ui/unit/unit-origin.ts`.
- `apps/web/src/fsd/pages/my-game`: Collection page builds per-kind origin orders and passes links to
  the tiles; Collection tour text.
- `apps/web/src/fsd/pages/library`: character and MoW unit pages pick the back target and label from the
  origin; list and unit pages import the origin helpers from the entity.
- Locales: `common` tour text in en/de/es/fr. The back label reuses the existing `myGame.tabs.collection`
  string.
- No API change; no companion `tacticus-planner-api` change.
- Design record: `tacticus-planner-docs/ux/wireframes/collection-handoff.md` already specifies this
  Stage 4 behavior (sections 2 and 8).
