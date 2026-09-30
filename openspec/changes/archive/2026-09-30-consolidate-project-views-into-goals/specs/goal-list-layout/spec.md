## MODIFIED Requirements

### Requirement: Desktop table uses fixed-width, static columns at a fixed row height

At or above the mobile breakpoint (see the platform-switch requirement below), the Goals list SHALL render as a table with these columns, in order: Character, Projects, Goal, Progress, Remaining, "Status · Done by", and Actions. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width — the only layout change at any desktop width is the fixed set of columns above, and the only responsive change at all is the 768px table→card switch (see the platform-switch requirement below). A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. The Character column SHALL show the unit's avatar, its name as a link, and, when the goal has notes, the notes on a single line directly beneath the name (truncated with an ellipsis after that one line, the full text available as a tooltip), and SHALL NOT show the goal type as a text caption or the goal's project badges; the goal type is instead encoded in the Goal column (see "The Goal column encodes the goal kind visually, without a type label"). (No coloured dot: this repo has no existing per-goal-type colour token to reuse, and it was dropped as a cosmetic mockup detail with no testable scenario.) The Projects column SHALL show the goal's project-membership badges (colour dot and project name, wrapping within the cell), and SHALL be empty for a goal in no project; its header text SHALL be visible. The Goal column SHALL show the goal's from → to representation as defined by "The Goal column encodes the goal kind visually, without a type label". The "Status · Done by" column SHALL show the goal's Active/Blocked/etc. status label(s) on one line, with the existing `goal-list-estimate-display` "Done By" date-and-day-count content on a second line directly beneath when a completion estimate is available; when no estimate is available, the second line SHALL be omitted rather than showing a placeholder. The Actions column SHALL render the row's project-removal-or-move and Delete actions as inline icon buttons, alongside the existing primary pause/resume icon (see `goal-status-actions`'s "Pause and resume are primary row actions"), rather than only inside the "⋯" menu; the desktop row SHALL NOT render a "⋯" menu, since no goal action lives only in it (Archive and Unarchive no longer exist). Its column header text SHALL remain present for assistive technology but SHALL NOT render visibly.

Each row SHALL render at a fixed height sized to one line of content per column (with the Character column's name-and-notes lines and the "Status · Done by" column's two stacked lines accommodated within that same fixed height), a substantial reduction from today's variable, content-driven row height. The existing alternating row (zebra) striping SHALL be preserved.

When the table renders on a route where inline reordering is available (the Goals page, with or without a project scope — see `global-goal-priority`'s "Owner can reorder from Goals"), each Active or Paused row SHALL additionally show a leading drag handle before the Character column. This handle is a control affordance, not a seventh data column, and does not change the six static columns above; it is present only in a reorderable context and absent elsewhere (for example, the Insights page or any list that is not in priority order), which is a context-conditional distinction, not the width-conditional column-hiding this requirement otherwise prohibits.

Assumptions:

- Column widths are a layout implementation detail (not restated here in pixels); the ordering, content, and fixed row height are the externally observable, testable behavior.

#### Scenario: A goal with a completion estimate

- **GIVEN** a Rank goal has status "Active", is "Blocked", and has a computed completion estimate of October 11th (in 22 days)
- **WHEN** the row renders
- **THEN** the "Status · Done by" column shows "Active" and "Blocked" on the first line and "📅 Oct 11 · in 22 days" on the second line

#### Scenario: A goal with no completion estimate

- **GIVEN** a goal has status "Active" and no computed completion estimate (no project selected, or the goal kind is not farmable)
- **WHEN** the row renders
- **THEN** the "Status · Done by" column shows only "Active", with no second line and no placeholder such as "—"

#### Scenario: The Remaining column stays visible at every desktop width

- **GIVEN** the viewport is at or above the mobile breakpoint, at any desktop width
- **WHEN** the Goals list renders
- **THEN** it renders as a table with all seven columns, Remaining included — no width threshold hides or restores it

#### Scenario: A drag handle appears only in a reorderable context

- **GIVEN** the same Active goal renders once on the Goals page and once in a list that is not reorderable
- **WHEN** each list renders as a desktop table
- **THEN** the Goals page row shows a leading drag handle and the other row does not, with both rows otherwise showing the same seven columns

#### Scenario: Project-removal-or-move and Delete render as icons on desktop

- **GIVEN** the Goals list renders as a desktop table
- **WHEN** a row's Actions column renders
- **THEN** its project-removal-or-move action and Delete each render as their own icon button in the row, not only as items inside a "⋯" menu

#### Scenario: The "⋯" menu is absent when it would otherwise be empty

- **GIVEN** any goal
- **WHEN** its row renders as a desktop table
- **THEN** no "⋯" menu trigger is rendered, since it would offer nothing

### Requirement: A Rank or Ability goal shows its level requirement as sub-lines of its own row or card

Wherever the Goals list renders (desktop table or mobile cards, on the Goals page, with or without a project scope), a Rank or Ability goal whose character is below the level its target needs SHALL render that requirement as sub-lines nested under the goal's own cells or card body, using the level-requirement display defined by `rank-level-progression`: one combined line in the Progress cell, beneath the goal's own progress: the level target "Lv {{current}} → {{required}}", the XP-book figure (the book icon with the available and needed counts, per `goal-remaining-resources`), and a Potential-only progress bar (owned XP books' reach, with no Actual fill because Actual level has not reached the requirement), in the same manner as the Unlock goal's "329 / 500" count sits beside its bar. The Goal cell SHALL show only the goal's own target (no level line), and the Remaining cell SHALL NOT show a "{{levels}} levels" or XP text for the requirement. The requirement SHALL never render as its own row or card, and SHALL NOT be rendered as a separate goal, a dependency, or a Restricted reason. When the character is at or above the required level, or the goal is not a Character Rank or Ability goal, no requirement sub-lines SHALL render.

#### Scenario: Desktop Rank row below its required level

- **GIVEN** a Rank goal whose character is at level 30 and whose target requires level 32
- **WHEN** the desktop table renders
- **THEN** exactly one row exists for the goal, and its Progress cell shows one combined line with "Lv 30 → 32", the XP-book figure and a Potential-only bar beneath the goal's own progress, its Goal cell shows no level line, and its Remaining cell shows no "levels" or XP text

#### Scenario: Mobile card below its required level

- **GIVEN** an Ability goal whose character is below the level its target implies
- **WHEN** the mobile card list renders
- **THEN** the card shows the same combined level line (target level, XP-book figure and Potential-only bar) within the Ability goal's own progress area, with no separate remaining text for it

#### Scenario: Level requirement is met

- **GIVEN** a Rank goal whose character is at or above the level its target needs
- **WHEN** the list renders on desktop or mobile
- **THEN** no requirement sub-lines appear for that goal

#### Scenario: A goal that is not a Character Rank or Ability goal

- **GIVEN** an Unlock, Ascension, Upgrade, or Machine-of-War goal
- **WHEN** the list renders
- **THEN** no requirement sub-lines appear for that goal

### Requirement: A Reached goal renders as a completed row or card

Wherever the Goals list renders (desktop table or mobile cards, on the Goals page, with or without a project scope), a goal whose computed attainment is Reached SHALL render with a green-tinted row/card background and a completed check mark beside its status label, and its status label SHALL read "Reached" in place of its stored "Active"/"Paused" label. This is display only: the goal's stored status, priority position, and sort order SHALL NOT change. The Progress and Remaining values, and the "Done by" estimate content, SHALL each render as "-" for a Reached goal. Its Character and Goal cells (unit, from → to target) SHALL render as for any other goal. The tint and check mark SHALL meet the contrast requirements of `goal-visual-accessibility` in both themes, and the state SHALL be conveyed by the check mark and label as well as by color.

#### Scenario: A reached Active goal on the desktop table

- **GIVEN** a goal with stored status `Active` whose target is reached
- **WHEN** the desktop table renders its row
- **THEN** the row has a green-tinted background, its status cell shows a check mark and "Reached", and its Progress, Remaining and Done by values each read "-"

#### Scenario: A reached Paused goal keeps its stored status

- **GIVEN** a goal with stored status `Paused` whose target is reached
- **WHEN** its row renders
- **THEN** the label reads "Reached" and no request changes the goal's stored status

#### Scenario: A reached goal on a mobile card

- **GIVEN** a goal whose target is reached
- **WHEN** the mobile card renders
- **THEN** the card has the same green tint, check mark and "Reached" label, with "-" in place of its progress, remaining and estimate content

#### Scenario: Reached goals appear under the Reached filter, not hidden

- **GIVEN** the status filter is set to "Reached"
- **WHEN** the list renders
- **THEN** every Reached goal is listed as a completed row, in the same priority order as other rows

### Requirement: In-flight rows show their account-wide priority position

Wherever the Goals list renders Active or Paused goals in priority order — the Goals page (`/plan/goals`), with or without a project scope — each such row SHALL show the goal's account-wide priority position (`globalPriority`, 1 to N across every Active and Paused goal) as visible text in the row's leading cell beside the drag handle on the desktop table, and in the card header on mobile. The position is not a seventh column and SHALL NOT change the six-column contract. It SHALL be the goal's position in the whole account order, never its index among the visible rows: with filters, Group, or a project view, the visible rows show non-consecutive numbers. Rows without a position (Reached, Completed, or Archived goals) SHALL show none and SHALL leave the leading cell empty. The number SHALL appear in Comfortable and Compact density and on mobile cards, SHALL meet the text-contrast rules of `goal-visual-accessibility`, and SHALL be part of the row's accessible name or description (for example "Priority 3"). While a reorder is in flight or awaiting rollback, the numbers SHALL follow the same optimistic update as the order: the moved goal takes the displaced goal's number and the goals between them shift by one, reverting with the order on rollback.

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
