## Why

My Game → Collection has one layout, the faction-grouped Cards view. The Collection design handoff (`tacticus-planner-docs/ux/wireframes/collection-handoff.md`, sections 3 and 5) specifies more: a view switch, a denser Roster view for players who scan many units at once, and an Unowned toggle in the toolbar. This change is part 1 of apps #199. It delivers the view switch, Hide unowned and the Roster view, and sets the switch up so the Table and Showcase views can be added later without reworking it.

## What Changes

- Add a **view switch** to the Collection toolbar, offering Cards (the default and the current layout) and Roster.
  - On desktop it is the site's segmented mode control (as on the Library unit page); below 768px it is a select.
  - The selected view is held in the URL (`?view=`), is remembered in this browser like the sort, and Clear filters leaves it unchanged.
- Add a **Hide unowned** switch to the toolbar: a display setting kept in `?owned=owned`. It replaces the Filters panel's Ownership filter, which is removed. **BREAKING** for old links carrying `owned=unowned`, which is now dropped.
  - It is not counted as a filter, Clear filters leaves it on, and the summary keeps counting the hidden units.
  - Without a synced roster it is disabled, with the reason shown next to it.
- Add the **Roster view**: the same faction groups, in the same order and with the same filters, rendered as dense rows.
  - Each row is 44px tall and shows the portrait, name, rank badge, stars, XP level, both ability levels and three equipment squares.
  - Faction sections flow in columns at least 420px wide.
  - Unowned rows show shard progress or the starting rarity instead of the stats.
  - On desktop each row links to the unit's Library page, like a Cards tile does.
  - On mobile, rows are 48px tall and expand in place on tap; the expanded row holds a link to the Library page.
- Add a **Group by faction** toggle (on by default) for both views, added after the first live verification.
  - When it is off, one list sorted across all factions: owned units by the selected sort, then unowned units nearest to unlock.
  - Each tile and row shows its faction icon.
  - The setting is held in the URL (`?group=none`) and remembered like the view.
- Extend the **page tour** with a view-switch step. Its unit steps now target whichever view is shown.
- Out of scope, as follow-up changes on apps #199:
  - the Table view, whose column headers will drive the shared Sort;
  - the Showcase view;
  - image export;
  - an investment or power sort.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `player-collection`:
  - Add requirements for the view switch, Hide unowned and the Roster view.
  - Extend the URL-state requirement with the view parameter and the remembered view.
  - Update the toolbar requirement for the new controls.
  - Update the page-tour requirement for the view-switch step and the Roster targets.

## Impact

- `apps/web/src/fsd/pages/my-game/model`:
  - `collection-query.ts`: add the view value and its default;
  - `use-collection-query.ts`: add the `view` parameter, validation and the remembered view;
  - tests for both.
- `apps/web/src/fsd/pages/my-game/ui/collection`:
  - `collection-toolbar.tsx`: add the view switch and the Group by faction and Hide unowned switches;
  - `collection-page.tsx`: render Cards or Roster;
  - a new Roster view component;
  - `collection.tutorial.tsx`;
  - tests for all of these.
- `apps/web/src/fsd/entities/unit`: a new presentational `UnitRosterRow` next to `UnitTile`. It reuses `UnitTileUnit` and the shared accessible label, and is exported through the slice's public API.
- `apps/web/public/locales/{en,de,es,fr}/common.json`: add strings for the view switch, the toolbar switches, the Roster row and the tour.
- No API, data, or catalog changes, and no companion `tacticus-planner-api` change.
