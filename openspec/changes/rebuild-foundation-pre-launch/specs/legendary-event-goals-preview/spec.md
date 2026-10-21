# Spec Delta

## MODIFIED Requirements

### Requirement: Goals Preview and badges degrade by data state

While the goals are loading, no badge SHALL show and the switch SHALL be disabled with a busy indicator. When the goal list failed to load, no badge SHALL show and the switch SHALL be disabled with the note "Goals unavailable". When no Active goal targets a unit the event allows, the switch SHALL be disabled with the hint "No active goals for this event's units". When there is no synced roster to preview over, the switch SHALL be disabled with the hint "Sync your roster to preview goals". After a goal is created, the previous badges and preview SHALL stay shown while the goal list refreshes. When clear estimates are unavailable (see `legendary-event-clear-estimates`), the preview SHALL still change ownership, rarity and rank, and no Clears figure SHALL show. The goals list is the only goal read the page makes; no per-goal read SHALL be issued for targets.

#### Scenario: Goals unavailable

- **GIVEN** the goal list read failed
- **WHEN** the event page renders
- **THEN** no goal badge renders, the Goals Preview switch is disabled and "Goals unavailable" is shown beside it

#### Scenario: No active goals for the event

- **GIVEN** the account's Active goals all target units the event does not allow
- **WHEN** the leaderboard renders
- **THEN** the Goals Preview switch is disabled with the hint "No active goals for this event's units"

#### Scenario: Targets come from the list

- **GIVEN** the goals list has loaded with five Active goals for the event's units
- **WHEN** the leaderboard renders badges and the preview
- **THEN** every badge tooltip and preview value is derived from the list and no further goal request is issued
