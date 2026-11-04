## 1. View in the query and the URL

- [x] 1.1 In `collection-query.ts`, add `collectionLayouts`, `CollectionLayout`, `isCollectionLayout` and a `view` field on `CollectionQuery`, defaulting to `"cards"`. Leave `view` out of `activeFilterCount`. Verify with a `collection-query.test.ts` case: a query with only `view: "roster"` counts 0 active filters.
- [x] 1.2 In `use-collection-query.ts`, add the `view` parameter mapping:
  - read it with validation; an unknown value is dropped from the URL;
  - fall back to a remembered view under `collection.view` with `usePersistedSelection`, then to `"cards"`;
  - leave `"cards"` out of the URL when serialising;
  - remember the view only on `update({ view })`;
  - leave `view` out of `CLEARED_FILTERS`.

  Verify with `use-collection-query.test.tsx` cases:
  - reload keeps `view=roster`;
  - a remembered view applies with no parameters;
  - `view=gallery` is removed and the remembered view shown;
  - Clear filters keeps the view;
  - opening a link with `view=roster` does not change the remembered view.

## 2. Unit roster row (entities/unit)

- [x] 2.1 Move the rarity colour helper, the equipment slot and the unowned shard-progress block out of `unit-tile.tsx` into a sibling module shared by both components, with the markup unchanged. Verify the existing `unit-tile.test.tsx` and `collection-page.test.tsx` pass unchanged.
- [x] 2.2 Add `UnitRosterRow` in `entities/unit/ui/unit-roster-row.tsx` and export it from `entities/unit/index.ts`.
  - **Owned columns:** portrait ring, name with ellipsis, rank badge image, star icon with count, `Lv`, two ability cells, three equipment squares.
  - **Machine of War:** leaves the rank, level and equipment cells empty, in the same grid template.
  - **Unowned:** shows the greyed portrait, muted name, and shard progress with progressbar, shard count only, or "Starts <Rarity>", following design.md decision 3.
  - **Accessible name:** from `useUnitTileLabel`, with the images `alt=""`.

  Verify with a `unit-roster-row.test.tsx` covering an owned character, an owned MoW (its empty cells line up), an unowned character with 75/400 progress, an unowned MoW, and a no-roster "Starts Epic" row.

- [x] 2.3 Implement the two row forms from design.md decision 4.
  - **`form="link"`:** a 44px `Link` with hover tint and focus outline, carrying `state`.
  - **`form="expandable"`:** a 48px `button` with `aria-expanded` and `aria-controls` and the spelled-out name. Its panel holds the abilities, equipment and shards (mythic from one blue star on), or the unlock progress, plus an "Open <name>" link with the same `to` and `state`.

  Verify with tests:
  - the link form navigates with the origin state;
  - the expandable form toggles `aria-expanded`;
  - its panel shows the stats and a link to the Library path;
  - a blue-star unit shows mythic shards only.

## 3. Collection page: view switch, Unowned toggle, Roster view

- [x] 3.1 Extract the faction header from `FactionGroupCard` into a `FactionHeader` component in `collection-page.tsx` and use it in Cards. Verify the existing Cards tests pass.
- [x] 3.2 Add `collection-roster.tsx`.
  - Faction sections use `section[aria-label]` and `data-testid="collection-roster-section"`, the shared `FactionHeader`, and a `<ul>` of `UnitRosterRow`s.
  - Sections sit in a grid using `minmax(min(26.25rem,100%),1fr)`.
  - Rows get `collection-owned-row` / `collection-unowned-row` test ids.
  - The form comes from `useIsMobile()`.
  - On mobile, one page-level `expandedId` keeps a single row open.
  - Origins come from the same `collectionOrigins` used by Cards.

  Verify with `collection-page.test.tsx` cases:
  - Roster lists the same units in the same order as Cards under a filter and sort;
  - the faction owned counts show;
  - a desktop row links to `/library/characters/<id>` with the Collection origin;
  - on mobile, tapping one row collapses another.

- [x] 3.3 Add the view switch to `CollectionToolbar`, wrapped with the Unowned toggle in `data-testid="collection-view-switch"`.
  - **Desktop:** a single-select `ToggleGroup` labelled "View" with `aria-pressed` items. Re-selecting the current item is ignored.
  - **Mobile:** a `Select` whose accessible name includes the current view.

  Lay out the desktop row so it wraps without truncating labels, and put the mobile controls below Sort and Filters. Verify with toolbar and page tests: switching to Roster changes `?view=` and renders Roster; the filter count is unchanged; the mobile select names the current view.

