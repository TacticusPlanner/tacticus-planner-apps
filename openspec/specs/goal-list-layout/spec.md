# goal-list-layout Specification

## Purpose

Defines the Goals list's structural presentation — the desktop table's static columns, widths, and row density, and the mobile card structure it switches to — independent of how an individual goal's progress bar, percent, and explanation render (that is `goal-progress-display`'s concern).

## Requirements

### Requirement: The list switches from table to cards at the app's mobile breakpoint

The list SHALL render as the cards or the table according to this device's stored Goals view at every width (see "Users choose between a Cards view and a Table view, Cards by default"), with Cards as the default. The mobile breakpoint (768px, `useIsMobile()`, the same breakpoint the rest of the app uses to tell its desktop and mobile UI forms apart) SHALL decide only the card grid's columns and the mobile interaction modes: below it, the table SHALL show checkboxes only in select mode, SHALL show no drag handle, and SHALL give way to the collapsed reorder cards in reorder mode. A list with no view toggle SHALL render as cards below the breakpoint and as the table at or above it. No other width threshold SHALL change the layout.

#### Scenario: Below the mobile breakpoint, Cards view

- **GIVEN** the viewport is narrower than 768px and the stored Goals view is `Cards` or unset
- **WHEN** the Goals list renders
- **THEN** it renders as a single column of cards

#### Scenario: Below the mobile breakpoint

- **GIVEN** the viewport is narrower than 768px and the stored Goals view is `Table`
- **WHEN** the Goals list renders
- **THEN** it renders as the table with its full column set, scrolling sideways inside the list while the page itself does not scroll sideways, with no checkboxes or drag handles until a mobile mode asks for them

#### Scenario: At or above the mobile breakpoint, Cards view

- **GIVEN** the viewport is 768px or wider and the stored Goals view is `Cards` or unset
- **WHEN** the Goals list renders
- **THEN** it renders as the cards grid

#### Scenario: At or above the mobile breakpoint

- **GIVEN** the viewport is 768px or wider and the stored Goals view is `Table`
- **WHEN** the Goals list renders
- **THEN** it renders as the table with its full, static column set

### Requirement: The Actual/Potential legend renders once per list, only when relevant, not per row

When at least one visible goal has both an Actual and a Potential ratio to show, the "Actual" / "Potential" swatch legend SHALL render exactly once per list: in the Progress column's header on the desktop table, and above the first card wherever the list renders as cards (desktop Cards view and mobile). It SHALL NOT repeat per row or per card, and it replaces the old per-row "Actual progress" / "Potential progress" caption labels, which moved into `goal-progress-display`'s on-demand explanation. When no visible goal has a Potential ratio, the legend SHALL NOT render at all, since it would have nothing to distinguish.

#### Scenario: Desktop table with multiple goals showing both ratios

- **GIVEN** the Goals list renders three Rank goal rows in Table view, each with both an Actual and a Potential ratio
- **WHEN** the table renders
- **THEN** the legend appears once, in the Progress column header, and no row repeats it

#### Scenario: Mobile list with multiple goals showing both ratios

- **GIVEN** the same three goals render as cards below 768px
- **WHEN** the list renders
- **THEN** the legend appears once, above the first card, and no card repeats it

#### Scenario: Desktop Cards view with multiple goals showing both ratios

- **GIVEN** the same three goals render in desktop Cards view
- **WHEN** the grid renders
- **THEN** the legend appears once, above the grid, and no card repeats it

#### Scenario: No goal in the list has a Potential ratio

- **GIVEN** the Goals list renders only Unlock goals, which never compute a Potential ratio
- **WHEN** the list renders, as a table or as cards
- **THEN** no legend renders

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

Wherever the Goals list renders Active or Paused goals in priority order (the Goals page, `/plan/goals`, with or without a project scope), each such row or card SHALL show the goal's account-wide priority position (`globalPriority`, 1 to N across every Active and Paused goal) as visible text: in the row's leading cell beside the drag handle on the desktop table, and in the card header wherever the list renders as cards. The position is not a data column and SHALL NOT change the seven-column contract. It SHALL be the goal's position in the whole account order, never its index among the visible rows: with filters, Group, or a project view, the visible rows show non-consecutive numbers. Rows and cards without a position (Reached, Completed, or Archived goals) SHALL show none and SHALL leave that slot empty. The number SHALL appear in Comfortable and Compact density and on every card, SHALL meet the text-contrast rules of `goal-visual-accessibility`, and SHALL be part of the row's or card's accessible name or description (for example "Priority 3"). While a reorder is in flight or awaiting rollback, the numbers SHALL follow the same optimistic update as the order: the moved goal takes the displaced goal's number and the goals between them shift by one, reverting with the order on rollback.

