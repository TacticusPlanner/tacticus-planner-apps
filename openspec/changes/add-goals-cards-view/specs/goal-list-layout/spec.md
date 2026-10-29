## ADDED Requirements

### Requirement: Desktop users choose between a Cards view and a Table view, Cards by default

At or above the mobile breakpoint, the Goals filters row (`goals-navigation`) SHALL contain a two-option Table/Cards toggle, with an accessible group name and an accessible name and pressed state for each option. Selecting an option SHALL switch the Goals list between the cards grid and the desktop table at once, without reloading goals or estimates, and SHALL keep the current filters, Group, project scope, season-fit mode, selection and scroll context.

The choice SHALL be stored in the account's user settings (`goalsView`, `Cards` or `Table`), so it follows the account across devices and browsers. It SHALL NOT be stored in the URL or in browser storage. The default SHALL be `Cards`. The client SHALL treat a missing or unrecognized stored value, a failed settings read, and a signed-out state as `Cards`.

While the account's settings read is still pending, the desktop list SHALL keep its loading skeleton rather than render either view, so a stored `Table` choice never flashes as cards. A failed settings read counts as decided.

Toggling SHALL be optimistic: the new view renders immediately and the save happens in the background. If the save is rejected as a revision conflict, the client SHALL take the current settings returned with the conflict, apply the chosen view on top of them, and retry once without user action. If the save still fails, the view SHALL revert to the stored value and a non-blocking error notice SHALL be announced.

Saving the Planning Settings dialog SHALL keep the stored Goals view unchanged, and changing the Goals view SHALL keep the stored daily energy and XP-book rarity unchanged.

Below the mobile breakpoint the toggle SHALL NOT render and the stored value SHALL NOT be changed.

#### Scenario: A new account sees cards

- **GIVEN** an account that has never chosen a Goals view
- **WHEN** it opens the Goals page at 1280px wide
- **THEN** the list renders as the cards grid and the toggle shows Cards as pressed

#### Scenario: Switching to Table persists across devices

- **GIVEN** the Goals page at 1280px wide in Cards view
- **WHEN** the user selects Table
- **THEN** the table renders at once, and after a reload, or when the same account signs in on another desktop browser, the Goals page opens in Table view

#### Scenario: A stored Table choice does not flash cards

- **GIVEN** an account whose stored Goals view is `Table` and whose settings read is slow
- **WHEN** the Goals page loads at 1280px wide
- **THEN** the list shows its loading skeleton until settings arrive and then renders the table, and the cards grid is never shown

#### Scenario: Settings fail to load

- **GIVEN** the account's settings request fails
- **WHEN** the Goals page renders at 1280px wide
- **THEN** the list renders as cards and the toggle remains usable

#### Scenario: A revision conflict is resolved silently

- **GIVEN** the account's settings changed on another device since this page loaded
- **WHEN** the user selects Table
- **THEN** the table stays shown, the client retries with the current revision, the stored view becomes `Table`, the other device's daily energy and XP-book rarity are kept, and no error is shown

#### Scenario: Planning Settings keeps the view

- **GIVEN** the stored Goals view is `Table`
- **WHEN** the user changes daily energy in Planning Settings and saves
- **THEN** the stored Goals view is still `Table`

#### Scenario: On mobile there is no toggle and the stored choice is kept

- **GIVEN** an account whose stored Goals view is `Table`
- **WHEN** it opens the Goals page at 420px wide
- **THEN** no Table/Cards toggle renders, the list renders as cards, and the stored view is still `Table` when the account next opens Goals on desktop

### Requirement: Goal cards share one layout on every platform

Wherever the Goals list renders as cards (Cards view at or above the mobile breakpoint, and every list below it), each goal SHALL render as one card in a grid whose columns are each at least 380px wide (or the full width, when narrower) and fill the available width. In Cards view the Goals tab SHALL NOT apply the page's maximum content width (1600px), so a wide screen adds columns rather than margins; the Table view and the other Goals-area tabs keep that maximum. Below the mobile breakpoint this grid is a single column. Cards in the same grid row SHALL be equal height, with their footers aligned. Wherever another requirement of this capability describes the mobile card or card behavior, it SHALL apply to this card on every platform.

Each card SHALL contain, from top to bottom:

