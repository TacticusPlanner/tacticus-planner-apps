## MODIFIED Requirements

### Requirement: The player records their current mission and its progress

On a running event, the player SHALL be able to choose the current mission (1 to 20, or Bonus) and to enter a whole-number progress from 0 to the target for each of its two objectives. A progress of 0 SHALL show as an empty input with a "0" placeholder, so typing never adds to a leading 0. Each objective below its target SHALL offer a one-click "Mark done" that sets its progress to the target. Missions before the current one SHALL show as done. Later missions SHALL show as locked. Progress SHALL be clamped to the target, and an objective at its target SHALL show as complete. A "Mission complete" action, available once both objectives are at target, SHALL advance to the next mission with both progress values at 0. With no stored progress, the current mission SHALL be 1 with progress 0 and 0.

#### Scenario: Setting mission 5 progress

- **GIVEN** a running event with no stored progress
- **WHEN** the player picks mission 5 and enters 6,000 ability damage and 37 campaign wins
- **THEN** missions 1 to 4 show as done, mission 5 shows 6,000 / 10,000 and 37 / 100, and missions 6 to Bonus show as locked

#### Scenario: Typing into an empty objective

- **GIVEN** an objective at 0
- **WHEN** the player types 33
- **THEN** the input reads 33, not 033

#### Scenario: One-click objective

- **GIVEN** mission 5 at 37 / 100 campaign wins
- **WHEN** the player presses "Mark done" on that objective
- **THEN** it reads 100 / 100, shows as complete, and its "Mark done" disappears

#### Scenario: Clamping

- **WHEN** the player enters 140 for "Win 100 campaign battles"
- **THEN** the value is stored as 100 and the objective shows as complete

#### Scenario: Completing a mission

- **GIVEN** mission 5 has both objectives at target
- **WHEN** the player presses "Mission complete"
- **THEN** mission 6 becomes current with progress 0 and 0

#### Scenario: Last mission done

- **GIVEN** the Bonus mission has both objectives at target and the player presses "Mission complete"
- **THEN** every mission shows as done and the tab says "All missions complete"

#### Scenario: Preview is read-only

- **GIVEN** the tab previews an upcoming event
- **THEN** the mission picker and progress inputs are not shown