#### Scenario: Active and Paused rows show a position

- **GIVEN** the account has goals with global positions 1 to 5, one of them Paused
- **WHEN** the Goals page renders unfiltered
- **THEN** every row or card shows its number 1 to 5, including the Paused one

#### Scenario: Goals without a position show none

- **GIVEN** a Reached, Completed, or Archived goal is visible
- **WHEN** its row or card renders
- **THEN** no priority number is shown and it keeps the same layout as its neighbours

#### Scenario: Filtered or project views show account-wide numbers

- **GIVEN** global order A, B, C, D, E (positions 1 to 5) and a project holding A, C, and E
- **WHEN** the Goals page renders scoped to that project
- **THEN** its rows or cards show 1, 3, and 5, not 1, 2, and 3, and the same goals show the same numbers on the Goals page

#### Scenario: Compact density and mobile cards keep the number

- **WHEN** the list renders in Compact density on desktop, as desktop Cards view, or as cards below 768px
- **THEN** each Active or Paused row or card still shows its number

#### Scenario: A reorder updates the numbers optimistically

- **GIVEN** global order A, B, C, D, E and a project holding A, C, and E
- **WHEN** the user moves E onto C on the Goals page scoped to that project
- **THEN** the rows or cards immediately read A 1, E 3, C 4, and the Goals page shows A 1, B 2, E 3, C 4, D 5
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

For a goal that has not reached its target, the Remaining cell (desktop) and the remaining area of the card (mobile) SHALL show the resource chips defined by `goal-remaining-resources` in place of the previous sentence. The Remaining cell SHALL NOT show an upgrade-slot count ("N slots") or a raw XP figure ("N XP"). Remaining sits between "Done by" and Progress on the desktop table (see "Desktop table uses static columns with a leading control cell and a row menu"), and its chips SHALL use icons and text at least as large as the row's body text so the energy figure reads at a glance.

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

### Requirement: Desktop table uses static columns with a leading control cell and a row menu

While the Table view is selected (see "Users choose between a Cards view and a Table view, Cards by default"), the Goals list SHALL render as a table with these data columns, in order: Character, Projects, Goal, Status, "Done by", Remaining, and Progress. Progress is last and narrow: it is the least-scanned figure in the row (UserJot "V2 Goals Page Is Harder to Scan"), so the status, completion date, day count and energy come before it. These columns SHALL remain static: none of them SHALL be hidden or added based on the table's or viewport's width — the only layout change at any desktop width is the fixed set of columns above, and below the mobile breakpoint the same columns scroll sideways inside the list. A column set that changes with width was tried and rejected: it made the page feel like it was "jumping" as the table resized. Progress SHALL be the last column at a fixed narrow width; Remaining chips wrap within their own cell.