1. **A header.** In order:
   - the selection checkbox (always at or above the mobile breakpoint; below it only while select mode is active, see `goal-bulk-actions`);
   - the account-wide priority number;
   - the drag handle, for an Active or Paused goal at or above the mobile breakpoint where reordering is available;
   - the unit avatar;
   - the unit name with, beneath it, a meta line holding the "Done By" date and day count (when an estimate exists), the season-fit label (when a mode is on), and the goal's project badges (when it has projects), wrapping as needed; a long project name is truncated at a fixed badge width, with the full name as its tooltip;
   - the "⋯" row-actions menu at the trailing edge.
2. **A body**, laid out in V1's row positions: each row's figures sit at its right end, with no separator lines or dividers between rows or figures. An Ascension or Ability goal uses V1's own body for its kind (below); every other kind, in order:
   - the target row: the goal line (the same from → to representation as the desktop Goal column) on the left, and the energy and Onslaught-token chips (`goal-remaining-resources`) at the right end;
   - the covered-by note, when applicable;
   - the progress bar with its percent readout (`goal-progress-display`);
   - the level row, when the goal has a level requirement: the XP-book figure, then its Potential-only bar, then the level target ("Lv 40 → 50"), and the gold chip at the right end, all centered on one line;
   - the remaining-resource chips that are not already on a row above (badges, forge badges, components, orbs, shards, shop currency, and gold when there is no level row), wrapping on the left.

   An **Ascension** goal's body, in order: the target row (as above); the covered-by note, when applicable; its orb chips on their own row; then one labelled bar per shard kind the goal costs ("Shards", "Mythic shards"), each reading the owned shards the plan applies to the goal's own steps against what those steps cost in total ("120 / 400"). It has no general progress bar, and the shard chips are replaced by these bars.

   An **Ability** goal's body, in order: a cost row with the ability badges, forge badges, components and gold on the left and the energy and Onslaught-token chips at its right end; the ability tracks still being raised as soft blocks sharing the row's width ("ACTIVE 20 → 26", "PASSIVE 20 → 50"); the covered-by note, when applicable; and the level row (XP-book figure, Potential-only bar, level target), without a gold chip. It has no general progress bar.

   Every chip the goal's kind defines still renders exactly once.

3. **A notes section**, only when the goal has notes. It is separated by a rule, shows the notes clamped to two lines, and makes the full text available as a tooltip.
4. **A footer**, separated by a rule and pinned to the bottom of the card. It holds the status chip and, when blocked, the Blocked or Restricted indicator. The status chip of a goal that has not reached its target and is Active or Paused SHALL be a one-click Pause/Resume control with an accessible name naming the status and the action. This is in addition to the menu's Pause/Resume item (`goal-status-actions`).

The goal type SHALL NOT be shown as text. A Reached goal's card SHALL keep this layout with the Reached treatment. The card SHALL reflow without horizontal scrolling at 200% browser zoom.

#### Scenario: A desktop card in Cards view

- **GIVEN** an Active Rank goal at priority 3, with notes, in project "Neuro", with a completion estimate of Oct 11 (in 22 days)
- **WHEN** it renders in Cards view at 1280px wide
- **THEN** its header shows a checkbox, "3", a drag handle, the avatar, the name and a meta line "📅 Oct 11 · 22 days" with the "Neuro" badge, and a "⋯" menu; its body shows the rank emblems with the energy chip at the right end of their row, then the progress bar, then the level line with the gold chip at its right end; a ruled section shows the notes; and its footer shows the "Active" chip with a pause action

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

### Requirement: Projects and notes have a fixed place in table rows and in cards

On the desktop table, a goal's project memberships SHALL render only in the standalone Projects column between Character and Goal, never inside the Character cell. A goal's notes SHALL render in the Character cell on one line directly beneath the unit name (where the goal-type caption used to be), truncated after one line, and SHALL NOT render as an extra line below the cell's other content. The Projects column SHALL appear on the Goals page and on a project's detail route alike. Wherever the list renders as cards, project badges SHALL render in the card header's meta line and notes in the card's notes section, as defined by "Goal cards share one layout on every platform".

#### Scenario: Project badges move to their own column

- **GIVEN** a goal that belongs to the projects "My Goals" and "Neuro"
- **WHEN** the desktop table renders its row
- **THEN** both badges render in the Projects cell between the Character and Goal cells, and the Character cell contains no project badge