- [x] 3.4 Add the Unowned toggle: an outline `Button` with `aria-pressed = query.ownership === "owned"`. Pressing it calls `update({ ownership: pressed ? "owned" : null })`. Without a roster it is disabled, with the Filters panel's roster explanation. Verify with tests:
  - hiding gives "84 of 84 matching units owned" and 1 active filter;
  - the Filters panel's Ownership shows "owned";
  - setting Ownership to "not owned" leaves the toggle not pressed;
  - `owned=owned` in the URL shows the toggle pressed;
  - signed out, the toggle is disabled with its explanation and every unit is listed;
  - Clear filters shows unowned units again.
- [x] 3.5 Render Cards or Roster in `collection-page.tsx` by `view.query.view`, keeping the skeleton, prompts, summary and empty state shared. Verify with tests: signed out in Roster shows greyed rows under the sign-in prompt, and no-match in Roster shows the empty state.

## 4. Tour

- [x] 4.1 Update `collection.tutorial.tsx` as in design.md decision 6.
  - Add the `view` step targeting `collection-view-switch`.
  - Faction and unit steps target the current view's test ids.
  - Unit step text varies by view and form: Cards; Roster desktop "a row opens"; Roster mobile "tap to expand, then open".

  Wire `view` from the page. Verify with `collection.tutorial.test.tsx` cases:
  - desktop Cards includes the view step;
  - mobile Cards includes it;
  - desktop Roster targets `collection-roster-section` / `collection-owned-row`;
  - mobile Roster uses the expand text;
  - hidden unowned leaves out the unowned step;
  - no matches leaves out the faction and unit steps.

- [x] 4.2 Add the `tour.collection.steps.view` and the new Roster unit-step keys (`factionRoster`, `ownedRoster`, `ownedRosterMobile`, `unownedRoster`, `unownedRosterMobile`) to `en`, `de`, `es` and `fr` `common.json`, with real translations. Verify the i18n key-parity test passes and `pnpm typecheck` accepts the keys.

## 5. Copy

- [x] 5.1 Add the UI strings to `en`, `de`, `es` and `fr` `common.json` under `myGame.collection`, with real translations:
  - the view switch label and option names (Cards, Roster) and the mobile select label;
  - "Hide unowned" and its disabled explanation, reusing the existing roster-needed string where it fits;
  - the Roster row's "Lv" abbreviation and "Open {{name}}" link (under the top-level `unitRow` key, next to `unitTile`, because the row belongs to `entities/unit`);
  - the expanded-panel labels.

  Verify the key-parity test passes and no English text is left in the de, es or fr files for these keys.

## 6. Automated gates

