## REMOVED Requirements

### Requirement: Desktop table uses fixed-width, static columns at a fixed row height

**Reason**: The column contract changes shape — the Actions column and its inline icon buttons go away, a "⋯" row menu becomes required rather than forbidden, a selection checkbox joins the leading cell, Status · Done by and Remaining swap places, and the fixed row height gains a wrapped-chips exception. Three of its scenarios asserted the exact opposite of the new behaviour, so the requirement is replaced rather than edited.
**Migration**: See "Desktop table uses static columns with a leading control cell and a row menu" below. Any reference to the old requirement name means the new one.

### Requirement: Mobile renders one card per goal, with any level requirement inside it

**Reason**: The card header no longer carries a primary pause/resume control outside the "⋯" menu, and gains a select-mode checkbox; its "primary control in the header" scenario asserted the removed behaviour.
**Migration**: See "Mobile renders one card per goal with a header menu and select-mode checkbox" below. Any reference to the old requirement name means the new one.

## ADDED Requirements

### Requirement: Desktop table uses static columns with a leading control cell and a row menu

At or above the mobile breakpoint (see the platform-switch requirement), the Goals list SHALL render as a table with these data columns, in order: Character, Projects, Goal, Progress, "Status · Done by", and Remaining. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width — the only layout change at any desktop width is the fixed set of columns above, and the only responsive change at all is the 768px table→card switch. A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. Remaining SHALL be the last column, so its chips can wrap without displacing any fixed-width content to its right.

The Character column SHALL show the unit's avatar, its name, and, when the goal has notes, the notes on a single line directly beneath the name (truncated with an ellipsis after that one line, the full text available as a tooltip), and SHALL NOT show the goal type as a text caption or the goal's project badges; the goal type is instead encoded in the Goal column (see "The Goal column encodes the goal kind visually, without a type label"). At the trailing edge of the Character cell, every row SHALL render an always-visible "⋯" menu trigger with an accessible name, opening the row's actions menu: Edit, then Pause or Resume (for a goal that is not Reached and is Active or Paused respectively — see `goal-status-actions`), then Delete as a destructive item. There SHALL be no separate Actions column and no inline action icon buttons in the row. The Projects column SHALL show the goal's project-membership badges (colour dot and project name, wrapping within the cell), and SHALL be empty for a goal in no project; its header text SHALL be visible. The Goal column SHALL show the goal's from → to representation as defined by "The Goal column encodes the goal kind visually, without a type label". The "Status · Done by" column SHALL show the goal's Active/Blocked/etc. status label(s) on one line, with the existing `goal-list-estimate-display` "Done By" date-and-day-count content on a second line directly beneath when a completion estimate is available; when no estimate is available, the second line SHALL be omitted rather than showing a placeholder; a blocked estimate's per-material detail SHALL NOT render in the cell (it is the Blocked indicator's tooltip content, see `goal-list-estimate-display`).

Each row SHALL render at a fixed height sized to one line of content per column (with the Character column's name-and-notes lines and the "Status · Done by" column's two stacked lines accommodated within that same fixed height). Two exceptions SHALL exist: a row whose Progress cell carries level-requirement sub-lines, and a row whose Remaining chips wrap beyond two lines (see `goal-remaining-resources`: every chip renders) — such a row SHALL grow only as far as its wrapped content needs, and no other row SHALL change height because of it. The existing alternating row (zebra) striping SHALL be preserved.

