# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Picker tiles fit their objective icons on one line

The picker grid SHALL have three columns below 768px and five at or above it, so a tile's satisfied and muted objective icons (up to five) sit on one line without wrapping.

#### Scenario: Mobile grid

- **WHEN** the picker renders at 375px
- **THEN** three tiles share a row and each tile's objective icons fit on one line

#### Scenario: Desktop grid

- **WHEN** the picker renders at 1280px
- **THEN** five tiles share a row
