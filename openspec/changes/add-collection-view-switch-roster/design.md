## Context

The Collection page lives in `apps/web/src/fsd/pages/my-game`. The parts this change builds on:

- `useCollectionQuery` reads every toolbar value from the URL, fixes invalid values with one history replacement, and remembers the sort with `usePersistedSelection`.
- `buildCollectionView` produces one `CollectionView` (faction groups of `UnitTileUnit`s plus counts). The page renders it, and the tour and summary are derived from it.
- `UnitTile` in `entities/unit` is the presentational Cards tile. `useUnitTileLabel` builds its spelled-out accessible name.
- The Ownership filter (`?owned=owned|unowned`) already exists in the Filters panel and is disabled without a roster.
- The tour (`collection.tutorial.tsx`) targets `data-testid`s and leaves out steps whose element is absent.

See proposal.md for motivation and the spec delta for the required behaviour.

## Goals / Non-Goals

**Goals:**

- One query, one `CollectionView`. The views differ only in rendering, so filters, sort, counts and Library origins cannot drift between views.
- Build the view switch so that the follow-up changes can add Table and Showcase by adding one value and one view component.

**Non-Goals:**

- Table and Showcase views, image export, and an investment or power sort (follow-up changes on apps #199).
- Virtualisation of the Roster list. At about 131 units it is not needed.
- Any change to `buildCollectionView` ordering or filtering.

## Decisions

### 1. The view is part of `CollectionQuery`, persisted like the sort

Add `collectionLayouts = ["cards", "roster"] as const`, a `CollectionLayout` type, and a `view: CollectionLayout` field on `CollectionQuery`, with default `"cards"`. The type is called "layout" because `CollectionView` already names the built view model. `useCollectionQuery` handles it as follows:

- maps `view` to the `view` parameter;
- validates it and drops an unknown value;
- falls back to a remembered value stored under `collection.view` with `usePersistedSelection`;
- remembers the view only when `update` is given a `view`;
- leaves it out of `CLEARED_FILTERS`, next to `sort`;
- leaves it out of `activeFilterCount`.

Because it is part of the query, `buildCollectionView` receives the view, but it ignores the value.

_Alternative:_ a separate `useCollectionLayout` hook with its own search-param handling. Rejected because it would duplicate the fix-up/replace logic and could race the query's own URL fixes, which are written as one replacement.

### 2. Hide unowned is a display setting stored in the `ownership` field; the Ownership filter is removed

The switch is on when `query.ownership === "owned"`. Turning it on calls `update({ ownership: "owned" })`, and turning it off calls `update({ ownership: null })`.

- It reads `view.query`, the applied query, the same input the Filters panel reads. Without a roster, ownership is stripped from that query, so the switch shows off, and it is disabled with the Filters panel's roster explanation shown next to it.
- After live review the product owner asked that hiding unowned units not behave as a filter. So `ownership: "owned"` is treated as a display setting:
  - `activeFilterCount` counts Ownership only when it is `"unowned"`;
  - `clear()` keeps `ownership: "owned"` and clears `"unowned"`;
  - `buildCollectionView` matches rows without the "owned" restriction to compute `total`, the per-faction `group.total` and `filtered`, and then drops unowned rows from what it lists.

  So the summary and the faction headers keep counting the hidden units.

- With both in place, Ownership appeared twice: the switch and the Filters panel's Ownership select, whose "Owned" option was the same thing. At the product owner's request the select is removed. `CollectionQuery.ownership` keeps only `"owned"`; a stale `owned=unowned` is dropped from the URL like any invalid value. `ownership` joins the settings that `clear()` keeps, and listing only unowned units is no longer offered.
- It stays URL-only, not remembered in the browser, as it was when it was a filter.

No new URL parameter is needed.

_Alternatives:_

- A separate `?unowned=` display setting. Rejected because it would overlap Ownership.
- Dropping the toggle. Rejected because the handoff wants a one-tap control in the toolbar.
- Keeping it a filter and hiding only the Clear filters button. Rejected by the product owner in favour of a true display setting.

### 3. Roster rendering: a new entity component, a page-level layout

- `entities/unit/ui/unit-roster-row.tsx` exports `UnitRosterRow`, which is presentational only and is exported from the slice index next to `UnitTile`.
  - It takes the same `UnitTileUnit`, an optional `link`, and a `form: "link" | "expandable"` prop.
  - It reuses `useUnitTileLabel` and the existing catalog icon helpers (`rankIcon`, `progressionVisual`, `EquipmentIcons`, `shardIcon`).
- Split the small shared pieces out of `unit-tile.tsx` into a sibling module so both components use one implementation:
  - the rarity colour;
  - the equipment slot;
  - the unowned shard-progress block.
- `pages/my-game/ui/collection/collection-roster.tsx` renders the faction sections:
  - It reuses the faction header. The header is extracted from `FactionGroupCard` into `faction-header.tsx`, a sibling of the page, so both views import it without a page ↔ roster import cycle.
  - Sections sit in a grid using `repeat(auto-fill, minmax(min(26.25rem, 100%), 1fr))` (420px), with the same gaps as the Cards grid.
  - Rows go in a `<ul>`.
- `collection-page.tsx` picks the Cards or Roster grid by `view.query.view`. The skeleton, prompts, summary and empty state stay shared.

Row columns use a fixed CSS grid template, so every row in a section lines up; a Machine of War leaves its rank, level and equipment cells empty. Column order follows the handoff:

| Column           | Width               |
| ---------------- | ------------------- |
| portrait         | 28px                |
| name             | flexible, truncated |
| rank badge       | 26px                |
| stars            | auto                |
| `Lv`             | fixed               |
| active / passive | two fixed cells     |
| equipment        | 3 × 22px            |

The star cell shows one icon (the progression's star icon, or the blue-star or wings icon) and the count as text. That matches the handoff ("star icon + count") and stays within 420px.

_Alternative:_ render rows inside the page slice only. Rejected because a dense unit row is a reusable unit presentation, and a future Table or Showcase, or another page, would want it. FSD puts unit presentations in `entities/unit`.

### 4. Desktop and mobile use different interaction forms

The two forms differ in interaction, not just layout, so this is its own decision.

|                    | Desktop (≥768px)                                                                          | Mobile (<768px)                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Row height         | 44px                                                                                      | 48px collapsed                                                                                                      |
| Row root           | `<Link>`: the whole row is the target, with the Cards tile's hover tint and focus outline | `<button aria-expanded aria-controls>` covering the collapsed row                                                   |
| Columns            | All                                                                                       | Portrait, name, rank, stars, `Lv`. Abilities, equipment and shards move into the expanded panel.                    |
| Open the unit page | Click the row                                                                             | An "Open unit page" link inside the expanded panel                                                                  |
| Expansion state    | None                                                                                      | Page-level `expandedId` in `CollectionRoster`, so at most one row is open. It resets when the unit leaves the list. |

The row's accessible name, the full spelled-out label, sits on the link on desktop and on the expand button on mobile. The panel's link is named "Open <unit name>".

The form comes from `useIsMobile()` in the page, which passes `form` to `UnitRosterRow`. This is the same pattern the toolbar uses.

_Alternatives:_

- Make mobile rows links too. Rejected because the handoff asks for expand-in-place: mobile rows can't fit the ability and equipment columns, and expanding shows them without leaving the page.
- Use a long-press to open. Rejected because it can't be discovered and is inaccessible.

### 5. View switch control

- **Desktop:** the site's segmented mode control: `ToggleGroup` with `type="single"`, `variant="outline"` and `spacing={0}`, labelled "View". This is the same control as the Library unit page's Starting | Custom and the theme switcher. Radix exposes it as a radio group with the selected view checked. An empty value (re-selecting the current view) is ignored, so a view is always shown. The handoff first asked for `aria-pressed` buttons; the product owner chose to match the site instead, and the handoff was updated.
- **Mobile:** a `Select` built the same way as `SortSelect`: the label includes the current value, because a combobox is not named by its content.

The toolbar gets two new props, `view` and `onViewChange`, wired to `update({ view })`.

Group by faction and Hide unowned are labelled `Switch` + `Label` pairs (`ToolbarSwitch`), the site's on/off toolbar option, like the tier list's "Only owned". A disabled switch shows its reason next to it, linked with `aria-describedby`, as the tier list does.

## 6. Tour targets follow the view

`useCollectionTutorial` gains a `view` input. Mobile text is chosen in the hook's existing `mobile` step list, so no `isMobile` input is needed.

- **New step** `view`, targeting `collection-view-switch`, which wraps the view switch and the two toolbar switches in both forms.
- **Faction step** targets `collection-faction-group` in Cards and `collection-roster-section` in Roster.
- **Owned and unowned steps** target `collection-owned-tile` and `collection-unowned-tile` in Cards, and `collection-owned-row` and `collection-unowned-row` in Roster.
  - Their content keys branch on view and form: `owned` / `ownedRoster` / `ownedRosterMobile`, and likewise for `unowned`.
  - The mobile Roster text says to tap to expand, then open.
- `hasUnowned` already comes from the applied view, so hiding unowned units removes that step with no extra logic.

### 7. Faction grouping is a query setting; the view model also returns a flat list

Added after the first live verification, at the product owner's request.

- `CollectionQuery` gets `group: "faction" | "none"`, default `"faction"`. It works like `view`: the `group` parameter (only `none` is written), remembered under `collection.group`, left out of `CLEARED_FILTERS` and `activeFilterCount`.
- `buildCollectionView` keeps `groups` and also returns `units`: every matching row in one order, sorted by the same `compareRows` comparator (owned by the selected sort, then unowned nearest to unlock, then name) across all factions. Each entry carries the unit with its faction id and localized faction name. Counts stay derived from the same filtered rows, so grouped and ungrouped views cannot disagree.
- The page renders `groups` or `units` by `view.query.group`, and builds the Library origin from whichever order is shown.
- `UnitTile` and `UnitRosterRow` get an optional `faction?: { id; name }`. When it is given they draw the faction icon (the tile at the portrait's free upper-left corner; the row in an extra leading 18px column), and `useUnitTileLabel` appends the faction name to the accessible name.
- **Ungrouped Cards:** one bordered card holding a grid of tile slots, `repeat(auto-fill, minmax(4.25rem, 1fr))`, so tiles keep about the width they have inside a faction card.
- **Ungrouped Roster:** one bordered card holding a grid of rows, `repeat(auto-fill, minmax(min(26.25rem,100%),1fr))`. Rows flow left to right, then down, so DOM order, keyboard order and reading order agree.
- The toggle is a labelled `Switch` (on = grouped), "Group by faction", next to Hide unowned in both forms.
- The tour drops the faction step when ungrouped. The unit steps keep their tile and row targets, which exist in both layouts.

_Alternatives:_

- Order alliance first and then by sort. Rejected by the product owner: switching grouping off is for seeing the strongest units overall.
- Model "ungrouped" as one pseudo-group. Rejected because it would show a meaningless header and owned/total, and blur the counts.

## Risks / Trade-offs

- **[Risk]** The view in `CollectionQuery` re-runs `buildCollectionView` when only the view changes.
  → The build is cheap (about 131 units) and already memoised on the query. If it shows up in profiling, memoise it on the query without `view`.
- **[Risk]** Extracting shared pieces from `unit-tile.tsx` could change the Cards tile.
  → The existing `unit-tile.test.tsx` and `collection-page.test.tsx` act as regression tests. The extraction moves code without changing markup.
- **[Risk]** A 420px column does not fit every desktop column for a long localized name.
  → The name is the only flexible column and truncates, with the full name in `title` and the accessible name. The width is checked in German during verification.
- **[Trade-off]** On mobile, opening a unit takes two taps (expand, then open), where the Cards tile takes one. The handoff accepts this to show stats on a narrow screen. Cards remains one tap.
- **[Trade-off]** The remembered view is per browser, not per account, the same as the sort.