Every desktop row SHALL have a leading cell before the Character column holding, in order: the selection checkbox (`goal-bulk-actions`), the account-wide priority number for an in-flight row, and — when the table renders on a route where inline reordering is available (the Goals page, with or without a project scope — see `global-goal-priority`'s "Owner can reorder from Goals") — a drag handle for each Active or Paused row. This cell holds control affordances, not a data column, and does not change the six static columns above; the handle is present only in a reorderable context and absent elsewhere, which is a context-conditional distinction, not the width-conditional column-hiding this requirement otherwise prohibits.

Assumptions:

- Column widths are a layout implementation detail (not restated here in pixels); the ordering, content, and fixed row height are the externally observable, testable behavior. The Remaining column SHALL be wide enough that a Machine of War Ability goal needing badges of every rarity, forge badges, components, gold and energy fits in at most three chip lines at a 1280px-wide viewport with the sidebar open.

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
- **THEN** it renders as a table with all six data columns in the order Character, Projects, Goal, Progress, Status · Done by, Remaining — no width threshold hides or restores any of them

#### Scenario: A drag handle appears only in a reorderable context

- **GIVEN** the same Active goal renders once on the Goals page and once in a list that is not reorderable
- **WHEN** each list renders as a desktop table
- **THEN** the Goals page row shows a leading drag handle and the other row does not, with both rows otherwise showing the same six columns

#### Scenario: The row menu holds every row action

- **GIVEN** an Active goal that has not reached its target
- **WHEN** its "⋯" menu at the end of the Character cell is opened
- **THEN** it lists Edit, Pause and Delete, in that order, and the row shows no inline Edit, Pause or Delete icon button

#### Scenario: No Actions column

- **WHEN** the desktop table renders
- **THEN** no column follows Remaining and no column header reads "Actions", visibly or for assistive technology

#### Scenario: A Machine of War row with many chips grows

- **GIVEN** a Machine of War Ability goal whose Remaining chips wrap to three lines
- **WHEN** the table renders
- **THEN** that row is taller than its neighbours, every chip is visible, and the neighbouring rows keep the fixed height

### Requirement: Mobile renders one card per goal with a header menu and select-mode checkbox

Below the mobile breakpoint, each goal SHALL render as a card with, in order: a header (the unit's avatar, name, and, when a completion estimate is available, a caption line with the "Done By" date-and-day-count content in the form "📅 {{date}} · {{days}} days"; the header SHALL NOT show the goal type as text and, when no completion estimate is available, SHALL have no caption line), the status label(s), and the "⋯" row-actions menu at the top-right of the header holding Edit, Pause or Resume, and Delete (the same items as the desktop row menu); while select mode is active (`goal-bulk-actions`) the header SHALL additionally lead with a selection checkbox. Then a goal line (the same from → to representation as the desktop Goal column), the shared stacked progress bar with its percent readout beneath it (rendered together by `goal-progress-display`, not on the goal line), and a footer line combining the remaining-text formatter with the info affordance described in `goal-progress-display`.

A Rank or Ability goal whose character is below its required level SHALL additionally render that level requirement inside its own card as sub-lines beneath the goal's own content (see "A Rank or Ability goal shows its level requirement as sub-lines of its own row or card"); it never renders as a separate card.

#### Scenario: Card with a completion estimate

- **GIVEN** a Rank goal has a computed completion estimate of September 27th (in 9 days)
- **WHEN** its card renders
- **THEN** the header caption reads "📅 Sep 27 · 9 days", with no goal-type word

#### Scenario: Card with no completion estimate

- **GIVEN** a goal has no computed completion estimate
- **WHEN** its card renders
- **THEN** the header has no caption line, and the goal type is conveyed only by the goal line (for example, "Unlock" for an Unlock goal)

#### Scenario: A Rank goal below its required level shows the requirement inside its own card

- **GIVEN** a Rank goal whose character is below the level its target needs
- **WHEN** the mobile card list renders
- **THEN** exactly one card exists for the goal and the level requirement appears as sub-lines within that card, with no separate card for it

#### Scenario: The card header menu matches the desktop row menu

- **GIVEN** an Active goal renders once as a desktop table row and once as a mobile card
- **WHEN** each row's "⋯" menu is opened
- **THEN** both list Edit, Pause and Delete, and neither surface shows an inline pause control outside the menu

#### Scenario: Select mode adds a header checkbox

- **GIVEN** mobile select mode is active
- **WHEN** a card renders
- **THEN** its header leads with a checkbox that selects the goal, and the rest of the card is unchanged

## MODIFIED Requirements

### Requirement: The Remaining column shows resource chips, not prose

For a goal that has not reached its target, the Remaining cell (desktop) and the remaining area of the card (mobile) SHALL show the resource chips defined by `goal-remaining-resources` in place of the previous sentence. The Remaining cell SHALL NOT show an upgrade-slot count ("N slots") or a raw XP figure ("N XP"). Remaining is the last column of the desktop table (see "Desktop table uses static columns with a leading control cell and a row menu").

#### Scenario: A Rank goal no longer shows slots

- **GIVEN** a Rank goal with remaining upgrade slots and a farming estimate
- **WHEN** its Remaining cell renders
- **THEN** the cell shows resource chips and no "slots" text

#### Scenario: A goal needing a level-up shows no level text in Remaining

- **GIVEN** a Rank or Ability goal whose character is below the required level
- **WHEN** its Remaining cell renders
- **THEN** no "N XP" and no "N levels" text appears, and the XP-book figure is shown with the level line in the Progress cell instead