#### Scenario: Notes render on one line under the name

- **GIVEN** a goal with the notes "some notes"
- **WHEN** the desktop table renders its row
- **THEN** "some notes" renders on a single line directly beneath the unit name, inside the fixed row height

#### Scenario: Long notes are truncated after one line

- **GIVEN** a goal whose notes are longer than the Character cell's width
- **WHEN** the desktop table renders its row
- **THEN** the notes show on one line ending in an ellipsis, and the full text is available as a tooltip

#### Scenario: A goal in no project

- **GIVEN** a goal that belongs to no project
- **WHEN** the desktop table renders its row
- **THEN** the Projects cell is empty and the row keeps its height and column alignment

#### Scenario: Cards place projects in the header and notes in their own section

- **GIVEN** a goal with notes and the projects "My Goals" and "Neuro"
- **WHEN** it renders as a card, in desktop Cards view or below 768px
- **THEN** both badges render in the header's meta line and the notes render in the ruled notes section, clamped to two lines

## MODIFIED Requirements

### Requirement: The list switches from table to cards at the app's mobile breakpoint

Below the mobile breakpoint (768px, `useIsMobile()`, the same breakpoint the rest of the app uses to tell its desktop and mobile UI forms apart), the Goals list SHALL always render as cards, whatever the account's stored Goals view. At or above it, the list SHALL render as the cards grid or the desktop table according to the account's stored Goals view (see "Desktop users choose between a Cards view and a Table view, Cards by default"), with Cards as the default. No other width threshold SHALL change the layout.

#### Scenario: Below the mobile breakpoint

- **GIVEN** the viewport is narrower than 768px and the stored Goals view is either `Cards` or `Table`
- **WHEN** the Goals list renders
- **THEN** it renders as cards, not the desktop table in any column configuration

#### Scenario: At or above the mobile breakpoint, Cards view

- **GIVEN** the viewport is 768px or wider and the stored Goals view is `Cards` or unset
- **WHEN** the Goals list renders
- **THEN** it renders as the cards grid

#### Scenario: At or above the mobile breakpoint

- **GIVEN** the viewport is 768px or wider and the stored Goals view is `Table`
- **WHEN** the Goals list renders
- **THEN** it renders as the desktop table with its full, static column set

### Requirement: The Actual/Potential legend renders once per list, only when relevant, not per row

When at least one visible goal has both an Actual and a Potential ratio to show, the "Actual" / "Potential" swatch legend SHALL render exactly once per list: in the Progress column's header on the desktop table, and above the first card wherever the list renders as cards (desktop Cards view and mobile). It SHALL NOT repeat per row or per card, and it replaces the old per-row "Actual progress" / "Potential progress" caption labels, which moved into `goal-progress-display`'s on-demand explanation. When no visible goal has a Potential ratio, the legend SHALL NOT render at all, since it would have nothing to distinguish.

#### Scenario: Desktop table with multiple goals showing both ratios

- **GIVEN** the Goals list renders three Rank goal rows in Table view, each with both an Actual and a Potential ratio
- **WHEN** the table renders
- **THEN** the legend appears once, in the Progress column header, and no row repeats it

#### Scenario: Mobile list with multiple goals showing both ratios

- **GIVEN** the same three goals render as cards below 768px
- **WHEN** the list renders
- **THEN** the legend appears once, above the first card, and no card repeats it

#### Scenario: Desktop Cards view with multiple goals showing both ratios

- **GIVEN** the same three goals render in desktop Cards view
- **WHEN** the grid renders
- **THEN** the legend appears once, above the grid, and no card repeats it

#### Scenario: No goal in the list has a Potential ratio

- **GIVEN** the Goals list renders only Unlock goals, which never compute a Potential ratio
- **WHEN** the list renders, as a table or as cards
- **THEN** no legend renders

### Requirement: In-flight rows show their account-wide priority position

