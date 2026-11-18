## MODIFIED Requirements

### Requirement: The list switches from table to cards at the app's mobile breakpoint

The list SHALL render as the cards or the table according to this device's stored Goals view at every width (see "Users choose between a Cards view and a Table view, Cards by default"), with Cards as the default. The mobile breakpoint (768px, `useIsMobile()`, the same breakpoint the rest of the app uses to tell its desktop and mobile UI forms apart) SHALL decide only the card grid's columns and the mobile interaction modes: below it, the table SHALL show checkboxes only in select mode, SHALL show no drag handle, and SHALL give way to the collapsed reorder cards in reorder mode. A list with no view toggle SHALL render as cards below the breakpoint and as the table at or above it. No other width threshold SHALL change the layout.

#### Scenario: Below the mobile breakpoint, Cards view

- **GIVEN** the viewport is narrower than 768px and the stored Goals view is `Cards` or unset
- **WHEN** the Goals list renders
- **THEN** it renders as a single column of cards

#### Scenario: Below the mobile breakpoint

- **GIVEN** the viewport is narrower than 768px and the stored Goals view is `Table`
- **WHEN** the Goals list renders
- **THEN** it renders as the table with its full column set, scrolling sideways inside the list while the page itself does not scroll sideways, with no checkboxes until select mode and no drag handles until reorder mode

#### Scenario: At or above the mobile breakpoint, Cards view

- **GIVEN** the viewport is 768px or wider and the stored Goals view is `Cards` or unset
- **WHEN** the Goals list renders
- **THEN** it renders as the cards grid

#### Scenario: At or above the mobile breakpoint

- **GIVEN** the viewport is 768px or wider and the stored Goals view is `Table`
- **WHEN** the Goals list renders
- **THEN** it renders as the table with its full, static column set

### Requirement: Desktop table uses static columns with a leading control cell and a row menu

While the Table view is selected (see "Users choose between a Cards view and a Table view, Cards by default"), the Goals list SHALL render as a table with these data columns, in order: Character, Projects, Goal, Status, "Done by", Remaining, and Progress. Progress is last and narrow: it is the least-scanned figure in the row (UserJot "V2 Goals Page Is Harder to Scan"), so the status, completion date, day count and energy come before it. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width — the only layout change at any desktop width is the fixed set of columns above, and below the mobile breakpoint the same columns scroll sideways inside the list. A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. Progress SHALL be the last column at a fixed narrow width; Remaining chips wrap within their own cell.

