## MODIFIED Requirements

### Requirement: Desktop table uses static columns with a leading control cell and a row menu

At or above the mobile breakpoint (see the platform-switch requirement), the Goals list SHALL render as a table with these data columns, in order: Character, Projects, Goal, Status, "Done by", Remaining, and Progress. Progress is last and narrow: it is the least-scanned figure in the row (UserJot "V2 Goals Page Is Harder to Scan"), so the status, completion date, day count and energy come before it. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width — the only layout change at any desktop width is the fixed set of columns above, and the only responsive change at all is the 768px table→card switch. A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. Progress SHALL be the last column at a fixed narrow width; Remaining chips wrap within their own cell.

The Character column SHALL show the unit's avatar (drawn larger than the 40px V2 launch size so it reads like V1's goal cards), its name, and, when the goal has notes, the notes on a single line directly beneath the name (truncated with an ellipsis after that one line, the full text available as a tooltip), and SHALL NOT show the goal type as a text caption or the goal's project badges; the goal type is instead encoded in the Goal column (see "The Goal column encodes the goal kind visually, without a type label"). At the trailing edge of the Character cell, every row SHALL render an always-visible "⋯" menu trigger with an accessible name, opening the row's actions menu: Edit, then Pause or Resume (for a goal that is not Reached and is Active or Paused respectively — see `goal-status-actions`), then Delete as a destructive item. There SHALL be no separate Actions column and no inline action icon buttons in the row. The Projects column SHALL show the goal's project-membership badges (colour dot and project name, wrapping within the cell), and SHALL be empty for a goal in no project; its header text SHALL be visible. The Goal column SHALL show the goal's from → to representation as defined by "The Goal column encodes the goal kind visually, without a type label", with the rank and rarity emblems drawn at the large size. The Status column SHALL show only the goal's status chip(s) (Active/Paused toggle, Reached, Blocked/Restricted), drawn at body-text size so Active and Paused read at a glance. The "Done by" column SHALL show the `goal-list-estimate-display` completion date as its headline (body-text size, foreground colour) with the day count on a line directly beneath, and any season-fit label under that; when no estimate is available the cell SHALL be empty rather than showing a placeholder; a blocked estimate's per-material detail SHALL NOT render in the cell (it is the Blocked indicator's tooltip content, see `goal-list-estimate-display`).

Each row SHALL render at a fixed height sized to one line of content per column (with the Character column's name-and-notes lines and the "Done by" column's date-and-days lines accommodated within that same fixed height). Two exceptions SHALL exist: a row whose Progress cell carries level-requirement sub-lines, and a row whose Remaining chips wrap beyond two lines (see `goal-remaining-resources`: every chip renders) — such a row SHALL grow only as far as its wrapped content needs, and no other row SHALL change height because of it. The existing alternating row (zebra) striping SHALL be preserved.

Every desktop row SHALL have a leading cell before the Character column holding, in order: the selection checkbox (`goal-bulk-actions`), the account-wide priority number for an in-flight row, and — when the table renders on a route where inline reordering is available (the Goals page, with or without a project scope — see `global-goal-priority`'s "Owner can reorder from Goals") — a drag handle for each Active or Paused row. This cell holds control affordances, not a data column, and does not change the seven static columns above; the handle is present only in a reorderable context and absent elsewhere, which is a context-conditional distinction, not the width-conditional column-hiding this requirement otherwise prohibits.

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

- **GIVEN** the viewport is at or above the mobile breakpoint, at any desktop width
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

### Requirement: The Remaining column shows resource chips, not prose

For a goal that has not reached its target, the Remaining cell (desktop) and the remaining area of the card (mobile) SHALL show the resource chips defined by `goal-remaining-resources` in place of the previous sentence. The Remaining cell SHALL NOT show an upgrade-slot count ("N slots") or a raw XP figure ("N XP"). Remaining sits between "Done by" and Progress on the desktop table (see "Desktop table uses static columns with a leading control cell and a row menu"), and its chips SHALL use icons and text at least as large as the row's body text so the energy figure reads at a glance.

#### Scenario: A Rank goal no longer shows slots

- **GIVEN** a Rank goal with remaining upgrade slots and a farming estimate
- **WHEN** its Remaining cell renders
- **THEN** the cell shows resource chips and no "slots" text

#### Scenario: A goal needing a level-up shows no level text in Remaining

- **GIVEN** a Rank or Ability goal whose character is below the required level
- **WHEN** its Remaining cell renders
- **THEN** no "N XP" and no "N levels" text appears, and the XP-book figure is shown with the level line in the Progress cell instead

### Requirement: In-flight rows show their account-wide priority position

Wherever the Goals list renders Active or Paused goals in priority order — the Goals page (`/plan/goals`), with or without a project scope — each such row SHALL show the goal's account-wide priority position (`globalPriority`, 1 to N across every Active and Paused goal) as visible text in the row's leading cell beside the drag handle on the desktop table, and in the card header on mobile. The position is not a data column and SHALL NOT change the seven-column contract. It SHALL be the goal's position in the whole account order, never its index among the visible rows: with filters, Group, or a project view, the visible rows show non-consecutive numbers. Rows without a position (Reached, Completed, or Archived goals) SHALL show none and SHALL leave the leading cell empty. The number SHALL appear in Comfortable and Compact density and on mobile cards, SHALL meet the text-contrast rules of `goal-visual-accessibility`, and SHALL be part of the row's accessible name or description (for example "Priority 3"). While a reorder is in flight or awaiting rollback, the numbers SHALL follow the same optimistic update as the order: the moved goal takes the displaced goal's number and the goals between them shift by one, reverting with the order on rollback.

#### Scenario: Active and Paused rows show a position

- **GIVEN** the account has goals with global positions 1 to 5, one of them Paused
- **WHEN** the Goals page renders unfiltered
- **THEN** every row shows its number 1 to 5 in the leading cell, including the Paused one

#### Scenario: Goals without a position show none

- **GIVEN** a Reached, Completed, or Archived goal is visible
- **WHEN** its row renders
- **THEN** no priority number is shown and the row keeps the same layout as its neighbours

#### Scenario: Filtered or project views show account-wide numbers

- **GIVEN** global order A, B, C, D, E (positions 1 to 5) and a project holding A, C, and E
- **WHEN** the Goals page renders scoped to that project
- **THEN** its rows show 1, 3, and 5, not 1, 2, and 3, and the same goals show the same numbers on the Goals page

#### Scenario: Compact density and mobile cards keep the number

- **WHEN** the list renders in Compact density on desktop, or as mobile cards below 768px
- **THEN** each Active or Paused row or card still shows its number

#### Scenario: A reorder updates the numbers optimistically

- **GIVEN** global order A, B, C, D, E and a project holding A, C, and E
- **WHEN** the user moves E onto C on the Goals page scoped to that project
- **THEN** the rows immediately read A 1, E 3, C 4, and the Goals page shows A 1, B 2, E 3, C 4, D 5
- **AND** if the move is rejected the numbers return to A 1, C 3, E 5
