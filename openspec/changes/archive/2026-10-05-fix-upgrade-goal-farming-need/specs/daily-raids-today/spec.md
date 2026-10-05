## ADDED Requirements

### Requirement: Today includes Upgrade goals

Today's schedule and Bonus Raids SHALL include farming for Active Upgrade goals in the selected
project scope, ordered by global priority like any other goal. Each entry SHALL identify the goal
it farms for (see "Schedule entries show which goal they farm for"), and the goal's target label
SHALL describe the upgrade quantity.

#### Scenario: Upgrade goal is scheduled

- **GIVEN** an Active Upgrade goal for `upgArmC002` × 5 with 0 owned, in the selected project
- **WHEN** Today is shown
- **THEN** a farming entry for `upgArmC002` appears, attributed to that goal

#### Scenario: Fully stocked goal is absent

- **GIVEN** the player already owns 5 `upgArmC002`
- **WHEN** Today is shown
- **THEN** no entry for that goal appears
