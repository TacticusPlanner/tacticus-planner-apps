# legendary-event-team-editor-workflow Specification

## Purpose

Defines how a Legendary Event team is built quickly in the team editor: filtering and ranking the unit picker by objective, keeping the summary and Save in view, saving several teams in a row, and starting a team from a leaderboard row.

## Requirements

### Requirement: The picker filters and ranks units by objective

The team editor's picker SHALL show the lane's five objectives as multi-select chips (icon, label, score) above the unit grid, none selected by default. While one or more are selected, units that satisfy every selected objective SHALL come first, in the picker's current sort order (see the picker sort requirement), and the other units SHALL follow dimmed, in the same order; no unit is hidden by a chip. Each chip SHALL show how many listed units satisfy it together with every chip already selected; a selected chip shows how many satisfy the whole selection. With no chip selected, each counts the units satisfying it alone.

#### Scenario: Two objectives selected

- **GIVEN** the editor on Lysander Alpha where Dante satisfies Flying and No Resilient and another unit satisfies only Flying
- **WHEN** the user selects the Flying and No Resilient chips
- **THEN** Dante is listed before the Flying-only unit, which follows dimmed

#### Scenario: No chip selected

- **WHEN** the editor opens
- **THEN** the grid follows the default sort (Power, see the picker sort requirement) and no tile is dimmed

#### Scenario: Chip counts follow Only unlocked

- **GIVEN** 14 units satisfy Flying and 3 of them are locked
- **WHEN** Only unlocked is on
- **THEN** the Flying chip reads 11 and the grid lists only the 11 owned units

#### Scenario: Counts follow the selection

- **GIVEN** 14 listed units satisfy Flying, 9 satisfy No Resilient and 5 satisfy both
- **WHEN** the user selects Flying
- **THEN** the Flying chip reads 14 and the No Resilient chip reads 5
- **AND** after also selecting No Resilient both chips read 5

### Requirement: The picker filter composes with the other picker controls

The objective chips SHALL work together with the search field, Only unlocked and the picker's Goals Preview switch: a unit is listed only when it passes the search and Only unlocked; the chips only reorder and dim. Selecting a dimmed unit SHALL be allowed and SHALL update the derived coverage as before. The chips' selection SHALL reset when the editor closes.

#### Scenario: Search with a chip

- **GIVEN** the Melee chip is selected and the search reads "cal"
- **WHEN** the grid renders
- **THEN** only units whose name contains "cal" are listed, those satisfying Melee first

#### Scenario: A dimmed unit can still be picked

- **GIVEN** the Melee chip is selected and a unit that does not satisfy Melee is dimmed
- **WHEN** the user picks it
- **THEN** it joins the team and the derived coverage drops Melee

#### Scenario: Selection resets

- **WHEN** the editor is closed and reopened
- **THEN** no chip is selected

### Requirement: The editor keeps its summary and actions in view

The editor SHALL keep a footer visible while the body scrolls, on the desktop dialog and the mobile sheet, showing the member count ("n/5 · at least 3" below three), the covered objectives as compact chips, the clear depth (the value, or the estimate marked "estimated") and the Cancel, Save and Save and add another actions. Unticking an objective and editing the depth stay in the body.

#### Scenario: Footer while scrolling the picker

- **GIVEN** the editor with four members and a long unit grid
- **WHEN** the user scrolls the grid to the bottom
- **THEN** the footer still shows "4/5", the covered objectives, the estimated depth and Save, with no scrolling needed to reach them

#### Scenario: Footer on mobile

- **WHEN** the editor opens below 768px
- **THEN** the same footer content sits above the safe area, the actions have touch targets of at least 44px and the sheet body scrolls underneath

### Requirement: Save and add another builds teams in a row

When creating a team the editor SHALL offer **Save and add another** beside Save. It saves the team, then clears the members, name and depth for a new team on the same lane while keeping the objective chips, Only unlocked, the search text and the Goals Preview switch, and puts focus on the search field; the team list updates behind the editor. It SHALL NOT be offered when editing a team, SHALL be unavailable whenever Save is, and after a failed save SHALL leave the draft as Save does.

#### Scenario: Two teams in a row

- **GIVEN** a valid three-member draft on Alpha with the Flying chip selected
- **WHEN** the user chooses Save and add another
- **THEN** the team is created, the editor stays open with no members, the Flying chip still selected and focus on the search field, and the Alpha list shows the new team

#### Scenario: Editing offers only Save

- **WHEN** the editor opens on an existing team
- **THEN** only Cancel and Save are offered

#### Scenario: Failed save keeps the draft

- **GIVEN** the plan was reloaded by another device
- **WHEN** the user chooses Save and add another
- **THEN** the draft stays, the editor says the save was not applied, and nothing is cleared

### Requirement: Leaderboard rows can start a team

A leaderboard row's actions menu SHALL carry **Add to new team** after Create goal. On a lane leaderboard it SHALL open the team editor for that lane with the unit as the first member. On the Overview leaderboard it SHALL list one item per lane that allows the unit ("Add to new team on Alpha"). The editor opens as for a suggestion (derived objectives ticked, default name) and nothing is saved until the user saves.

#### Scenario: Lane leaderboard

- **WHEN** the user opens Dante's row menu on the Alpha leaderboard and chooses Add to new team
- **THEN** the editor opens on Alpha with Dante as the first member and his objectives ticked

#### Scenario: Overview leaderboard

- **GIVEN** Dante is allowed on Alpha and Gamma but not on Beta
- **WHEN** the user opens his row menu on Overview
- **THEN** the menu lists "Add to new team on Alpha" and "Add to new team on Gamma", and no Beta item

#### Scenario: Locked unit

