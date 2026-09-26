## ADDED Requirements

### Requirement: The Goals page offers a row-density preference

The Goals page (`/plan/goals`) list SHALL offer a two-value row-density preference — "Comfortable" (the existing presentation, default) and "Compact" (a denser one) — persisted per browser, independent of the Group/Type filters, the status-filter tab, and priority order. Changing it SHALL immediately re-render the visible list at the newly selected density and SHALL NOT change goal order or reordering behavior. This preference applies only to the Goals page: the same list rendered on a project's detail route SHALL always render at the Comfortable density and SHALL NOT offer this control.

#### Scenario: Comfortable is the default

- **GIVEN** a user has never changed the density preference in this browser
- **WHEN** the Goals page renders
- **THEN** the list renders at the Comfortable density

#### Scenario: Choosing Compact re-renders immediately

- **WHEN** the user selects the Compact density
- **THEN** the visible list re-renders at the Compact density without a page reload and in the same priority order

#### Scenario: The preference persists across a reload

- **GIVEN** the user selected Compact
- **WHEN** they reload the page
- **THEN** the Goals page renders at the Compact density

#### Scenario: Project Detail is unaffected

- **WHEN** a project's detail route renders its goal list
- **THEN** it renders at the Comfortable density and offers no density control, regardless of the density last selected on the Goals page

## MODIFIED Requirements

### Requirement: Desktop table uses fixed-width, static columns at a fixed row height

At or above the mobile breakpoint (see the platform-switch requirement below), the Goals list SHALL render as a table with these columns, in order: Character, Goal, Progress, Remaining, "Status · Done by", and Actions. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width, or on the selected density — the only layout change at any desktop width is the fixed set of columns above, and the only responsive change at all is the 768px table→card switch (see the platform-switch requirement below). A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. The Character column SHALL show the unit's avatar, its name as a link, and the goal type as a small muted-foreground caption beneath the name; the previously separate Type column is removed. (No coloured dot: this repo has no existing per-goal-type colour token to reuse, and it was dropped as a cosmetic mockup detail with no testable scenario.) The Goal column SHALL show the goal's from → to representation (rank icons, "Lv 44 → 50", or "273 / 500 shards", matching each goal kind's existing target representation). The "Status · Done by" column SHALL show the goal's Active/Blocked/etc. status label(s) on one line, with the existing `goal-list-estimate-display` "Done By" date-and-day-count content on a second line directly beneath when a completion estimate is available; when no estimate is available, the second line SHALL be omitted rather than showing a placeholder. The Actions column SHALL render the row's project-removal-or-move and Delete actions as inline icon buttons, alongside the existing primary pause/resume icon (see `goal-status-actions`'s "Pause and resume are primary row actions"), rather than only inside the "⋯" menu; the "⋯" menu SHALL render only when it still has at least one applicable item (Archive or Unarchive). Its column header text SHALL remain present for assistive technology but SHALL NOT render visibly.

Each row SHALL render at a fixed height determined by the density preference (see "The Goals page offers a row-density preference"; project detail always renders at Comfortable). At the Comfortable density, each row SHALL render at a fixed height sized to one line of content per column, with the Character and "Status · Done by" columns' two stacked lines accommodated within that same fixed height — a substantial reduction from the pre-density-toggle variable, content-driven row height. At the Compact density, a row SHALL render at a shorter fixed height: the Character column's goal-type caption line and the "Status · Done by" column's second ("Done by") line SHALL both be omitted, so each of those columns shows only its first line; the Character avatar and linked name, the Goal column's from → to representation, and the status label(s) remain visible at both densities. A Rank or Ability row that shows level-requirement sub-lines (see "A Rank or Ability goal shows its level requirement as sub-lines of its own row or card") is required content at both densities, so such a row SHALL keep the Comfortable fixed height at the Compact density rather than dropping the sub-lines. The existing alternating row (zebra) striping SHALL be preserved at both densities.

When the table renders on a route where inline reordering is available (the Goals page and project detail — see `global-goal-priority`'s "Owner can reorder from Goals" and `project-management`'s "Goals are reordered individually via inline drag"), each Active or Paused row SHALL additionally show a leading drag handle before the Character column. The handle and its column SHALL be present and keep a usable touch and pointer target at both densities; the Compact row height SHALL NOT be shorter than that target. This handle is a control affordance, not a seventh data column, and does not change the six static columns above; it is present only in a reorderable context and absent elsewhere (for example, the Insights page or any list that is not in priority order), which is a context-conditional distinction, not the width-conditional column-hiding this requirement otherwise prohibits.

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

#### Scenario: Compact density hides the secondary caption lines

- **GIVEN** the Goals page is set to the Compact density and a Rank goal (with no level-requirement sub-lines) has a computed completion estimate
- **WHEN** its row renders
- **THEN** the Character column shows the unit's avatar and linked name with no goal-type caption beneath it, and the "Status · Done by" column shows only the status label(s) with no "Done by" second line, and the row renders at the Compact fixed height, shorter than the Comfortable one

#### Scenario: Compact density leaves the other columns' content unchanged

- **GIVEN** the Goals page is set to the Compact density
- **WHEN** the table renders
- **THEN** the Goal, Progress, Remaining, and Actions columns render the same content they do at the Comfortable density

#### Scenario: Compact density keeps the drag handle

- **GIVEN** the Goals page is set to the Compact density and an Active goal renders
- **WHEN** its row renders
- **THEN** the row still shows its leading drag handle, usable to reprioritize, and its account-wide priority number (see `consolidate-goals-into-plan-and-remove-active-project`'s "In-flight rows show their account-wide priority position"), and reordering behaves identically to Comfortable

#### Scenario: A row with level-requirement sub-lines keeps its height in Compact

- **GIVEN** the Goals page is set to the Compact density and a Rank goal's character is below its required level
- **WHEN** its row renders
- **THEN** the level-requirement sub-lines remain visible and the row renders at the Comfortable fixed height rather than clipping them

### Requirement: Mobile renders one card per goal, with any level requirement inside it

Below the mobile breakpoint, each goal SHALL render as a card with, in order: a header (the unit's avatar, name, and a caption line combining the goal type with the "Done By" date-and-day-count content when available, in the form "{{goalType}} · 📅 {{date}} · {{days}} days"; when no completion estimate is available, the caption SHALL show only the goal type), the status label(s), the primary pause/resume control (see `goal-status-actions`'s "Pause and resume are primary row actions"), and the "⋯" row-actions menu at the top-right of the header, a goal line (the same from → to representation as the desktop Goal column), the shared stacked progress bar with its percent readout beneath it (rendered together by `goal-progress-display`, not on the goal line), and a footer line combining the remaining-text formatter with the info affordance described in `goal-progress-display`. At the Compact density, card padding and vertical gaps SHALL be smaller than at Comfortable while this content and its interaction remain available; project detail always renders at Comfortable. Density has no effect on the drag-only card mode shown while mobile reorder is active, which renders its own collapsed cards.

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

#### Scenario: Compact density preserves the progress explanation

- **GIVEN** the Goals page is set to the Compact density
- **WHEN** a card renders
- **THEN** its header, goal line, progress bar, remaining-text/info footer, any level-requirement sub-lines, and expandable Actual/Potential explanation remain available, while padding and vertical gaps are tighter than at Comfortable

#### Scenario: Mobile reorder mode ignores density

- **GIVEN** the Goals page is set to the Compact density on mobile
- **WHEN** the user turns reorder mode on
- **THEN** the collapsed drag-only cards render exactly as they do at the Comfortable density
