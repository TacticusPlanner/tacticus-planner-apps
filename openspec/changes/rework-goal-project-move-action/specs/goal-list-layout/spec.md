## MODIFIED Requirements

### Requirement: Desktop table uses fixed-width, static columns at a fixed row height

At or above the mobile breakpoint (see the platform-switch requirement below), the Goals list SHALL render as a table with these columns, in order: Character, Goal, Progress, Remaining, "Status · Done by", and Actions. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width — the only layout change at any desktop width is the fixed set of columns above, and the only responsive change at all is the 768px table→card switch (see the platform-switch requirement below). A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. The Character column SHALL show the unit's avatar, its name as a link, and the goal type as a small muted-foreground caption beneath the name; the previously separate Type column is removed. (No coloured dot: this repo has no existing per-goal-type colour token to reuse, and it was dropped as a cosmetic mockup detail with no testable scenario.) The Goal column SHALL show the goal's from → to representation (rank icons, "Lv 44 → 50", or "273 / 500 shards", matching each goal kind's existing target representation). The "Status · Done by" column SHALL show the goal's Active/Blocked/etc. status label(s) on one line, with the existing `goal-list-estimate-display` "Done By" date-and-day-count content on a second line directly beneath when a completion estimate is available; when no estimate is available, the second line SHALL be omitted rather than showing a placeholder. The Actions column SHALL render the row's project-removal-or-move and Delete actions as inline icon buttons, alongside the existing primary pause/resume icon (`goal-status-actions`), rather than only inside the "⋯" menu; the "⋯" menu SHALL render only when it still has at least one applicable item (Archive or Unarchive). Its column header text SHALL remain present for assistive technology but SHALL NOT render visibly.

Each row SHALL render at a fixed height sized to one line of content per column (with the Character and "Status · Done by" columns' two stacked lines accommodated within that same fixed height), a substantial reduction from today's variable, content-driven row height. The existing alternating row (zebra) striping SHALL be preserved.

When the table renders on a route where inline reordering is available (project detail — see `project-management`'s "Goals are reordered individually via inline drag"), each row SHALL additionally show a leading drag handle before the Character column. This handle is a control affordance, not a seventh data column, and does not change the six static columns above; it is present only in a reorderable context and absent elsewhere (for example, the non-reorderable Goals Overview list), which is a context-conditional distinction, not the width-conditional column-hiding this requirement otherwise prohibits.

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
- **THEN** it renders as a table with all six columns, Remaining included — no width threshold hides or restores it

#### Scenario: A drag handle appears only in a reorderable context

- **GIVEN** the same goal renders once on project detail and once on the Goals Overview list
- **WHEN** each list renders as a desktop table
- **THEN** the project detail row shows a leading drag handle and the Goals Overview row does not, with both rows otherwise showing the same six columns

#### Scenario: Project-removal-or-move and Delete render as icons on desktop

- **GIVEN** the Goals list renders as a desktop table
- **WHEN** a row's Actions column renders
- **THEN** its project-removal-or-move action and Delete each render as their own icon button in the row, not only as items inside a "⋯" menu

#### Scenario: The "⋯" menu is absent when it would otherwise be empty

- **GIVEN** a goal is Active or Paused and has not reached its target (Archive is unavailable) and is not Archived (Unarchive is unavailable)
- **WHEN** its row renders as a desktop table
- **THEN** no "⋯" menu trigger is rendered, since it would offer nothing