- **GIVEN** a locked unit
- **WHEN** the user chooses Add to new team
- **THEN** the editor opens with the unit as first member, shown with its locked styling

#### Scenario: The event page tour mentions it

- **WHEN** the event page tour runs
- **THEN** the lane leaderboard step's copy names Add to new team beside Create goal, localized in en, de, es and fr

### Requirement: Picker tiles show remaining points

Each picker tile's points figure SHALL be the unit's **remaining points** on the lane as the eligibility leaderboard defines them (`legendary-event-eligibility`), from the synced progress, read as "N pts left", with a tooltip saying it covers the whole lane, all battles (unlike a card's points left, which stops at its depth). Goals Preview never changes it.

Assumptions:

- Defeat-all stands in for the unit's kill points, as on the leaderboard.
- Without synced progress nothing is cleared.

#### Scenario: Worked example on Lysander Alpha

- **GIVEN** Lysander Alpha (18 battles, `killPoints` 32, Flying 80, No Resilient 40) with synced progress where battles 1–13 have defeat-all and No Resilient cleared and Flying open, and battles 14–18 are untouched
- **AND** Dante satisfies Flying and No Resilient
- **WHEN** the picker renders
- **THEN** battles 1–13 each add 80 (Flying only) = 1,040 and battles 14–18 each add 32 + 80 + 40 = 152, so 760; Dante's tile reads "1,800 pts left" (previously "152 pts")

#### Scenario: Unit with nothing left

- **GIVEN** a unit satisfying only No Resilient and progress where defeat-all and No Resilient are cleared in every battle
- **WHEN** the picker renders
- **THEN** its tile reads "0 pts left" and sorts after units with points left under the default sort

### Requirement: Picker tiles show each owned unit's strength

Every tile of a unit the shown roster holds SHALL show its rarity icon and rank badge and, when clear estimates are available, its estimated clears on the lane as "~n" (a team of five like this unit, `legendary-event-clear-estimates`), whether or not Goals Preview is on. With Goals Preview on, these read the preview roster and the tile keeps its preview marker. Locked or unknown units show none of the three. While estimates load the clears show a dash, announced as "Estimating…".

#### Scenario: Owned unit at a glance

- **GIVEN** an owned unit at Legendary, Diamond 2 with an estimated clears of 9 on the lane, and Goals Preview off
- **WHEN** its tile renders
- **THEN** it shows the Legendary rarity icon, the Diamond 2 rank badge and "~9"

#### Scenario: Locked unit

- **WHEN** a locked unit's tile renders
- **THEN** it shows the locked styling and no rarity, rank or clears

#### Scenario: Estimates unavailable

- **GIVEN** the horde-mode tier read failed
- **WHEN** an owned unit's tile renders
- **THEN** it shows rarity and rank and no clears figure

#### Scenario: Mobile tile

- **WHEN** the picker renders below 768px in its three-column grid
- **THEN** rarity, rank and "~n" sit on one line under the name without truncating the points figure

### Requirement: The picker has a Points left / Power sort

The picker SHALL offer a **Sort** with **Power** (default: effective power on the lane and shown roster per `legendary-event-clear-estimates`, descending, locked units at 0, then remaining points, then name) and **Points left** (remaining points, then objectives count, then name). Chips, search and Only unlocked apply on top. The choice SHALL reset when the editor closes and survive Save and add another.

#### Scenario: Sort by power

- **GIVEN** owned units A (effective power 24,753, 1,200 pts left) and B (effective power 13,912, 1,800 pts left)
- **WHEN** the editor opens
- **THEN** A is listed before B; after picking Points left B is listed before A

#### Scenario: Power with a chip

- **GIVEN** Power is selected and the Flying chip is selected
- **WHEN** the grid renders
- **THEN** Flying units come first by power, then the others dimmed by power

#### Scenario: Power estimates unavailable

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** the picker opens
- **THEN** the Power option is disabled with the reason "Power data unavailable" and the grid uses Points left

#### Scenario: Sort resets

- **WHEN** the editor is closed and reopened
- **THEN** the sort is Power

### Requirement: Picker tiles fit their objective icons on one line

The picker grid SHALL have three columns below 768px and five at or above it, so a tile's satisfied and muted objective icons (up to five) sit on one line without wrapping.

#### Scenario: Mobile grid

- **WHEN** the picker renders at 375px
- **THEN** three tiles share a row and each tile's objective icons fit on one line

#### Scenario: Desktop grid

- **WHEN** the picker renders at 1280px
- **THEN** five tiles share a row

### Requirement: Picker tiles mark tier and support traits

Every picker tile SHALL show, in a column at its top-left corner (mirroring the reserve button), the character's horde-mode tier as a badge in that tier's colour when the tier list places it in a tier, and below it an icon for each of its Healer and Mechanic traits. Markers show for owned and locked units alike and carry screen-reader text. With no tier, the trait icons take the badge's place. While the tier list is unavailable, no badge shows.

#### Scenario: Tiered healer

- **GIVEN** a character in tier S with the Healer trait
- **WHEN** its tile renders
- **THEN** the top-left column shows an "S" badge in the S colour, announced as "Tier S", with the Healer icon below it

#### Scenario: Untiered mechanic

- **GIVEN** an untiered character with the Mechanic trait
- **WHEN** its tile renders
- **THEN** the top-left column shows only the Mechanic icon

#### Scenario: No markers

- **GIVEN** an untiered character with neither trait
- **WHEN** its tile renders
- **THEN** no marker column shows

#### Scenario: Locked unit

- **GIVEN** a locked character in tier A with the Healer trait
- **WHEN** its tile renders
- **THEN** it shows the "A" badge and the Healer icon