Wherever the Goals list renders Active or Paused goals in priority order (the Goals page, `/plan/goals`, with or without a project scope), each such row or card SHALL show the goal's account-wide priority position (`globalPriority`, 1 to N across every Active and Paused goal) as visible text: in the row's leading cell beside the drag handle on the desktop table, and in the card header wherever the list renders as cards. The position is not a seventh column and SHALL NOT change the six-column contract. It SHALL be the goal's position in the whole account order, never its index among the visible rows: with filters, Group, or a project view, the visible rows show non-consecutive numbers. Rows and cards without a position (Reached, Completed, or Archived goals) SHALL show none and SHALL leave that slot empty. The number SHALL appear in Comfortable and Compact density and on every card, SHALL meet the text-contrast rules of `goal-visual-accessibility`, and SHALL be part of the row's or card's accessible name or description (for example "Priority 3"). While a reorder is in flight or awaiting rollback, the numbers SHALL follow the same optimistic update as the order: the moved goal takes the displaced goal's number and the goals between them shift by one, reverting with the order on rollback.

#### Scenario: Active and Paused rows show a position

- **GIVEN** the account has goals with global positions 1 to 5, one of them Paused
- **WHEN** the Goals page renders unfiltered
- **THEN** every row or card shows its number 1 to 5, including the Paused one

#### Scenario: Goals without a position show none

- **GIVEN** a Reached, Completed, or Archived goal is visible
- **WHEN** its row or card renders
- **THEN** no priority number is shown and it keeps the same layout as its neighbours

#### Scenario: Filtered or project views show account-wide numbers

- **GIVEN** global order A, B, C, D, E (positions 1 to 5) and a project holding A, C, and E
- **WHEN** the Goals page renders scoped to that project
- **THEN** its rows or cards show 1, 3, and 5, not 1, 2, and 3, and the same goals show the same numbers on the Goals page

#### Scenario: Compact density and mobile cards keep the number

- **WHEN** the list renders in Compact density on desktop, as desktop Cards view, or as cards below 768px
- **THEN** each Active or Paused row or card still shows its number

#### Scenario: A reorder updates the numbers optimistically

- **GIVEN** global order A, B, C, D, E and a project holding A, C, and E
- **WHEN** the user moves E onto C on the Goals page scoped to that project
- **THEN** the rows or cards immediately read A 1, E 3, C 4, and the Goals page shows A 1, B 2, E 3, C 4, D 5
- **AND** if the move is rejected the numbers return to A 1, C 3, E 5

### Requirement: Desktop table uses static columns with a leading control cell and a row menu

At or above the mobile breakpoint, while the Table view is selected (see "Desktop users choose between a Cards view and a Table view, Cards by default"), the Goals list SHALL render as a table with these data columns, in order: Character, Projects, Goal, Progress, "Status · Done by", and Remaining. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width. The only width-driven layout change is the 768px switch to cards. A column set that changed with width was tried and rejected, because it made the page feel like it was "jumping" as the table resized. Remaining SHALL be the last column, so its chips can wrap without displacing any fixed-width content to its right.

The Character column SHALL show the unit's avatar, its name, and, when the goal has notes, the notes on a single line directly beneath the name (truncated with an ellipsis after that one line, the full text available as a tooltip). It SHALL NOT show the goal type as a text caption or the goal's project badges; the goal type is instead encoded in the Goal column (see "The Goal column encodes the goal kind visually, without a type label"). At the trailing edge of the Character cell, every row SHALL render an always-visible "⋯" menu trigger with an accessible name, opening the row's actions menu: Edit, then Pause or Resume (for a goal that is not Reached and is Active or Paused respectively, see `goal-status-actions`), then Delete as a destructive item. There SHALL be no separate Actions column and no inline Edit or Delete icon buttons in the row. The status chip in the "Status · Done by" column of a goal that has not reached its target and is Active or Paused SHALL be a one-click Pause/Resume control, in addition to the menu item. The Projects column SHALL show the goal's project-membership badges (colour dot and project name, wrapping within the cell), and SHALL be empty for a goal in no project; its header text SHALL be visible. The Goal column SHALL show the goal's from → to representation as defined by "The Goal column encodes the goal kind visually, without a type label". The "Status · Done by" column SHALL show the goal's Active/Blocked/etc. status label(s) on one line, with the existing `goal-list-estimate-display` "Done By" date-and-day-count content on a second line directly beneath when a completion estimate is available. When no estimate is available, the second line SHALL be omitted rather than showing a placeholder. A blocked estimate's per-material detail SHALL NOT render in the cell; it is the Blocked indicator's tooltip content (see `goal-list-estimate-display`).

