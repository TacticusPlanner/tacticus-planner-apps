## Why

Collection, Goals and Dailies > Raids each laid out their controls differently: Group by was a switch on one page, a select on another and chips on the third; the filter entry point was "Filters" on one page and "Raids Filters" (icon-only on mobile) on another; Planning Settings sat in a different row on each. Phase 1 of the app style guide (`ui-style-guide` rules 1 to 3) gives every page the same header and toolbar so a control is always in the same place.

## What Changes

- New shared `PageHeader` (title, tour, description, divider, and one "Settings" button at the right end of the title row) and `PageToolbar` (Find / View / Actions slots, chips on the row below, and on mobile a "View" button that opens a "View options" sheet). The shell renders the header; a page fills its Settings slot.
- Group by is the same labelled segmented control in the View slot on Collection (None / Faction), Goals (None / Unit / Type / Type by priority) and Dailies > Raids (Campaign / Upgrade; no None, raids are always grouped). Layout (Cards / Table, Cards / Roster) is the same control.
- The filter entry point is labelled "Filters" at every width (the Raids dialog keeps its "Raids Filters" title).
- Planning Settings on Goals and Dailies > Raids becomes the header's Settings button.
- Collection: Hide unowned becomes the "Owned only" chip at the head of the chip row; Sort moves to the View slot.
- Goals: Create goal is a filled button in the Actions slot on desktop; on mobile the bottom navigation's Add goal button is the create action. Bulk actions show only while goals are selected. The project scope chips stay above the toolbar.
- Raid grouping keeps its per-device storage and its `daily_raids_grouping_changed` event.

## Capabilities

### New Capabilities

- `app-page-layout`: the page header, the page toolbar's slots and the labelled segmented controls.

### Modified Capabilities

- `player-collection`: toolbar layout, Owned only chip, Group by and Layout controls.
- `goals-navigation`, `goal-list-layout`, `goal-bulk-actions`, `goal-creation-entry-points`, `goal-season-fit`: Goals controls move into the toolbar slots.
- `dailies-navigation`, `daily-raids-today`, `daily-raids-filters`, `planning-settings-access`: Today's controls move into the header and toolbar; "Filters" label.

## Impact

- `apps/web`: `shared/ui` (page header, page toolbar, view placement), `app/layout` (shell renders the header), Collection, Goals and Today toolbars, raid grouping switch, Raids Filters trigger, Goals and Collection tours; `common` and `dailies` copy in four locales.
- No API or storage changes. Stored values (raid grouping, Goals layout, Collection view and grouping) keep their keys.
