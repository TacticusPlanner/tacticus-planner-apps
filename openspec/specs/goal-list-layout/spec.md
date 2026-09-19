# goal-list-layout Specification

## Purpose

Defines the Goals list's structural presentation — the desktop table's static columns, widths, and row density, and the mobile card structure it switches to — independent of how an individual goal's progress bar, percent, and explanation render (that is `goal-progress-display`'s concern).

## Requirements

### Requirement: Desktop table uses fixed-width, static columns at a fixed row height

At or above the mobile breakpoint (see the platform-switch requirement below), the Goals list SHALL render as a table with these columns, in order: Character, Goal, Progress, Remaining, "Status · Done by", and Actions. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width — the only layout change at any desktop width is the fixed set of columns above, and the only responsive change at all is the 768px table→card switch (see the platform-switch requirement below). A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. The Character column SHALL show the unit's avatar, its name as a link, and the goal type as a small caption beneath the name with a coloured dot matching the type's existing badge colour; the previously separate Type column is removed. The Goal column SHALL show the goal's from → to representation (rank icons, "Lv 44 → 50", or "273 / 500 shards", matching each goal kind's existing target representation). The "Status · Done by" column SHALL show the goal's Active/Blocked/etc. status label(s) on one line, with the existing `goal-list-estimate-display` "Done By" date-and-day-count content on a second line directly beneath when a completion estimate is available; when no estimate is available, the second line SHALL be omitted rather than showing a placeholder. The Actions column SHALL keep the existing "⋯" row-actions menu unchanged; its column header text SHALL remain present for assistive technology but SHALL NOT render visibly.

Each row SHALL render at a fixed height sized to one line of content per column (with the Character and "Status · Done by" columns' two stacked lines accommodated within that same fixed height), a substantial reduction from today's variable, content-driven row height. The existing alternating row (zebra) striping SHALL be preserved.

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

### Requirement: Mobile renders one card per goal

Below the mobile breakpoint, each goal SHALL render as a card with, in order: a header (the unit's avatar, name, and a caption line combining the goal type with the "Done By" date-and-day-count content when available, in the form "{{goalType}} · 📅 {{date}} · {{days}} days"; when no completion estimate is available, the caption SHALL show only the goal type), the status label(s) and the row-actions menu at the top-right of the header, a goal line (the same from → to representation as the desktop Goal column, with the percent readout at the trailing edge of the same line), the shared stacked progress bar beneath it, and a footer line combining the remaining-text formatter with the info affordance described in `goal-progress-display`.

#### Scenario: Card with a completion estimate

- **GIVEN** a Rank goal has a computed completion estimate of September 27th (in 9 days)
- **WHEN** its card renders
- **THEN** the header caption reads "Rank · 📅 Sep 27 · 9 days"

#### Scenario: Card with no completion estimate

- **GIVEN** a goal has no computed completion estimate
- **WHEN** its card renders
- **THEN** the header caption reads only the goal type (for example, "Unlock"), with no date segment

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

- **GIVEN** the Goals list renders only Level and Unlock goals, none of which compute a Potential ratio
- **WHEN** the list renders, on either desktop or mobile
- **THEN** no legend renders
