## ADDED Requirements

### Requirement: A lane holds at most 50 teams

When a lane already holds 50 teams, Add team SHALL be disabled with a translated note beside it. Every path that creates a team (Add team, an accepted suggestion, adding a unit from the leaderboard) SHALL check the plan's confirmed teams for that lane and SHALL NOT send the request at the cap; it shows a translated toast instead. A `legendaryEventTeamLimitReached` from the API SHALL show the same toast. The plan stays as it was.

#### Scenario: The lane is full

- **WHEN** the Alpha lane holds 50 teams
- **THEN** Add team is disabled and the note says the lane holds the maximum of 50 teams
- **AND** saving a team from a suggestion sends nothing and toasts the cap
