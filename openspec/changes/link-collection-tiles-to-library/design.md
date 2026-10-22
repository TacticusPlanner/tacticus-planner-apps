## Context

See proposal.md for motivation. Current state that shapes the approach:

- `UnitTile` (`entities/unit/ui/unit-tile.tsx`) is presentational: its root is a `div role="group"`
  whose `aria-label` spells the progression out, and every image inside is decorative. Its only consumer
  is the Collection page (`pages/my-game/ui/collection/collection-page.tsx`).
- The Library unit pages already model "where the user came from" as router history state:
  `pages/library/ui/unit/unit-origin.ts` exports `UnitOrigin` (`kind: "list" | "collection"`, `ids`),
  `readUnitOrigin`, `unitOriginState` and `unitNeighbours`. The `"collection"` kind was reserved for
  this change but nothing produces it, and both unit pages hard-code the back target to their list
  (`back={{ to: COLLECTION_PATH, label: t("charactersList.title") }}` and the MoW equivalent).
- That module is private to the `library` page slice. FSD forbids `pages/my-game` from importing
  `pages/library`.
- The Collection view model (`pages/my-game/model/collection-view.ts`) already produces the display
  order: `view.groups[]` in faction order, each with `units[]` (`kind`, `unitId`) in tile order.
- The character unit page names its `/library/characters` constant `COLLECTION_PATH` (Library's own
  "collection" wording), which collides with the My Game Collection this change introduces as an origin.

## Goals / Non-Goals

**Goals:**

- One owner for the unit-origin contract that both the producer (Collection) and the consumers (unit
  pages, Library lists) import through a public API.
- Tiles become real links (anchor semantics: middle-click, open in new tab, Enter), not click handlers.

**Non-Goals:**

- Restoring Collection's scroll position when the back button is used. The browser's own back keeps
  it; the in-page back button navigates to `/my-game/collection` like the list back buttons do today.
- Linking units anywhere else (Goals, Legendary Events, Dailies). The entity API makes it possible
  later; this change only wires Collection.
- Changing the breadcrumb, which stays `Library / <section> / <name>`.

## Decisions

### 1. Move the unit-origin contract to the `unit` entity

Move `unit-origin.ts` to `entities/unit/model/unit-origin.ts` and export `UnitOrigin`,
`readUnitOrigin`, `unitOriginState`, `unitNeighbours` from `@/entities/unit`. Add next to it:

- `unitLibraryPath(kind: UnitKind, unitId: string): string` returning `/library/characters/<id>` or
  `/library/machines-of-war/<id>`;
- `unitOriginBack(origin)` data: the back target for the `"collection"` kind
  (`/my-game/collection`), so the route string lives in one place.

The Library list pages and unit pages switch their imports to `@/entities/unit`; the old file is
deleted (V2 is pre-production, no compatibility shim). `unit-shell.test.tsx`'s origin tests move with
the module to `entities/unit/model/unit-origin.test.ts`.

_Alternatives:_ `shared/lib` - rejected, the contract is about units (it uses `UnitKind`) and `shared`
must stay domain-free. Duplicating the state shape in `pages/my-game` - rejected, the producer and the
reader would drift silently because history state is untyped at the boundary.

### 2. `UnitTile` renders as a link when given a target

`UnitTile` takes an optional `link?: { to: To; state?: unknown }`. With it, the root element is a
react-router `Link` instead of the `div role="group"`, carrying the same `aria-label`, `title`,
`data-testid` and `data-state`, plus a visible `focus-visible` outline and a hover background, with
rounded corners so the outline reads as the tile's shape. The root keeps the full slot width, so the
target is the whole tile. Without `link` it renders exactly as today (no consumer needs that now, but
it keeps the entity usable as a static display, e.g. in tests and future showcase views).

_Alternatives:_ wrapping the tile in a `Link` from the page - rejected: the link's accessible name would
be computed from its content (a nested `group` with its own label), so assistive technology would
announce the label twice or not at all depending on the reader, and the page would have to restyle
focus around a component it doesn't own. An `onClick` + `navigate()` - rejected, loses link semantics
(no new tab, no middle-click, not announced as a link).

### 3. Per-kind origin built by the Collection page

The Collection page derives, with `useMemo` over `view.groups`, two orders: character ids and MoW ids,
each in display order. Each tile gets
`link = { to: unitLibraryPath(kind, id), state: unitOriginState({ kind: "collection", ids: <ids of that kind> }) }`.

Per kind because the unit pages build prev/next URLs under their own section; a mixed list would step
a character page onto `/library/characters/<mowId>`, a not-found page. The derivation stays in the page
(a presentation concern of the view it already renders) rather than in `buildCollectionView`; it is a
pure two-line flatMap and is covered by the page test.

### 4. Unit pages choose the back target from the origin

Both unit pages compute
`back = origin.kind === "collection" ? { to: "/my-game/collection", label: t("common:myGame.tabs.collection") } : { to: <list path>, label: <list title> }`.
The label reuses the existing, already translated `myGame.tabs.collection` string ("Collection"), so the
mobile icon-only back button's name becomes "Back to Collection" through the existing
`unit.nav.backTo` key. Prev/next already re-pass the origin in their link state, so the Collection
origin survives stepping, reload and history back/forward with no change there. The character page's
`COLLECTION_PATH` constant is renamed `CHARACTERS_PATH` to stop the name clash.

### 5. Tour: same steps, updated copy

No new step: the owned-tile and unowned-tile steps already target tiles, so each gets one added
sentence saying a tile opens the unit's Library page ("Select a unit to open its details in the
Library."). Both steps carry it because either can be left out (signed out there is no owned step; a
player who owns everything has no unowned step). The wording avoids "click"/"tap", so desktop and mobile
share the keys as they do today.

### 6. No desktop/mobile split

The tile is the same link on both forms; only the grid reflows (5 vs 7 slots). The unit page's
icon-only mobile back button already takes its accessible name from the label. No form-specific
selectors or interaction differ, so there is no split to document beyond verifying both.

## Risks / Trade-offs

- [The tile's `aria-label` overrides the link's content, so the unowned tile's `progressbar` is no
  longer reachable as its own element by some screen readers] → the label already spells the shard
  progress out ("75 of 400 shards to unlock"), so nothing is lost; covered by the existing label tests.
- [Collection order changes after a sync while a unit page is open with an older origin] → the stored
  ids are only an order; a unit missing from them shows no position and disabled prev/next, as for an
  unknown id today.
- [Back button resets Collection scroll] → accepted for consistency with the list back buttons; browser
  back preserves it (Non-Goals).
- [Moving the origin module touches every Library unit page import] → mechanical; guarded by the moved
  unit tests, the unit page tests and `pnpm lint:fsd`.
