# goal-priority-picker Specification

## ADDED Requirements

### Requirement: Each priority option names the goal at that position

The priority picker SHALL list positions 1 to N, where N is the number of in-flight (Active and Paused) goals in the account-wide order, counting goals the current filters hide. Each option SHALL show the position, the unit portrait and localized name, the goal type, and the target of the goal holding that position now, for example "4 · Ragnar · Rank → A1". The option for the edited goal's own position SHALL be marked "(current)". Options SHALL NOT show project dots.

#### Scenario: Options for five goals

- **GIVEN** the in-flight order is Ragnar Rank → A1, Kharn Ascension → Legendary, Calgar Rank → D3, Abaddon Unlock, Trajann Rank → G2
- **WHEN** the user opens the picker for Calgar's goal
- **THEN** it lists "1 · Ragnar · Rank → A1", "2 · Kharn · Ascension → Legendary", "3 · Calgar · Rank → D3 (current)", "4 · Abaddon · Unlock" and "5 · Trajann · Rank → G2"

### Requirement: The picker is searchable by number or unit

The picker SHALL have a search field. A whole number SHALL show that position only. Text SHALL match a case-insensitive substring of the unit name or goal type label. When nothing matches, it SHALL show "No matching position". On desktop the list opens as a popover. On mobile it opens full width with the search field pinned on top.

#### Scenario: Search by unit

- **WHEN** the user types "kha" in the picker for the five goals above
- **THEN** only "2 · Kharn · Ascension → Legendary" is listed

#### Scenario: Out-of-range number

- **WHEN** the user types "9"
- **THEN** the list shows "No matching position"