The Character column SHALL show the unit's avatar (drawn larger than the 40px V2 launch size so it reads like V1's goal cards), its name, and, when the goal has notes, the notes on a single line directly beneath the name (truncated with an ellipsis after that one line, the full text available as a tooltip), and SHALL NOT show the goal type as a text caption or the goal's project badges; the goal type is instead encoded in the Goal column (see "The Goal column encodes the goal kind visually, without a type label"). At the trailing edge of the Character cell, every row SHALL render an always-visible "⋯" menu trigger with an accessible name, opening the row's actions menu: Edit, then Pause or Resume (for a goal that is not Reached and is Active or Paused respectively — see `goal-status-actions`), then Delete as a destructive item. There SHALL be no separate Actions column and no inline action icon buttons in the row. The Projects column SHALL show the goal's project-membership badges (colour dot and project name, wrapping within the cell), and SHALL be empty for a goal in no project; its header text SHALL be visible. The Goal column SHALL show the goal's from → to representation as defined by "The Goal column encodes the goal kind visually, without a type label", with the rank and rarity emblems drawn at the large size. The Status column SHALL show only the goal's status chip(s) (Active/Paused toggle, Reached, Blocked/Restricted), drawn at body-text size so Active and Paused read at a glance. The "Done by" column SHALL show the `goal-list-estimate-display` completion date as its headline (body-text size, foreground colour) with the day count on a line directly beneath, and any season-fit label under that; when no estimate is available the cell SHALL be empty rather than showing a placeholder; a blocked estimate's per-material detail SHALL NOT render in the cell (it is the Blocked indicator's tooltip content, see `goal-list-estimate-display`).

Each row SHALL render at a fixed height sized to one line of content per column (with the Character column's name-and-notes lines and the "Done by" column's date-and-days lines accommodated within that same fixed height). Two exceptions SHALL exist: a row whose Progress cell carries level-requirement sub-lines, and a row whose Remaining chips wrap beyond two lines (see `goal-remaining-resources`: every chip renders) — such a row SHALL grow only as far as its wrapped content needs, and no other row SHALL change height because of it. The existing alternating row (zebra) striping SHALL be preserved.

Every row SHALL have a leading cell before the Character column holding, in order: the selection checkbox (`goal-bulk-actions`; below the mobile breakpoint, only in select mode), the account-wide priority number for an in-flight row, and — when the table renders on a route where inline reordering is available (the Goals page, with or without a project scope — see `global-goal-priority`'s "Owner can reorder from Goals") and at or above the mobile breakpoint — a drag handle for each Active or Paused row. This cell holds control affordances, not a data column, and does not change the seven static columns above; the handle is present only in a reorderable context and absent elsewhere, which is a context-conditional distinction, not the width-conditional column-hiding this requirement otherwise prohibits.

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

- **GIVEN** the viewport is at or above the mobile breakpoint, at any desktop width, and Table view is selected
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

### Requirement: The list stays in its loading state until row membership is known

The Goals list SHALL show its loading skeleton, and no goal rows, "filters match nothing" line, or empty-project card, until the rows it shows are decided: the goal list (which carries every goal's configuration and project memberships); for a requested project scope, the project list as well; and, on All statuses, Unfulfilled and Reached, the player-data tables attainment reads. No per-goal or per-project read SHALL be awaited. A failed request or a never-synced table SHALL count as decided. Active, Paused, and Blocked do not wait on attainment.

#### Scenario: Reached goals never flash on Unfulfilled

- **GIVEN** three Active goals of which one is reached
- **WHEN** Goals opens on Unfulfilled and the goal list loads
- **THEN** the skeleton stays until the player-data attainment reads are decided, and then exactly the two unreached goals render; the reached goal is never rendered on Unfulfilled, and no per-goal read is issued

#### Scenario: Deep-linked scope waits for its members

- **GIVEN** the user opens `/plan/goals?project={id}` for one of their projects with one member goal
- **WHEN** the goal list has loaded but the project list has not
- **THEN** the skeleton shows and neither goal rows nor the "filters match nothing" line render; once the project list loads, the one member goal renders without any further request

#### Scenario: Unsynced player data does not hang the list

- **GIVEN** the player-data tables have never been synced
- **WHEN** Goals opens on Unfulfilled and the goal list has loaded
- **THEN** the skeleton clears and the rows render, treating the unsynced tables as decided

### Requirement: Late page notices render below the list

The estimates-failed notice (with its retry) and the "no farmable demand" line SHALL render below the goal list, not between the controls and the list, so their arrival after the rows does not move the rows. This is the same on desktop and mobile.

#### Scenario: Estimates fail after the rows render

- **GIVEN** goal rows are visible
- **WHEN** the plan estimates request fails
- **THEN** the estimates-failed notice appears below the last row and the rows do not move

### Requirement: Users choose between a Cards view and a Table view, Cards by default

The Goals toolbar SHALL contain a two-option Table/Cards toggle at every width: in the filters row (`goals-navigation`) at or above the mobile breakpoint, and in the mobile control row below it. The toggle SHALL have an accessible group name and an accessible name and pressed state for each option. Selecting an option SHALL switch the Goals list between the cards and the table at once, without reloading goals or estimates, and SHALL keep the current filters, Group, project scope, season-fit mode, selection and scroll context.

The choice SHALL be stored per device, in browser storage, so a player can keep Cards on a phone and Table on a desktop. It SHALL NOT be stored in the URL or in the account's user settings, and SHALL NOT follow the account to another browser. The default SHALL be `Cards`. The client SHALL treat a missing or unrecognized stored value as `Cards`. When the browser refuses the write, the choice SHALL still apply for the rest of the visit (`browser-storage-resilience`).

The stored view SHALL be read synchronously, so the list SHALL NOT wait for it and a stored `Table` choice SHALL never flash as cards.

#### Scenario: A device with no stored view sees cards

- **GIVEN** a browser that has never stored a Goals view
- **WHEN** the Goals page opens at 1280px or 420px wide
- **THEN** the list renders as cards and the toggle shows Cards as pressed

#### Scenario: Switching to Table persists on this device

- **GIVEN** the Goals page in Cards view
- **WHEN** the user selects Table
- **THEN** the table renders at once, and after a reload the Goals page opens in Table view

#### Scenario: Each device keeps its own view

- **GIVEN** an account that selected Table on a desktop browser
- **WHEN** it opens the Goals page on a phone where it never chose a view
- **THEN** the phone shows cards, and the desktop still opens in Table view

#### Scenario: Browser storage is blocked

- **GIVEN** a browser that refuses the storage write
- **WHEN** the user selects Table
- **THEN** the table renders and stays for the rest of the visit, and no error is shown

#### Scenario: Reorder mode on a phone leaves the table

- **GIVEN** the Goals page below the mobile breakpoint in Table view
- **WHEN** the user turns reorder mode on
- **THEN** the list shows the collapsed reorder cards with the Table/Cards toggle disabled, and leaving reorder mode returns to the table

### Requirement: Goal cards share one layout on every platform

Wherever the Goals list renders as cards, each goal SHALL render as one card in a grid whose columns are each at least 380px wide (or the full width, when narrower) and fill the available width. In Cards view the Goals tab SHALL NOT apply the page's maximum content width (1600px), so a wide screen adds columns rather than margins; the Table view and the other Goals-area tabs keep that maximum. Below the mobile breakpoint this grid is a single column. Cards in the same grid row SHALL be equal height, with their footers aligned. Wherever another requirement of this capability describes the mobile card or card behavior, it SHALL apply to this card on every platform.

Each card SHALL contain, from top to bottom:

1. **A header.** In order:
   - the selection checkbox (always at or above the mobile breakpoint; below it only while select mode is active, see `goal-bulk-actions`);
   - the account-wide priority number;
   - the drag handle, for an Active or Paused goal at or above the mobile breakpoint where reordering is available;
   - the unit avatar;
   - the unit name with, beneath it, a meta line holding the "Done By" date and day count (when an estimate exists), the season-fit label (when a mode is on), and the goal's project badges (when it has projects), wrapping as needed; a long project name is truncated at a fixed badge width, with the full name as its tooltip;
   - the "⋯" row-actions menu at the trailing edge.
2. **A body**, laid out in V1's row positions: each row's figures sit at its right end, with no separator lines or dividers between rows or figures. An Ascension or Ability goal uses V1's own body for its kind (below); every other kind, in order:
   - the target row: the goal line (the same from → to representation as the desktop Goal column) on the left, and the energy and Onslaught-token chips (`goal-remaining-resources`) at the right end;
   - the covered-by note, when applicable;
   - the progress bar with its percent readout (`goal-progress-display`);
   - the level row, when the goal has a level requirement: the XP-book figure, then its Potential-only bar, then the level target ("Lv 40 → 50"), and the gold chip at the right end, all centered on one line, wrapping only when a narrow phone cannot fit them;
   - the remaining-resource chips that are not already on a row above (badges, forge badges, components, orbs, shards, shop currency, and gold when there is no level row), wrapping on the left.

   An **Ascension** goal's body, in order: the target row (as above); the covered-by note, when applicable; its orb chips on their own row; then one labelled bar per shard kind the goal costs ("Shards", "Mythic shards"), each reading the owned shards the plan applies to the goal's own steps against what those steps cost in total ("120 / 400"). It has no general progress bar, and the shard chips are replaced by these bars.

   An **Ability** goal's body, in order: a cost row with the ability badges, forge badges, components and gold on the left and the energy and Onslaught-token chips at its right end; the ability tracks still being raised as soft blocks sharing the row's width ("ACTIVE 20 → 26", "PASSIVE 20 → 50"); the covered-by note, when applicable; and the level row (XP-book figure, Potential-only bar, level target), without a gold chip. It has no general progress bar.

   Every chip the goal's kind defines still renders exactly once.

3. **A notes section**, only when the goal has notes. It is separated by a rule, shows the notes clamped to two lines, and makes the full text available as a tooltip.
4. **A footer**, separated by a rule and pinned to the bottom of the card. It holds the status chip and, when blocked, the Blocked or Restricted indicator. The status chip of a goal that has not reached its target and is Active or Paused SHALL be a one-click Pause/Resume control with an accessible name naming the status and the action. This is in addition to the menu's Pause/Resume item (`goal-status-actions`).

The goal type SHALL lead the goal line as a badge, because a card has no Goal column header and two goals for one unit otherwise differ only by their emblems. An Unlock goal's line SHALL be the badge alone, since its target readout is already the word "Unlock". A Reached goal's card SHALL keep this layout with the Reached treatment. The card SHALL reflow without horizontal scrolling at 200% browser zoom.

#### Scenario: A desktop card in Cards view

- **GIVEN** an Active Rank goal at priority 3, with notes, in project "Neuro", with a completion estimate of Oct 11 (in 22 days)
- **WHEN** it renders in Cards view at 1280px wide
- **THEN** its header shows a checkbox, "3", a drag handle, the avatar, the name and a meta line "📅 Oct 11 · 22 days" with the "Neuro" badge, and a "⋯" menu; its body shows the rank emblems with the energy chip at the right end of their row, then the progress bar, then the level line with the gold chip at its right end; a ruled section shows the notes; and its footer shows the "Active" chip with a pause action

#### Scenario: The grid fills the width

- **GIVEN** the Goals list in Cards view at a content width of 1000px
- **WHEN** it renders
- **THEN** the cards sit two to a row, each at least 380px wide, and cards in one row share a height with aligned footers

#### Scenario: A wide screen adds columns in Cards view

- **GIVEN** a 3440px-wide screen
- **WHEN** the Goals tab renders in Cards view
- **THEN** the grid spans the full content width beside the sidebar, with more than four cards to a row
- **AND** after switching to Table view, the table keeps the page's 1600px maximum width

#### Scenario: An Ascension card shows orbs and shard bars as V1 did

- **GIVEN** an Ascension goal whose estimate needs 15 Onslaught tokens, which costs 20 Legendary orbs and 400 shards, and to which the plan applies 120 owned shards
- **WHEN** its card renders
- **THEN** the token chip sits at the right end of the row with the rarity icons, the orb chip renders on the row below, and a "Shards" bar below that reads "120 / 400", with no general progress bar, no shard chip and no Mythic shards bar

#### Scenario: An Ability card shows costs, track blocks and the level row as V1 did

- **GIVEN** an Ability goal raising Active 20 → 26 and Passive 20 → 50, costing 12 Epic ability badges and 505k gold, with a level requirement of Lv 40 → 50
- **WHEN** its card renders
- **THEN** the top row shows the gold and badge chips with the energy chip at its right end, then an "ACTIVE 20 → 26" block and a "PASSIVE 20 → 50" block sharing one row, then the level row without a gold chip, and no general progress bar

#### Scenario: A long project name is truncated in the meta line

- **GIVEN** a goal in a project named "V1 import · 26 Oct, 13:48 UTC"
- **WHEN** its card renders
- **THEN** the project badge is cut at its fixed width with an ellipsis, and hovering it shows the full name

#### Scenario: A phone shows the same card in one column

- **GIVEN** the same goal
- **WHEN** the Goals page renders at 420px wide
- **THEN** the card has the same header, body, notes section and footer in a single column, without a checkbox or drag handle outside select or reorder mode

#### Scenario: The footer chip pauses the goal

- **GIVEN** an Active goal that has not reached its target
- **WHEN** the user activates its footer status chip
- **THEN** the goal is paused through the same cascade as the menu's Pause item, and the chip then reads "Paused" with a resume action

#### Scenario: A goal with no notes and no estimate

- **GIVEN** a goal with no notes and no completion estimate
- **WHEN** its card renders
- **THEN** there is no notes section and the meta line shows only what applies (or is absent), and the footer still aligns with its neighbours

### Requirement: Projects and notes have a fixed place in table rows and in cards

On the desktop table, a goal's project memberships SHALL render only in the standalone Projects column between Character and Goal, never inside the Character cell. A goal's notes SHALL render in the Character cell on one line directly beneath the unit name (where the goal-type caption used to be), truncated after one line, and SHALL NOT render as an extra line below the cell's other content. The Projects column SHALL appear on the Goals page and on a project's detail route alike. Wherever the list renders as cards, project badges SHALL render in the card header's meta line and notes in the card's notes section, as defined by "Goal cards share one layout on every platform".

A goal row or card SHALL show only the goal's non-archived projects. A membership in an archived project SHALL NOT render as a badge in the list; it stays visible, marked Archived, in the goal's membership editor (`goal-project-membership`).

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

#### Scenario: Archived projects are not shown on the row

- **GIVEN** a goal that belongs to the archived project "V1 Tacticus" and the project "Neuro"
- **WHEN** the goal renders as a desktop table row or as a card
- **THEN** only the "Neuro" badge renders, and no "V1 Tacticus" badge

#### Scenario: A goal in no project

- **GIVEN** a goal that belongs to no project
- **WHEN** the desktop table renders its row
- **THEN** the Projects cell is empty and the row keeps its height and column alignment

#### Scenario: Cards place projects in the header and notes in their own section

- **GIVEN** a goal with notes and the projects "My Goals" and "Neuro"
- **WHEN** it renders as a card, in desktop Cards view or below 768px
- **THEN** both badges render in the header's meta line and the notes render in the ruled notes section, clamped to two lines