The Character column SHALL show the unit's avatar (drawn larger than the 40px V2 launch size so it reads like V1's goal cards), its name, and, when the goal has notes, the notes on a single line directly beneath the name (truncated with an ellipsis after that one line, the full text available as a tooltip), and SHALL NOT show the goal type as a text caption or the goal's project badges; the goal type is instead encoded in the Goal column (see "The Goal column encodes the goal kind visually, without a type label"). At the trailing edge of the Character cell, every row SHALL render an always-visible "⋯" menu trigger with an accessible name, opening the row's actions menu: Edit, then Pause or Resume (for a goal that is not Reached and is Active or Paused respectively — see `goal-status-actions`), then Delete as a destructive item. There SHALL be no separate Actions column and no inline action icon buttons in the row. The Projects column SHALL show the goal's project-membership badges (colour dot and project name, wrapping within the cell), and SHALL be empty for a goal in no project; its header text SHALL be visible. The Goal column SHALL show the goal's from → to representation as defined by "The Goal column encodes the goal kind visually, without a type label", with the rank and rarity emblems drawn at the large size. The Status column SHALL show only the goal's status chip(s) (Active/Paused toggle, Reached, Blocked/Restricted), drawn at body-text size so Active and Paused read at a glance. The "Done by" column SHALL show the `goal-list-estimate-display` completion date as its headline (body-text size, foreground colour) with the day count on a line directly beneath, and any season-fit label under that; when no estimate is available the cell SHALL be empty rather than showing a placeholder; a blocked estimate's per-material detail SHALL NOT render in the cell (it is the Blocked indicator's tooltip content, see `goal-list-estimate-display`).

Each row SHALL render at a fixed height sized to one line of content per column (with the Character column's name-and-notes lines and the "Done by" column's date-and-days lines accommodated within that same fixed height). Two exceptions SHALL exist: a row whose Progress cell carries level-requirement sub-lines, and a row whose Remaining chips wrap beyond two lines (see `goal-remaining-resources`: every chip renders) — such a row SHALL grow only as far as its wrapped content needs, and no other row SHALL change height because of it. The existing alternating row (zebra) striping SHALL be preserved.

Every row SHALL have a leading cell before the Character column holding, in order: the selection checkbox (only in select mode, see `goal-bulk-actions`), the account-wide priority number for an in-flight row, and — when the table renders on a route where inline reordering is available (the Goals page, with or without a project scope — see `global-goal-priority`'s "Owner can reorder from Goals") and at or above the mobile breakpoint — while Sort is Priority, a drag handle for each Active or Paused row. This cell holds control affordances, not a data column, and does not change the seven static columns above; the handle is present only in a reorderable context and absent elsewhere, which is a context-conditional distinction, not the width-conditional column-hiding this requirement otherwise prohibits.

Assumptions:

- Column widths are a layout implementation detail (not restated here in pixels); the ordering, content, and fixed row height are the externally observable, testable behavior. The Remaining column SHALL be wide enough that a Machine of War Ability goal needing badges of every rarity, forge badges, components, gold and energy fits in at most three chip lines at a 1280px-wide viewport with the sidebar open.

#### Scenario: A goal with a completion estimate

- **GIVEN** a Rank goal has status "Active", is "Blocked", and has a computed completion estimate of October 11th (in 22 days)
- **WHEN** the row renders
- **THEN** the Status column shows "Active" and "Blocked", and the "Done by" column shows "📅 Oct 11" with "in 22 days" on the line beneath

#### Scenario: A goal with no completion estimate

- **GIVEN** a goal has status "Active" and no computed completion estimate (no project selected, or the goal kind is not farmable)
- **WHEN** the row renders
- **THEN** the Status column shows "Active" and the "Done by" cell is empty, with no placeholder such as "—"

#### Scenario: The Remaining column stays visible at every desktop width

- **GIVEN** the viewport is at or above the mobile breakpoint, at any desktop width, and Table view is selected
- **WHEN** the Goals list renders
- **THEN** it renders as a table with all seven data columns in the order Character, Projects, Goal, Status, Done by, Remaining, Progress — no width threshold hides or restores any of them

#### Scenario: A drag handle appears only in a reorderable context

- **GIVEN** the same Active goal renders once on the Goals page and once in a list that is not reorderable
- **WHEN** each list renders as a desktop table
- **THEN** the Goals page row shows a leading drag handle and the other row does not, with both rows otherwise showing the same seven columns

#### Scenario: The row menu holds every row action

- **GIVEN** an Active goal that has not reached its target
- **WHEN** its "⋯" menu at the end of the Character cell is opened
- **THEN** it lists Edit, Pause and Delete, in that order, and the row shows no inline Edit, Pause or Delete icon button

#### Scenario: No Actions column

- **WHEN** the desktop table renders
- **THEN** no column follows Progress and no column header reads "Actions", visibly or for assistive technology

#### Scenario: A Machine of War row with many chips grows

- **GIVEN** a Machine of War Ability goal whose Remaining chips wrap to three lines
- **WHEN** the table renders
- **THEN** that row is taller than its neighbours, every chip is visible, and the neighbouring rows keep the fixed height

### Requirement: Goal cards share one layout on every platform

Wherever the Goals list renders as cards, each goal SHALL render as one card in a grid whose columns are each at least 380px wide (or the full width, when narrower) and fill the available width. In Cards view the Goals tab SHALL NOT apply the page's maximum content width (1600px), so a wide screen adds columns rather than margins; the Table view and the other Goals-area tabs keep that maximum. Below the mobile breakpoint this grid is a single column. Cards in the same grid row SHALL be equal height, with their footers aligned. Wherever another requirement of this capability describes the mobile card or card behavior, it SHALL apply to this card on every platform.

Each card SHALL contain, from top to bottom:

1. **A header.** In order:
   - the selection checkbox, only while select mode is active (see `goal-bulk-actions`);
   - the account-wide priority number;
   - the drag handle, for an Active or Paused goal at or above the mobile breakpoint where reordering is available;
   - the unit avatar;
   - the unit name with, beneath it, a meta line holding the "Done By" date and day count (when an estimate exists), the season-fit label (when a mode is on), and the goal's project badges (when it has projects), wrapping as needed; a long project name is truncated at a fixed badge width, with the full name as its tooltip;
   - the "⋯" row-actions menu at the trailing edge.
2. **A body**, laid out in V1's row positions: each row's figures sit at its right end, with no separator lines or dividers between rows or figures. An Ascension or Ability goal uses V1's own body for its kind (below); every other kind, in order:
   - the target row: the goal line (the same from → to representation as the desktop Goal column) on the left, and the energy and Onslaught-token chips (`goal-remaining-resources`) at the right end;
   - the covered-by note, when applicable;
   - the progress bar with its percent readout (`goal-progress-display`);
   - the level row, when the goal has a level requirement: the XP-book figure, then its Potential-only bar, then the level target ("Lv 40 → 50"), and the gold chip at the right end, all centered on one line, wrapping only when a narrow phone cannot fit them;
   - the remaining-resource chips that are not already on a row above (badges, forge badges, components, orbs, shards, shop currency, and gold when there is no level row), wrapping on the left.

   An **Ascension** goal's body, in order: the target row (as above); the covered-by note, when applicable; its orb chips on their own row; then one labelled bar per shard kind the goal costs ("Shards", "Mythic shards"), each reading the owned shards the plan applies to the goal's own steps against what those steps cost in total ("120 / 400"). It has no general progress bar, and the shard chips are replaced by these bars.

   An **Ability** goal's body, in order: a cost row with the ability badges, forge badges, components and gold on the left and the energy and Onslaught-token chips at its right end; the ability tracks still being raised as soft blocks sharing the row's width ("ACTIVE 20 → 26", "PASSIVE 20 → 50"); the covered-by note, when applicable; and the level row (XP-book figure, Potential-only bar, level target), without a gold chip. It has no general progress bar.

   Every chip the goal's kind defines still renders exactly once.

3. **A notes section**, only when the goal has notes. It is separated by a rule, shows the notes clamped to two lines, and makes the full text available as a tooltip.
4. **A footer**, separated by a rule and pinned to the bottom of the card. It holds the status chip and, when blocked, the Blocked or Restricted indicator. The status chip of a goal that has not reached its target and is Active or Paused SHALL be a one-click Pause/Resume control with an accessible name naming the status and the action. This is in addition to the menu's Pause/Resume item (`goal-status-actions`).

The goal type SHALL lead the goal line as a badge, because a card has no Goal column header and two goals for one unit otherwise differ only by their emblems. An Unlock goal's line SHALL be the badge alone, since its target readout is already the word "Unlock". A Reached goal's card SHALL keep this layout with the Reached treatment. The card SHALL reflow without horizontal scrolling at 200% browser zoom.

#### Scenario: A desktop card in Cards view

- **GIVEN** an Active Rank goal at priority 3, with notes, in project "Neuro", with a completion estimate of Oct 11 (in 22 days)
- **WHEN** it renders in Cards view at 1280px wide
- **THEN** outside select mode its header shows "3", a drag handle, the avatar, the name and a meta line "📅 Oct 11 · 22 days" with the "Neuro" badge, and a "⋯" menu; its body shows the rank emblems with the energy chip at the right end of their row, then the progress bar, then the level line with the gold chip at its right end; a ruled section shows the notes; and its footer shows the "Active" chip with a pause action

#### Scenario: The grid fills the width

- **GIVEN** the Goals list in Cards view at a content width of 1000px
- **WHEN** it renders
- **THEN** the cards sit two to a row, each at least 380px wide, and cards in one row share a height with aligned footers

#### Scenario: A wide screen adds columns in Cards view

- **GIVEN** a 3440px-wide screen
- **WHEN** the Goals tab renders in Cards view
- **THEN** the grid spans the full content width beside the sidebar, with more than four cards to a row
- **AND** after switching to Table view, the table keeps the page's 1600px maximum width

#### Scenario: An Ascension card shows orbs and shard bars as V1 did

- **GIVEN** an Ascension goal whose estimate needs 15 Onslaught tokens, which costs 20 Legendary orbs and 400 shards, and to which the plan applies 120 owned shards
- **WHEN** its card renders
- **THEN** the token chip sits at the right end of the row with the rarity icons, the orb chip renders on the row below, and a "Shards" bar below that reads "120 / 400", with no general progress bar, no shard chip and no Mythic shards bar

#### Scenario: An Ability card shows costs, track blocks and the level row as V1 did

- **GIVEN** an Ability goal raising Active 20 → 26 and Passive 20 → 50, costing 12 Epic ability badges and 505k gold, with a level requirement of Lv 40 → 50
- **WHEN** its card renders
- **THEN** the top row shows the gold and badge chips with the energy chip at its right end, then an "ACTIVE 20 → 26" block and a "PASSIVE 20 → 50" block sharing one row, then the level row without a gold chip, and no general progress bar

#### Scenario: A long project name is truncated in the meta line

- **GIVEN** a goal in a project named "V1 import · 26 Oct, 13:48 UTC"
- **WHEN** its card renders
- **THEN** the project badge is cut at its fixed width with an ellipsis, and hovering it shows the full name

#### Scenario: A phone shows the same card in one column

- **GIVEN** the same goal
- **WHEN** the Goals page renders at 420px wide
- **THEN** the card has the same header, body, notes section and footer in a single column, without a checkbox or drag handle outside select or reorder mode

#### Scenario: The footer chip pauses the goal

- **GIVEN** an Active goal that has not reached its target
- **WHEN** the user activates its footer status chip
- **THEN** the goal is paused through the same cascade as the menu's Pause item, and the chip then reads "Paused" with a resume action

#### Scenario: A goal with no notes and no estimate

- **GIVEN** a goal with no notes and no completion estimate
- **WHEN** its card renders
- **THEN** there is no notes section and the meta line shows only what applies (or is absent), and the footer still aligns with its neighbours
