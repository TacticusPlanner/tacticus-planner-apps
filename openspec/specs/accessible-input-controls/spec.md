# accessible-input-controls Specification

## Purpose

Defines how the shared selection controls — combobox popups, labeled selects, operable tile grids and sortable lists — are exposed to assistive technology, so they are operable by keyboard and correctly announced in every supported locale.

## Requirements

### Requirement: Combobox triggers reference their popup

Every control exposed with the combobox role SHALL carry `aria-controls` pointing at the id of its listbox while the popup is open, together with the existing `aria-expanded` state.

#### Scenario: Open popup is linked

- **WHEN** a user opens a unit, rarity, option, NPC-filter or raid-boss combobox
- **THEN** the trigger's `aria-controls` resolves to the rendered listbox element and `aria-expanded` is true

### Requirement: Select wrappers have a programmatically linked label

The rank and progression select controls SHALL associate their visible label with the trigger so the trigger's accessible name is the label text.

#### Scenario: Screen reader reads the label

- **WHEN** focus lands on the rank or progression select trigger
- **THEN** the control is announced with the visible label text as its name, and clicking the label focuses the trigger

### Requirement: Operable tile grids are one tab stop

A grid of operable unit tiles (tiles that are buttons or links) SHALL expose one tab stop per row (a roving `tabIndex` remembering the row's last focused tile) and SHALL move focus with the arrow keys: Left/Right within the row, stopping at its ends; Up/Down to the same index in the adjacent row, clamped; Home/End to the row's first and last tile; Tab leaves the row. Grids whose tiles are not operable (the Collection) SHALL NOT add tab stops.

#### Scenario: Tier List keyboard traversal

- **WHEN** a keyboard user tabs into a Tier List row and presses Right, then Down, then Left at the row's start
- **THEN** Right moves to the next tile in the row, Down moves to the same index in the row below, Left at the first tile stays put, and Tab leaves that row in one press

#### Scenario: Collection stays non-interactive

- **WHEN** a keyboard user tabs through the Collection page
- **THEN** no unit tile receives focus

### Requirement: Reorder announcements are localized

Drag-and-drop reordering in sortable lists SHALL announce pick-up, movement, drop and cancel in the active locale, naming the item and its position.

#### Scenario: Keyboard reorder in German

- **WHEN** the active locale is German and a user picks up a goal row with the keyboard, moves it one position and drops it
- **THEN** each step is announced in German with the row's name and its new position among the total

#### Scenario: Unsupported locale falls back

- **WHEN** the active locale has no translation for an announcement key
- **THEN** the English announcement is used
