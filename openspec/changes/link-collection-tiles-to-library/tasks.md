## 1. Unit-origin contract in the `unit` entity

- [x] 1.1 Move `pages/library/ui/unit/unit-origin.ts` to `entities/unit/model/unit-origin.ts`, export `UnitOrigin`, `readUnitOrigin`, `unitOriginState` and `unitNeighbours` from `@/entities/unit`, delete the old file, and move its tests from `pages/library/ui/unit/unit-shell.test.tsx` to `entities/unit/model/unit-origin.test.ts`; verify the moved tests pass and `pnpm lint:fsd` reports no boundary violation
- [x] 1.2 Add `unitLibraryPath(kind, unitId)` (`/library/characters/<id>`, `/library/machines-of-war/<id>`) and the Collection back target (`/my-game/collection`) to the same module and export them; verify with unit tests for both kinds and the back target
- [x] 1.3 Switch `unit-list.tsx`, `character-unit-page.tsx` and `mow-unit-page.tsx` to import the origin helpers from `@/entities/unit`; verify `pnpm typecheck` passes and the existing Library list and unit page tests pass unchanged

## 2. `UnitTile` as a link

- [x] 2.1 Add the optional `link?: { to; state? }` prop to `UnitTile`: with it, render the root as a react-router `Link` carrying the same `aria-label`, `title`, `data-testid` and `data-state`, the full slot width, a visible `focus-visible` outline, hover feedback and rounded corners; without it, render the current `div role="group"` unchanged; update the doc comment that says Stage 4 makes it interactive; verify in `unit-tile.test.tsx` that with `link` the tile is one `link` role whose accessible name is the spelled-out label and whose `href` is the target, that it is focusable, and that without `link` the existing group assertions still pass
- [x] 2.2 Verify in `unit-tile.test.tsx` that the owned, unowned-with-shards and starts-at variants all render as links with unchanged accessible names and unchanged visible content when `link` is given

## 3. Collection page links its tiles

- [x] 3.1 In `collection-page.tsx`, derive the character-id and MoW-id orders from `view.groups` (faction order, then tile order) with `useMemo`, and pass each tile `link = { to: unitLibraryPath(kind, id), state: unitOriginState({ kind: "collection", ids: <ids of its kind> }) }` for owned, unowned and no-roster tiles; verify in `collection-page.test.tsx` that a character tile links to `/library/characters/<id>`, a MoW tile to `/library/machines-of-war/<id>`, tiles are links in the anonymous, not-synced and roster-error states, and that activating a tile (in a `MemoryRouter` with a probe route) lands on the unit path with a `collection` origin whose ids contain only units of that kind in display order
- [x] 3.2 Replace the "does nothing when clicked (click-through to Library is Stage 4)" test in `unit-tile.test.tsx` with one that a tile without `link` stays a non-interactive group and one with `link` navigates on click; verify both test files pass

## 4. Unit pages honour the Collection origin

- [x] 4.1 In `character-unit-page.tsx`, rename the `/library/characters` constant `COLLECTION_PATH` to `CHARACTERS_PATH`, and choose the back target from the origin: `collection` → `/my-game/collection` labelled with `common:myGame.tabs.collection`, otherwise the characters list; verify in `character-unit-page.test.tsx` that, opened with a `collection` origin of three character ids, the back link reads "Collection", has accessible name "Back to Collection" and points to `/my-game/collection`, the position reads "<n> of 3", Next follows the origin order and keeps the origin in its link state, and that without state the back button still reads "Characters"
- [x] 4.2 Same in `mow-unit-page.tsx`; verify in `mow-unit-page.test.tsx` that a `collection` origin gives back "Collection" to `/my-game/collection`, position and prev/next over the origin's MoW ids, and the list default without state
- [x] 4.3 Verify on the mobile form (mocked `useIsMobile`) in one unit page test that the icon-only back button's accessible name is "Back to Collection" with a `collection` origin

## 5. Page tour and i18n

- [x] 5.1 Update `tour.collection.steps.owned.content` and `tour.collection.steps.unowned.content` in `apps/web/public/locales/{en,de,es,fr}/common.json` to add that selecting a unit opens its details in the Library (no "click"/"tap" wording), with real German, Spanish and French translations at the quality of the surrounding `tour.collection` strings; verify every locale file parses and has both keys changed
- [x] 5.2 Add `collection.tutorial.test.tsx` covering desktop and mobile step lists for each data state (with/without summary, owned, unowned), asserting that every remaining tile step's content mentions opening the Library page, including the signed-out case with no owned step; verify the test passes

## 6. Repository gates

- [x] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm build` and `git diff --check` from the repo root and verify all pass

## 7. Shared verification (local Aspire stack)

Required data states: a signed-in account with a synced roster that owns at least one character and one Machine of War and lacks at least one character; and a signed-out session (or private window) for the catalog-only state.

- [x] 7.1 Signed in: from `/my-game/collection`, open an owned character, an unowned character and a Machine of War; verify each lands on the right Library URL, the owned unit shows "Your unit" progression, and the unowned one shows catalog values — verified manually by the user (2026-10-22)
- [x] 7.2 Signed out: open a character from the greyed-out Collection and verify its Library page loads with catalog data only and back returns to Collection — verified manually by the user (2026-10-22)
- [x] 7.3 Middle-click (or open in new tab) a tile and verify the new tab shows the unit page with back to its Library list; reload a unit page opened from Collection and verify back still reads "Collection" — verified manually by the user (2026-10-22)

## 8. Desktop verification (viewport ≥ 768px)

- [x] 8.1 Hover shows feedback on a tile; Tab moves through tiles in DOM order with a visible focus outline; Enter opens the focused unit — verified manually by the user (2026-10-22)
- [x] 8.2 On a character opened from Collection: back reads "Collection", the position is "<n> of <characters in Collection>", Next/Previous step through characters only in Collection order across faction boundaries, and back returns to `/my-game/collection`; repeat for a Machine of War (MoWs only) — verified manually by the user (2026-10-22)
- [x] 8.3 Start the Collection tour and verify every step highlights a visible element and the tile steps say a tile opens its Library page — verified manually by the user (2026-10-22)

## 9. Mobile verification (viewport < 768px, same-origin iframe ~420px)

- [x] 9.1 Confirm the 5-slot mobile grid renders; tapping a tile opens its Library page and the whole tile is the target — verified manually by the user (2026-10-22)
- [x] 9.2 On a unit opened from Collection: the icon-only back button returns to Collection and is named "Back to Collection"; prev/next walk only the same kind in Collection order — verified manually by the user (2026-10-22)
- [x] 9.3 Start the Collection tour in the mobile form and verify every step highlights a visible element and the tile steps say a tile opens its Library page — verified manually by the user (2026-10-22)
