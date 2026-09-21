## ADDED Requirements

### Requirement: Goals Overview offers a row-density preference

The Goals Overview list SHALL offer a two-value row-density preference —
"Comfortable" (the existing presentation, default) and "Compact" (a denser
one) — persisted per browser, independent of the Group/Sort/Type filters
and status-filter tab. Changing it SHALL immediately re-render the visible
list at the newly selected density. This preference applies only to Goals
Overview: the same list rendered on a project's detail route SHALL always
render at the Comfortable density and SHALL NOT offer this control.

#### Scenario: Comfortable is the default

- **GIVEN** a user has never changed the density preference in this browser
- **WHEN** Goals Overview renders
- **THEN** the list renders at the Comfortable density

#### Scenario: Choosing Compact re-renders immediately

- **WHEN** the user selects the Compact density
- **THEN** the visible list re-renders at the Compact density without a
  page reload

#### Scenario: The preference persists across a reload

- **GIVEN** the user selected Compact
- **WHEN** they reload the page
- **THEN** Goals Overview renders at the Compact density

#### Scenario: Project Detail is unaffected

- **WHEN** a project's detail route renders its goal list
- **THEN** it renders at the Comfortable density and offers no density
  control, regardless of the density last selected on Goals Overview

## MODIFIED Requirements

### Requirement: Desktop table uses fixed-width, static columns at a fixed row height

At or above the mobile breakpoint (see the platform-switch requirement below), the Goals list SHALL render as a table with these columns, in order: Character, Goal, Progress, Remaining, "Status · Done by", and Actions. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width, or based on the selected density — the only layout change at any desktop width is the fixed set of columns above, and the only responsive change at all is the 768px table→card switch (see the platform-switch requirement below). A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. The Character column SHALL show the unit's avatar, its name as a link, and the goal type as a small muted-foreground caption beneath the name; the previously separate Type column is removed. (No coloured dot: this repo has no existing per-goal-type colour token to reuse, and it was dropped as a cosmetic mockup detail with no testable scenario.) The Goal column SHALL show the goal's from → to representation (rank icons, "Lv 44 → 50", or "273 / 500 shards", matching each goal kind's existing target representation). The "Status · Done by" column SHALL show the goal's Active/Blocked/etc. status label(s) on one line, with the existing `goal-list-estimate-display` "Done By" date-and-day-count content on a second line directly beneath when a completion estimate is available; when no estimate is available, the second line SHALL be omitted rather than showing a placeholder. The Actions column SHALL render the row's project-removal-or-move and Delete actions as inline icon buttons, alongside the existing primary pause/resume icon (see `goal-status-actions`'s "Pause and resume are primary row actions"), rather than only inside the "⋯" menu; the "⋯" menu SHALL render only when it still has at least one applicable item (Archive or Unarchive). Its column header text SHALL remain present for assistive technology but SHALL NOT render visibly.

Each row SHALL render at a fixed height determined by the density preference (see "Goals Overview offers a row-density preference" above; Project Detail always renders at Comfortable). At the Comfortable density, each row SHALL render at a fixed height sized to one line of content per column, with the Character and "Status · Done by" columns' two stacked lines accommodated within that same fixed height — a substantial reduction from the pre-density-toggle variable, content-driven row height. At the Compact density, each row SHALL render at a shorter fixed height: the Character column's goal-type caption line and the "Status · Done by" column's second ("Done By") line SHALL both be omitted, so each of those columns shows only its first line — the Character and Goal columns' link/from→to content, and the Status label(s), remain visible at both densities. The existing alternating row (zebra) striping SHALL be preserved at both densities.

When the table renders on a route where inline reordering is available (project detail — see `project-management`'s "Goals are reordered individually via inline drag"), each row SHALL additionally show a leading drag handle before the Character column. This handle is a control affordance, not a seventh data column, and does not change the six static columns above; it is present only in a reorderable context and absent elsewhere (for example, the non-reorderable Goals Overview list), which is a context-conditional distinction, not the width-conditional column-hiding this requirement otherwise prohibits.

Assumptions:

- Column widths are a layout implementation detail (not restated here in pixels); the ordering, content, and fixed row height(s) are the externally observable, testable behavior.

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

#### Scenario: Compact density hides the secondary caption lines

- **GIVEN** Goals Overview is set to the Compact density and a Rank goal has a computed completion estimate
- **WHEN** its row renders
- **THEN** the Character column shows the unit's avatar and linked name with no goal-type caption beneath it, and the "Status · Done by" column shows only the status label(s) with no "Done By" second line — the row renders at the Compact fixed height, shorter than the Comfortable one

#### Scenario: Compact density leaves the other five columns' content unchanged

- **GIVEN** Goals Overview is set to the Compact density
- **WHEN** the table renders
- **THEN** the Goal, Progress, Remaining, and Actions columns, and the Character column's avatar/linked-name and Status column's status label(s), render the same content they do at the Comfortable density

### Requirement: Mobile renders one card per goal

Below the mobile breakpoint, each goal SHALL render as a card with, in order: a header (the unit's avatar, name, and a caption line combining the goal type with the "Done By" date-and-day-count content when available, in the form "{{goalType}} · 📅 {{date}} · {{days}} days"; when no completion estimate is available, the caption SHALL show only the goal type), the status label(s), the primary pause/resume control (see `goal-status-actions`'s "Pause and resume are primary row actions"), and the "⋯" row-actions menu at the top-right of the header, a goal line (the same from → to representation as the desktop Goal column), the shared stacked progress bar with its percent readout beneath it (rendered together by `goal-progress-display`, not on the goal line), and — at the Comfortable density (see "Goals Overview offers a row-density preference" above; Project Detail always renders at Comfortable) — a footer line combining the remaining-text formatter with the info affordance described in `goal-progress-display`. At the Compact density, that footer line SHALL be omitted, reducing each card's height; the header, goal line, and progress bar remain unchanged from the Comfortable density.

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

#### Scenario: The primary pause/resume control appears in the card header, same as desktop

- **GIVEN** an Active goal renders once as a desktop table row and once as a mobile card
- **WHEN** each renders
- **THEN** both show the same primary pause control, reachable without opening the "⋯" menu — the mobile card places it in the header alongside the status label(s) and the "⋯" menu, matching the desktop Actions column's placement

#### Scenario: Compact density omits the footer line

- **GIVEN** Goals Overview is set to the Compact density
- **WHEN** a card renders
- **THEN** its header, goal line, and progress bar render the same as at the Comfortable density, and the remaining-text/info footer line is omitted
