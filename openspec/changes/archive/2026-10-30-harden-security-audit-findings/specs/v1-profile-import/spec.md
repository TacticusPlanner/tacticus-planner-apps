## ADDED Requirements

### Requirement: Cap and truncation outcomes have translated copy

The import report SHALL bucket and translate the goal outcome codes `goal_limit_reached` (not imported), `project_limit_reached` (failed), `too_many_goals` (not imported) and `outcomes_truncated` (not imported). Legendary Event issue lines SHALL translate `lane_team_limit_reached`, naming the lane and the 50-team cap, and `issues_truncated`, naming how many issues were not listed.

#### Scenario: The account was at the project cap

- **WHEN** the goals' outcomes are `project_limit_reached`
- **THEN** they are listed as failed with the translated "archive one and import again" reason

### Requirement: The user-id part's refusals have translated copy

The Tacticus user id part SHALL translate `invalid_tacticus_user_id` and `tacticus_user_id_conflict` instead of showing the server message.

#### Scenario: The V1 user id is already claimed

- **WHEN** the user-id part fails with `tacticus_user_id_conflict`
- **THEN** its row shows the translated "already linked to another planner account" reason