Each row SHALL render at a fixed height sized to one line of content per column, with the Character column's name-and-notes lines and the "Status · Done by" column's two stacked lines fitting within that same fixed height. There SHALL be two exceptions: a row whose Progress cell carries level-requirement sub-lines, and a row whose Remaining chips wrap beyond two lines (see `goal-remaining-resources`: every chip renders). Such a row SHALL grow only as far as its wrapped content needs, and no other row SHALL change height because of it. The existing alternating row (zebra) striping SHALL be preserved.

Every desktop row SHALL have a leading cell before the Character column holding, in order: the selection checkbox (`goal-bulk-actions`), the account-wide priority number for an in-flight row, and a drag handle for each Active or Paused row whenever the table renders on a route where inline reordering is available (the Goals page, with or without a project scope; see `global-goal-priority`'s "Owner can reorder from Goals"). This cell holds controls, not data, and does not change the six static columns above. The handle appears only in a reorderable context; that is a distinction by context, not the width-based column hiding this requirement otherwise prohibits.

Assumptions:

- Column widths are a layout implementation detail and are not restated here in pixels. The column order, content and fixed row height are the observable, testable behavior. The Remaining column SHALL be wide enough that a Machine of War Ability goal needing badges of every rarity, forge badges, components, gold and energy fits in at most three chip lines at a 1280px-wide viewport with the sidebar open.

#### Scenario: A goal with a completion estimate

- **GIVEN** a Rank goal has status "Active", is "Blocked", and has a computed completion estimate of October 11th (in 22 days)
- **WHEN** the row renders
- **THEN** the "Status · Done by" column shows "Active" and "Blocked" on the first line and "📅 Oct 11 · in 22 days" on the second line

#### Scenario: A goal with no completion estimate

- **GIVEN** a goal has status "Active" and no computed completion estimate (no project selected, or the goal kind is not farmable)
- **WHEN** the row renders
- **THEN** the "Status · Done by" column shows only "Active", with no second line and no placeholder such as "—"

#### Scenario: The Remaining column stays visible at every desktop width

- **GIVEN** the viewport is at or above the mobile breakpoint, at any desktop width, and Table view is selected
- **WHEN** the Goals list renders
- **THEN** it renders as a table with all six data columns in the order Character, Projects, Goal, Progress, Status · Done by, Remaining, and no width threshold hides or restores any of them

#### Scenario: A drag handle appears only in a reorderable context

- **GIVEN** the same Active goal renders once on the Goals page and once in a list that is not reorderable
- **WHEN** each list renders as a desktop table
- **THEN** the Goals page row shows a leading drag handle and the other row does not, with both rows otherwise showing the same six columns

#### Scenario: The row menu holds every row action

- **GIVEN** an Active goal that has not reached its target
- **WHEN** its "⋯" menu at the end of the Character cell is opened
- **THEN** it lists Edit, Pause and Delete, in that order, and the row shows no inline Edit or Delete icon button

#### Scenario: No Actions column

- **WHEN** the desktop table renders
- **THEN** no column follows Remaining and no column header reads "Actions", visibly or for assistive technology

#### Scenario: A Machine of War row with many chips grows

- **GIVEN** a Machine of War Ability goal whose Remaining chips wrap to three lines
- **WHEN** the table renders
- **THEN** that row is taller than its neighbours, every chip is visible, and the neighbouring rows keep the fixed height

## REMOVED Requirements

### Requirement: Mobile renders one card per goal with a header menu and select-mode checkbox

**Reason**: Replaced by "Goal cards share one layout on every platform". The same V1-layout card now renders on desktop (Cards view) and mobile, so the mobile-only card definition and its scenario forbidding an inline pause control (already contradicted by the shipped status chip toggle) no longer apply.

**Migration**: The header menu, the select-mode checkbox, the done-by caption, the goal line, the progress bar, the level-requirement sub-lines and the remaining chips all carry over into the new card requirement. The status label moves from the header to the card footer, and project badges move to the header meta line.

### Requirement: Projects are their own column, and notes sit under the name

**Reason**: Replaced by "Projects and notes have a fixed place in table rows and in cards". The desktop table placement is unchanged, but the old requirement kept the mobile card's notes line and body badges "unchanged", which no longer holds now that one card renders everywhere.

**Migration**: The table rules (Projects column, one-line notes under the name, tooltip) carry over word for word. On cards, project badges move to the header meta line and notes move to a ruled section clamped to two lines.
