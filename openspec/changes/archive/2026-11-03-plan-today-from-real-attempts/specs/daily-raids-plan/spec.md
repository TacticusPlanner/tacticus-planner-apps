# Spec Delta

## ADDED Requirements

### Requirement: Day 1 starts from today's real attempts and energy

Raids Plan's Day 1 SHALL cap each node at the player's real attempts left today and SHALL spend only the daily energy limit less the real energy spent today; later days SHALL start with fresh attempts and the full limit. A need that cannot be raided on Day 1 because its nodes are raided out SHALL carry to the following days, so every Active goal with a farmable need is scheduled on some day. Goal completion dates on the Plan SHALL follow from this schedule.

#### Scenario: Goal raided out today is scheduled tomorrow

- **GIVEN** a goal still needs 4 of a material whose only node has 0 attempts left today
- **WHEN** Raids Plan renders
- **THEN** Day 1 has no cell for that material, and Day 2 schedules its 4 raids
