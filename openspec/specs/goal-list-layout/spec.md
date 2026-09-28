# goal-list-layout Specification

## Purpose

Defines the Goals list's structural presentation — the desktop table's static columns, widths, and row density, and the mobile card structure it switches to — independent of how an individual goal's progress bar, percent, and explanation render (that is `goal-progress-display`'s concern).

## Requirements

### Requirement: Desktop table uses fixed-width, static columns at a fixed row height

At or above the mobile breakpoint (see the platform-switch requirement below), the Goals list SHALL render as a table with these columns, in order: Character, Goal, Progress, Remaining, "Status · Done by", and Actions. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width — the only layout change at any desktop width is the fixed set of columns above, and the only responsive change at all is the 768px table→card switch (see the platform-switch requirement below). A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. The Character column SHALL show the unit's avatar, its name as a link, and the goal type as a small muted-foreground caption beneath the name; the previously separate Type column is removed. (No coloured dot: this repo has no existing per-goal-type colour token to reuse, and it was dropped as a cosmetic mockup detail with no testable scenario.) The Goal column SHALL show the goal's from → to representation (rank icons, "Lv 44 → 50", or "273 / 500 shards", matching each goal kind's existing target representation). The "Status · Done by" column SHALL show the goal's Active/Blocked/etc. status label(s) on one line, with the existing `goal-list-estimate-display` "Done By" date-and-day-count content on a second line directly beneath when a completion estimate is available; when no estimate is available, the second line SHALL be omitted rather than showing a placeholder. The Actions column SHALL render the row's project-removal-or-move and Delete actions as inline icon buttons, alongside the existing primary pause/resume icon (see `goal-status-actions`'s "Pause and resume are primary row actions"), rather than only inside the "⋯" menu; the "⋯" menu SHALL render only when it still has at least one applicable item (Archive or Unarchive). Its column header text SHALL remain present for assistive technology but SHALL NOT render visibly.

