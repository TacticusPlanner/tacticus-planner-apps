## ADDED Requirements

### Requirement: Raids Plan offers a Show-only-available toggle scoped to Day 1

Raids Plan SHALL provide a "Show only available" toggle within the whole-plan summary area, alongside the "Show all days" control and the collapse/expand density toggle. It SHALL default to off. When on, it SHALL hide, from the Day 1 ("Today") column only, any node whose real synced attempts today have reached zero remaining — the same exclusion `daily-raids-today` already applies unconditionally to Today. Day 2 onward SHALL be unaffected by this toggle, since only Day 1 has real synced attempts-left data; the simulated per-day attempt caps for later days are a projection, not a record of attempts already used.

#### Scenario: Off by default preserves existing behavior

- **GIVEN** a plan whose Day 1 column includes a node with zero real attempts left today
- **WHEN** Raids Plan loads without the user touching the toggle
- **THEN** that node remains visible in the Day 1 column, the same as before this toggle existed

#### Scenario: Enabling the toggle hides Day 1's exhausted nodes

- **GIVEN** the Day 1 column includes a node with zero real attempts left today
- **WHEN** the user turns the "Show only available" toggle on
- **THEN** that node is hidden from the Day 1 column, the same as Today's own schedule already hides it

#### Scenario: Later days are unaffected

- **GIVEN** the toggle is on and Day 2's column includes a node the simulated plan has fully allocated for that day
- **WHEN** Raids Plan renders Day 2
- **THEN** that node remains visible in Day 2's column, because Day 2 has no real attempts-left data for this toggle to act on

#### Scenario: Turning the toggle off restores hidden nodes

- **GIVEN** the toggle is on and a node is currently hidden from Day 1
- **WHEN** the user turns the toggle off
- **THEN** that node reappears in the Day 1 column

#### Scenario: The toggle is discoverable without hovering

- **WHEN** Raids Plan renders at either breakpoint
- **THEN** the toggle is visible in the whole-plan summary area, labeled or accessibly named, without requiring hover, focus, or an opened menu