- [x] 6.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` from `tacticus-planner-apps`. All pass, and `lint:fsd` reports no new boundary violations for the new `entities/unit` export.

## 7. Shared verification (live stack via Aspire, signed in)

Required data states:

- a signed-in account with a synced roster that has owned characters, owned Machines of War, unowned characters with shards, and at least one blue-star unit;
- a signed-out session.

- [x] 7.1 With a synced roster, check that Cards and Roster list the same units and counts under the Imperial filter and sort Rank. Check that Clear filters keeps the Roster view, and that reload and a fresh visit to `/my-game/collection` restore the remembered view.
- [ ] 7.2 Toggle Hide unowned. Check that only owned units show, the summary reads matching units, and the Filters panel shows Ownership "owned". Signed out, check that the toggle is disabled with its explanation.

## 8. Desktop verification (viewport â‰Ą 768px, e.g. 1440Ă—900)

- [ ] 8.1 Check the Roster layout:
  - sections in equal columns of at least 420px;
  - rows 44px tall;
  - columns aligned between character and MoW rows;
  - rank badge images, star icon with count and equipment frames render in light and dark themes;
  - a long German name truncates with the full name in `title`.
- [x] 8.2 Check the interactions:
  - the view switch group announces the pressed state;
  - Tab moves through rows with a visible focus outline;
  - Enter or a click opens the Library page, and its back button reads Collection;
  - prev/next follow Roster order;
  - middle-click opens a new tab.
- [x] 8.3 Run the tour in Cards and in Roster. Check that every step highlights a visible element, the view step appears, and the Roster unit step says a row opens the Library page.

## 9. Mobile verification (viewport < 768px; a 420px same-origin iframe on the app origin)

- [x] 9.1 Check the layout. The view switch is a select below Sort and Filters, with the Unowned toggle next to it. Roster sections stack in one column with 48px rows, and nothing scrolls horizontally at 420px.
- [x] 9.2 Check the interactions:
  - tapping a row expands it in place with abilities, equipment and shards (mythic for a blue-star unit);
  - tapping another row collapses the first;
  - an unowned row expands to its unlock progress;
  - the "Open" link navigates to the Library page with the Collection origin.
- [x] 9.3 Run the tour in Cards and in Roster. Check that every step targets a visible mobile element (not the closed filter sheet), and the Roster unit step says to tap to expand and then open.

## 10. Faction grouping toggle (added after live verification)

- [x] 10.1 Add `group` (`"faction" | "none"`, default `"faction"`) to `CollectionQuery`, with the `group` URL parameter, validation, the remembered value under `collection.group`, and exclusion from `CLEARED_FILTERS` and `activeFilterCount`. Verify with `collection-query.test.ts` and `use-collection-query.test.tsx` cases mirroring the view cases (default kept out of the URL, reload, remembered, unknown value dropped, a link does not change the remembered value, Clear filters keeps it).
- [x] 10.2 Return a flat `units` list from `buildCollectionView`, ordered across factions by the same comparator, each entry with its faction id and localized name. Verify with a `collection-view.test.ts` case reproducing the spec's "Ungrouped by rank across factions" scenario, plus a case without a roster (nearest to unlock first).
- [x] 10.3 Add the optional `faction` prop to `UnitTile` and `UnitRosterRow`: the faction icon, and the faction name appended to the accessible name. Verify with entity tests: the icon is present and the name ends with the faction name; without the prop, the markup and names are unchanged.
- [x] 10.4 Add the Group by faction toggle to the toolbar (both forms) and render the ungrouped Cards grid and ungrouped Roster list in the page, with origins in the shown order. Verify with page tests:
  - toggling off removes the faction headers and lists the units in cross-faction order in both views;
  - the toggle is `aria-pressed`, not counted as a filter, and kept by Clear filters and by view switching;
  - opening a unit from the ungrouped list carries the shown order;
  - signed out, the list is ungrouped and greyed.
- [x] 10.5 Update the tour: leave out the faction step while ungrouped, and mention grouping in the view step text. Add the toggle strings and the updated tour text to `en`, `de`, `es` and `fr` with real translations. Verify with `collection.tutorial.test.tsx` and the page tour-target tests.
- [x] 10.6 Re-run the gates (`pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check`).
- [x] 10.7 Live verification, desktop and mobile (420px iframe), signed in:
  - toggle off in Cards and Roster: no headers, cross-faction order under sort Rank, faction icons on tiles and rows;
  - the setting is remembered on a fresh visit and kept by Clear filters;
  - opening a unit from the ungrouped list gives the shown neighbours;
  - the tour has no faction step.

## 11. Match the site's controls; Hide unowned as a display setting (after live review)

- [x] 11.1 Replace the desktop view buttons with the site's segmented control (`ToggleGroup`, single, outline, `spacing={0}`), and the two toolbar toggles with labelled `Switch`es (`ToolbarSwitch`), with the disabled Hide unowned explanation shown next to its switch. Verify with page tests that the View radio group has the selected view checked, and that the switches are found by `role="switch"` with `aria-checked`.
- [x] 11.2 Make Hide unowned a display setting: not counted by `activeFilterCount`, kept by `clear()`, and leaving the counts unchanged (`total`, `group.total`, `filtered` include hidden units); Ownership "not owned" stays a filter. Verify with `collection-query`, `use-collection-query`, `collection-view` and page tests: no Clear filters button, "1 of 4 units owned", header 1/3, kept by Clear filters, "not owned" counted.
- [x] 11.3 Update the spec delta, design and proposal, and the Collection handoff in `tacticus-planner-docs`, to the site's controls and the Hide unowned behaviour. Verify with `openspec validate --strict`.
- [x] 11.5 Remove the Filters panel's Ownership filter now that Hide unowned covers it: `ownership` keeps only `"owned"` (a stale `owned=unowned` is dropped), Clear filters keeps it, and the filter's strings are removed and the roster note reworded in en/de/es/fr. Verify with the query, view, filter-field and page tests (no Ownership control in the panel; an old `owned=unowned` link lists every unit).
- [x] 11.4 Re-run the gates and re-check live, desktop and mobile: the segmented view control and the switches render like the Library page and the tier list; Hide unowned shows no Clear filters and keeps the counts.

## 12. PR review (#441)

- [x] 12.1 Replace the one-value `ownership` field with a `hideUnowned` boolean, still `?owned=owned`, and remove the dead `rowMatcher` branch and the strip before it. Verify with the query, view and page tests.
- [x] 12.2 When Hide unowned hides every match, keep the summary and show a state with a Show unowned units action, plus Clear filters only while a filter is active. Add the strings in en/de/es/fr. Verify with page tests.
- [ ] 12.3 Move the ungrouped tile's faction badge to the portrait's left edge, clear of the star pill and the rank badge. Verify live with 5-star units.
- [ ] 12.4 Hide the bottom row's dividers in a multi-column Roster list. Verify live on a wide window.
- [x] 12.5 Close an expanded Roster row that leaves the list, so it does not come back open. Verify with a page test.