Each row SHALL render at a fixed height sized to one line of content per column (with the Character and "Status · Done by" columns' two stacked lines accommodated within that same fixed height), a substantial reduction from today's variable, content-driven row height. The existing alternating row (zebra) striping SHALL be preserved.

When the table renders on a route where inline reordering is available (the Goals page and project detail — see `global-goal-priority`'s "Owner can reorder from Goals" and `project-management`'s "Goals are reordered individually via inline drag"), each Active or Paused row SHALL additionally show a leading drag handle before the Character column. This handle is a control affordance, not a seventh data column, and does not change the six static columns above; it is present only in a reorderable context and absent elsewhere (for example, the Insights page or any list that is not in priority order), which is a context-conditional distinction, not the width-conditional column-hiding this requirement otherwise prohibits.

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

- **GIVEN** the same Active goal renders once on the Goals page and once in a list that is not reorderable
- **WHEN** each list renders as a desktop table
- **THEN** the Goals page row shows a leading drag handle and the other row does not, with both rows otherwise showing the same six columns

#### Scenario: Project-removal-or-move and Delete render as icons on desktop

- **GIVEN** the Goals list renders as a desktop table
- **WHEN** a row's Actions column renders
- **THEN** its project-removal-or-move action and Delete each render as their own icon button in the row, not only as items inside a "⋯" menu

#### Scenario: The "⋯" menu is absent when it would otherwise be empty

- **GIVEN** a goal is Active or Paused and has not reached its target (Archive is unavailable) and is not Archived (Unarchive is unavailable)
- **WHEN** its row renders as a desktop table
- **THEN** no "⋯" menu trigger is rendered, since it would offer nothing

### Requirement: The list switches from table to cards at the app's mobile breakpoint

The switch from the desktop table to the mobile card layout SHALL occur at the same breakpoint (768px, `useIsMobile()`) this app already uses to distinguish its desktop and mobile UI forms elsewhere, keeping the Goals list consistent with every other page's platform switch rather than introducing a second, page-specific threshold.

#### Scenario: Below the mobile breakpoint

- **GIVEN** the viewport is narrower than 768px
- **WHEN** the Goals list renders
- **THEN** it renders as the mobile card layout, not the desktop table in any column configuration

#### Scenario: At or above the mobile breakpoint

- **GIVEN** the viewport is 768px or wider
- **WHEN** the Goals list renders
- **THEN** it renders as the desktop table with its full, static column set

### Requirement: The Actual/Potential legend renders once per list, only when relevant, not per row

When at least one visible goal has both an Actual and a Potential ratio to show, the "Actual" / "Potential" swatch legend SHALL render exactly once per list: in the Progress column's header on the desktop table, and at the top of the list above the first card on mobile. It SHALL NOT repeat per row or per card, replacing today's per-row "Actual progress" / "Potential progress" caption labels (moved into `goal-progress-display`'s on-demand explanation). When no visible goal has a Potential ratio, the legend SHALL NOT render at all, since it would have nothing to distinguish.

#### Scenario: Desktop table with multiple goals showing both ratios

- **GIVEN** the Goals list renders three Rank goal rows, each with both an Actual and a Potential ratio
- **WHEN** the table renders
- **THEN** the legend appears once, in the Progress column header, and no row repeats it

#### Scenario: Mobile list with multiple goals showing both ratios

- **GIVEN** the same three goals render as cards
- **WHEN** the list renders
- **THEN** the legend appears once, above the first card, and no card repeats it

#### Scenario: No goal in the list has a Potential ratio

- **GIVEN** the Goals list renders only Unlock goals, which never compute a Potential ratio
- **WHEN** the list renders, on either desktop or mobile
- **THEN** no legend renders

### Requirement: Mobile renders one card per goal, with any level requirement inside it

Below the mobile breakpoint, each goal SHALL render as a card with, in order: a header (the unit's avatar, name, and a caption line combining the goal type with the "Done By" date-and-day-count content when available, in the form "{{goalType}} · 📅 {{date}} · {{days}} days"; when no completion estimate is available, the caption SHALL show only the goal type), the status label(s), the primary pause/resume control (see `goal-status-actions`'s "Pause and resume are primary row actions"), and the "⋯" row-actions menu at the top-right of the header, a goal line (the same from → to representation as the desktop Goal column), the shared stacked progress bar with its percent readout beneath it (rendered together by `goal-progress-display`, not on the goal line), and a footer line combining the remaining-text formatter with the info affordance described in `goal-progress-display`.

A Rank or Ability goal whose character is below its required level SHALL additionally render that level requirement inside its own card as sub-lines beneath the goal's own content (see "A Rank or Ability goal shows its level requirement as sub-lines of its own row or card"); it never renders as a separate card.

#### Scenario: Card with a completion estimate

- **GIVEN** a Rank goal has a computed completion estimate of September 27th (in 9 days)
- **WHEN** its card renders
- **THEN** the header caption reads "Rank · 📅 Sep 27 · 9 days"

#### Scenario: Card with no completion estimate

- **GIVEN** a goal has no computed completion estimate
- **WHEN** its card renders
- **THEN** the header caption reads only the goal type (for example, "Unlock"), with no date segment

#### Scenario: A Rank goal below its required level shows the requirement inside its own card

- **GIVEN** a Rank goal whose character is below the level its target needs
- **WHEN** the mobile card list renders
- **THEN** exactly one card exists for the goal and the level requirement appears as sub-lines within that card, with no separate card for it

#### Scenario: The primary pause/resume control appears in the card header, same as desktop

- **GIVEN** an Active goal renders once as a desktop table row and once as a mobile card
- **WHEN** each renders
- **THEN** both show the same primary pause control, reachable without opening the "⋯" menu — the mobile card places it in the header alongside the status label(s) and the "⋯" menu, matching the desktop Actions column's placement

### Requirement: A Rank or Ability goal shows its level requirement as sub-lines of its own row or card

Wherever the Goals list renders (desktop table or mobile cards, on either the Goals Overview or a project detail route), a Rank or Ability goal whose character is below the level its target needs SHALL render that requirement as sub-lines nested under the goal's own cells or card body, using the level-requirement display defined by `rank-level-progression`: a target line "Lv {{current}} → {{required}}" under the Goal cell, a Potential-only progress bar (owned XP books' reach, with no Actual fill because Actual level has not reached the requirement) under the Progress cell, and remaining text "{{levels}} levels · {{xp}} XP" under the Remaining cell. The requirement SHALL never render as its own row or card, and SHALL NOT be rendered as a separate goal, a dependency, or a Restricted reason. When the character is at or above the required level, or the goal is not a Character Rank or Ability goal, no requirement sub-lines SHALL render.

#### Scenario: Desktop Rank row below its required level

- **GIVEN** a Rank goal whose character is at level 30 and whose target requires level 32
- **WHEN** the desktop table renders
- **THEN** exactly one row exists for the goal, and its Goal cell shows the target line "Lv 30 → 32", its Progress cell shows a Potential-only bar, and its Remaining cell shows "{{levels}} levels · {{xp}} XP" as sub-lines beneath the goal's own content

#### Scenario: Mobile card below its required level

- **GIVEN** an Ability goal whose character is below the level its target implies
- **WHEN** the mobile card list renders
- **THEN** the card shows the same target line, Potential-only bar, and remaining text as sub-lines within the Ability goal's own card body

#### Scenario: Level requirement is met

- **GIVEN** a Rank goal whose character is at or above the level its target needs
- **WHEN** the list renders on desktop or mobile
- **THEN** no requirement sub-lines appear for that goal

#### Scenario: A goal that is not a Character Rank or Ability goal

- **GIVEN** an Unlock, Ascension, Upgrade, or Machine-of-War goal
- **WHEN** the list renders
- **THEN** no requirement sub-lines appear for that goal

### Requirement: In-flight rows show their account-wide priority position

Wherever the Goals list renders Active or Paused goals in priority order — the Goals page (`/plan/goals`) and a project's detail route — each such row SHALL show the goal's account-wide priority position (`globalPriority`, 1 to N across every Active and Paused goal) as visible text in the row's leading cell beside the drag handle on the desktop table, and in the card header on mobile. The position is not a seventh column and SHALL NOT change the six-column contract. It SHALL be the goal's position in the whole account order, never its index among the visible rows: with filters, Group, or a project view, the visible rows show non-consecutive numbers. Rows without a position (Reached, Completed, or Archived goals) SHALL show none and SHALL leave the leading cell empty. The number SHALL appear in Comfortable and Compact density and on mobile cards, SHALL meet the text-contrast rules of `goal-visual-accessibility`, and SHALL be part of the row's accessible name or description (for example "Priority 3"). While a reorder is in flight or awaiting rollback, the numbers SHALL follow the same optimistic update as the order: the moved goal takes the displaced goal's number and the goals between them shift by one, reverting with the order on rollback.

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
- **WHEN** the project's detail route renders
- **THEN** its rows show 1, 3, and 5, not 1, 2, and 3, and the same goals show the same numbers on the Goals page

#### Scenario: Compact density and mobile cards keep the number

- **WHEN** the list renders in Compact density on desktop, or as mobile cards below 768px
- **THEN** each Active or Paused row or card still shows its number

#### Scenario: A reorder updates the numbers optimistically

- **GIVEN** global order A, B, C, D, E and a project holding A, C, and E
- **WHEN** the user moves E onto C in the project's detail route
- **THEN** the rows immediately read A 1, E 3, C 4, and the Goals page shows A 1, B 2, E 3, C 4, D 5
- **AND** if the move is rejected the numbers return to A 1, C 3, E 5
