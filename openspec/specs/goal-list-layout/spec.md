# goal-list-layout Specification

## Purpose

Defines the Goals list's structural presentation — the desktop table's static columns, widths, and row density, and the mobile card structure it switches to — independent of how an individual goal's progress bar, percent, and explanation render (that is `goal-progress-display`'s concern).

## Requirements

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

Below the mobile breakpoint, each goal SHALL render as a card with, in order: a header (the unit's avatar, name, and and, when a completion estimate is available, a caption line with the "Done By" date-and-day-count content in the form "📅 {{date}} · {{days}} days"; the header SHALL NOT show the goal type as text and, when no completion estimate is available, SHALL have no caption line), the status label(s), the primary pause/resume control (see `goal-status-actions`'s "Pause and resume are primary row actions"), and the "⋯" row-actions menu at the top-right of the header, a goal line (the same from → to representation as the desktop Goal column), the shared stacked progress bar with its percent readout beneath it (rendered together by `goal-progress-display`, not on the goal line), and a footer line combining the remaining-text formatter with the info affordance described in `goal-progress-display`.

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

#### Scenario: The primary pause/resume control appears in the card header, same as desktop

- **GIVEN** an Active goal renders once as a desktop table row and once as a mobile card
- **WHEN** each renders
- **THEN** both show the same primary pause control, reachable without opening the "⋯" menu — the mobile card places it in the header alongside the status label(s) and the "⋯" menu, matching the desktop Actions column's placement

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

### Requirement: The Remaining column shows resource chips, not prose

For a goal that has not reached its target, the Remaining cell (desktop) and the remaining area of the card (mobile) SHALL show the resource chips defined by `goal-remaining-resources` in place of the previous sentence. The Remaining cell SHALL NOT show an upgrade-slot count ("N slots") or a raw XP figure ("N XP"). The column set and order of the desktop table are unchanged.

#### Scenario: A Rank goal no longer shows slots

- **GIVEN** a Rank goal with remaining upgrade slots and a farming estimate
- **WHEN** its Remaining cell renders
- **THEN** the cell shows resource chips and no "slots" text

#### Scenario: A goal needing a level-up shows no level text in Remaining

- **GIVEN** a Rank or Ability goal whose character is below the required level
- **WHEN** its Remaining cell renders
- **THEN** no "N XP" and no "N levels" text appears, and the XP-book figure is shown with the level line in the Progress cell instead

### Requirement: An Ability goal's target shows one labelled pill per ability track

Wherever the Goals list renders an Ability goal's target (desktop Goal cell, mobile card), it SHALL show one pill for each ability track whose target level is above the unit's current level, each pill made of an uppercase track label, the unit's current level, an arrow, and the target level with the target emphasised. The track names depend on the unit: a Machine of War's tracks are "Primary" then "Secondary", and a Character's are "Active" then "Passive" (localized); a Character goal SHALL NOT show "Primary"/"Secondary" and a Machine of War goal SHALL NOT show "Active"/"Passive". A track already at or above its target SHALL NOT render a pill. The Ability goal SHALL NOT be reduced to a single unlabelled "Lv X → Y" for the track with the larger gap.

#### Scenario: Only the primary track is being raised

- **GIVEN** an Ability goal raising its primary track from a current level of 47 to 50 and leaving the secondary track untouched
- **WHEN** its Goal cell renders
- **THEN** it shows one pill reading "PRIMARY 47 → 50" and no Secondary pill

#### Scenario: A Character ability goal uses Active and Passive

- **GIVEN** a Character Ability goal raising its active ability from 8 to 10 and its passive ability from 5 to 7
- **WHEN** its Goal cell renders
- **THEN** it shows an "ACTIVE 8 → 10" pill and a "PASSIVE 5 → 7" pill, and no Primary or Secondary label

#### Scenario: Both tracks are being raised

- **GIVEN** an Ability goal raising its primary track from 47 to 50 and its secondary track from 12 to 15
- **WHEN** its Goal cell or mobile card renders
- **THEN** it shows a "PRIMARY 47 → 50" pill and a "SECONDARY 12 → 15" pill

#### Scenario: One track has already reached its target

- **GIVEN** an Ability goal whose primary track is at its target and whose secondary track is not
- **WHEN** its Goal cell renders
- **THEN** only the Secondary pill is shown

### Requirement: The Goal column encodes the goal kind visually, without a type label

The Goal cell (desktop) and goal line (mobile card) SHALL identify the goal kind by what they show, as V1 does, and no goal-type word SHALL be shown for Rank, Ascension or Ability goals. By kind: a Rank goal SHALL show the current rank emblem, an arrow and the target rank emblem, with no rank name text (each emblem SHALL keep its rank name as its tooltip and accessible name, and a partially-applied rank target SHALL keep its slot marker); an Ascension goal SHALL show its rarity or star icons from → to with no text; an Ability goal SHALL show the labelled track pills of "An Ability goal's target shows one labelled pill per ability track"; an Unlock goal SHALL show the word "Unlock" with its owned/required shard count moved to the Progress cell beside the bar. A Rank or Ability goal's level requirement sub-line ("Lv 41 → 44") is unchanged and stays beneath the goal's own content.

#### Scenario: A Rank goal shows emblems only

- **GIVEN** a Rank goal from Gold III to Diamond I
- **WHEN** its Goal cell renders
- **THEN** it shows the two rank emblems with an arrow between them and no "Diamond I" text, and the target emblem's accessible name is "Diamond I"

#### Scenario: Character cell has no goal type

- **GIVEN** a Rank, Ability or Unlock goal
- **WHEN** the Character cell renders
- **THEN** it shows the avatar, the name and any project badges, and no "Rank", "Ability" or "Unlock" caption

#### Scenario: An Unlock goal moves its shard count to Progress

- **GIVEN** an Unlock goal with 329 of 500 shards
- **WHEN** its row renders
- **THEN** the Goal cell reads "Unlock" and the Progress cell shows "329 / 500" beside the bar

#### Scenario: An Ascension goal shows icons only

- **GIVEN** an Ascension goal from Epic to Legendary
- **WHEN** its Goal cell renders
- **THEN** it shows the two rarity icons with an arrow and no rarity or goal-type text

### Requirement: Projects are their own column, and notes sit under the name

On the desktop table, a goal's project memberships SHALL render only in the standalone Projects column between Character and Goal, never inside the Character cell. A goal's notes SHALL render in the Character cell on one line directly beneath the unit name (the position the goal-type caption used to occupy), truncated after one line, and SHALL NOT render as an extra line below the cell's other content. The Projects column SHALL appear on the Goals page and on a project's detail route alike. The mobile card is unchanged by this requirement: it keeps its existing notes line and project badges in the card body.

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

#### Scenario: Mobile card is unchanged

- **GIVEN** the list renders as mobile cards
- **WHEN** a goal with notes and projects renders
- **THEN** the card keeps its existing notes line and project badges
