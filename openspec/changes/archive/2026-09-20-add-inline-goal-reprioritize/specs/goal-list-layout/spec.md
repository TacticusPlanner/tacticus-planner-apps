## MODIFIED Requirements

### Requirement: Desktop table uses fixed-width, static columns at a fixed row height

At or above the mobile breakpoint (see the platform-switch requirement below), the Goals list SHALL render as a table with these columns, in order: Character, Goal, Progress, Remaining, "Status · Done by", and Actions. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width — the only layout change at any desktop width is the fixed set of columns above, and the only responsive change at all is the 768px table→card switch (see the platform-switch requirement below). A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. The Character column SHALL show the unit's avatar, its name as a link, and the goal type as a small muted-foreground caption beneath the name; the previously separate Type column is removed. (No coloured dot: this repo has no existing per-goal-type colour token to reuse, and it was dropped as a cosmetic mockup detail with no testable scenario.) The Goal column SHALL show the goal's from → to representation (rank icons, "Lv 44 → 50", or "273 / 500 shards", matching each goal kind's existing target representation). The "Status · Done by" column SHALL show the goal's Active/Blocked/etc. status label(s) on one line, with the existing `goal-list-estimate-display` "Done By" date-and-day-count content on a second line directly beneath when a completion estimate is available; when no estimate is available, the second line SHALL be omitted rather than showing a placeholder. The Actions column SHALL keep the existing "⋯" row-actions menu unchanged; its column header text SHALL remain present for assistive technology but SHALL NOT render visibly.

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

### Requirement: Mobile renders one card per goal

Below the mobile breakpoint, each goal SHALL render as a card with, in order: a header (the unit's avatar, name, and a caption line combining the goal type with the "Done By" date-and-day-count content when available, in the form "{{goalType}} · 📅 {{date}} · {{days}} days"; when no completion estimate is available, the caption SHALL show only the goal type), the status label(s) and the row-actions menu at the top-right of the header, a goal line (the same from → to representation as the desktop Goal column), the shared stacked progress bar with its percent readout beneath it (rendered together by `goal-progress-display`, not on the goal line), and a footer line combining the remaining-text formatter with the info affordance described in `goal-progress-display`.

This one-card-per-goal rule has one exception: a Level goal that renders as its dependent Rank/Ability goal's sub-line (see "A Level goal with exactly one dependent renders as that goal's sub-line, not its own row" below) does not additionally render its own card — its content appears only within its dependent's card.

#### Scenario: Card with a completion estimate

- **GIVEN** a Rank goal has a computed completion estimate of September 27th (in 9 days)
- **WHEN** its card renders
- **THEN** the header caption reads "Rank · 📅 Sep 27 · 9 days"

#### Scenario: Card with no completion estimate

- **GIVEN** a goal has no computed completion estimate
- **WHEN** its card renders
- **THEN** the header caption reads only the goal type (for example, "Unlock"), with no date segment

#### Scenario: A merged Level goal does not render its own card

- **GIVEN** a Level goal that renders as its dependent Rank goal's sub-line
- **WHEN** the mobile card list renders
- **THEN** no separate card exists for the Level goal — its content appears only within the Rank goal's card

## ADDED Requirements

### Requirement: A Level goal with exactly one dependent renders as that goal's sub-line, not its own row

Wherever the Goals list renders (desktop table or mobile cards, on either the Goals Overview or a project detail route), a Level goal SHALL NOT render as its own row or card when it is the sole goal that exactly one other in-flight Rank or Ability goal `DependsOn`s. Instead, its existing progress presentation (stacked bar, percent readout, and remaining-text formatter — unchanged, per `goal-progress-display`) SHALL render as a sub-line nested within that dependent goal's row or card. `GoalType.Level` is unaffected as a domain concept: the Level goal remains a real, independently addressable goal with its own status and actions; only its list-row rendering is folded into its dependent's.

A Level goal SHALL render as its own ordinary row or card, unchanged from today, whenever this condition does not hold — it has no dependent Rank/Ability goal, or it is `DependsOn`e by more than one.

#### Scenario: A Level goal merges into its Rank goal's row

- **GIVEN** an in-flight Rank goal `DependsOn`s an in-flight Level goal, and no other in-flight goal `DependsOn`s that Level goal
- **WHEN** the Goals list renders
- **THEN** only one row (or card) appears for the pair, showing the Rank goal's own content with the Level goal's progress bar, percent, and remaining text as a sub-line beneath it, and no separate row or card exists for the Level goal

#### Scenario: A Level goal with no dependent renders standalone

- **GIVEN** an in-flight Level goal that no other in-flight goal `DependsOn`s
- **WHEN** the Goals list renders
- **THEN** the Level goal renders as its own ordinary row or card

#### Scenario: A Level goal depended on by more than one goal renders standalone

- **GIVEN** an in-flight Level goal that two different in-flight goals both `DependsOn`
- **WHEN** the Goals list renders
- **THEN** the Level goal renders as its own ordinary row or card, not merged into either dependent

#### Scenario: A merged Level goal's own row-actions remain reachable

- **GIVEN** a Level goal merged into its Rank goal's row as a sub-line
- **WHEN** the user wants to act on the Level goal independently (for example, pause it)
- **THEN** that action remains reachable from the Level goal's own detail view, opened from the sub-line
