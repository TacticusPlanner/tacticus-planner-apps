## MODIFIED Requirements

### Requirement: Raids Filters entry point

Dailies > Raids (Today) SHALL provide a keyboard-operable, accessibly named "Raids Filters" action in the same row as the project selector (icon-only on mobile, icon plus label on desktop). The Dailies > HSE tab SHALL provide the same action above its raid lists, and the Dailies > HRE tab in its raids section, both sharing the same applied filter. Plan > Schedule, Goals and the Plan SHALL NOT provide it. When at least one filter is active the action SHALL show a badge with the count of active filter groups, counting each of these as one when set: ally alliances, ally factions, enemy alliances, enemy factions, enemy traits, enemy types, minimum enemies, maximum enemies, campaign types, slots, upgrade rarities.

#### Scenario: Badge reflects active groups

- **GIVEN** ally factions, enemy types and a minimum enemy count are set
- **WHEN** Today renders
- **THEN** the Raids Filters action shows a badge of 3

#### Scenario: Enemy traits count as one group

- **GIVEN** two enemy traits are selected
- **THEN** they add 1 to the badge count

#### Scenario: No filters

- **WHEN** no filter is set
- **THEN** no badge is shown

#### Scenario: HSE tab has the entry point

- **GIVEN** a filter set on Today
- **WHEN** the HSE tab renders
- **THEN** it shows the Raids Filters action with the same badge count

#### Scenario: Schedule has no entry point

- **WHEN** Plan > Schedule renders
- **THEN** it shows no Raids Filters action

#### Scenario: HRE tab has the entry point

- **GIVEN** a filter set on Today
- **WHEN** the HRE tab renders a running or upcoming event
- **THEN** its raids section shows the Raids Filters action with the same badge count
