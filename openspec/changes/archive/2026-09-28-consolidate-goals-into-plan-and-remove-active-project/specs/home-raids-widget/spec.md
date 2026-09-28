## REMOVED Requirements

### Requirement: The widget scopes to the Active project, matching Today's own default

**Reason**: The widget is account-wide like Today; there is no Active project.

**Migration**: See the replacement requirement in this delta.

### Requirement: Empty and unavailable states

**Reason**: The widget is account-wide like Today; there is no Active project.

**Migration**: See the replacement requirement in this delta.

## ADDED Requirements

### Requirement: The widget scopes to all Active goals, matching Today

The widget SHALL compute its schedule from the same account-wide scope Today uses: every `Active`-status goal in the account, each once in canonical global priority order, regardless of project membership. It SHALL NOT select, default to, or depend on a project.

#### Scenario: Uses every project's Active goals

- **GIVEN** Active goals in several projects
- **WHEN** the widget loads
- **THEN** it shows the schedule for all of them, the same schedule Today shows

#### Scenario: Only Active-status goals contribute

- **GIVEN** the account has a mix of Active, Paused, Completed, and Archived goals
- **WHEN** the widget computes its schedule
- **THEN** only the Active goals' needs are reflected, matching Today's own goal-status scope

### Requirement: Empty and unavailable states are account-wide

When the account's Active goals have no farmable need for today, the widget SHALL show an explicit "nothing to raid today" message rather than an empty grid. When the player has no Active goals, it SHALL show guidance to create or resume a goal. The widget SHALL defer rendering until the real synced-attempts data it depends on has loaded, consistent with Today's own readiness gating.

#### Scenario: No farmable need today

- **GIVEN** the account's Active goals have no unmet farmable need
- **WHEN** the widget loads
- **THEN** it shows an explicit empty message, not a blank grid

#### Scenario: No Active goals exist

- **GIVEN** the player has no Active goals
- **WHEN** the widget loads
- **THEN** it shows guidance to create or resume a goal, not a project prompt

#### Scenario: Required data has not loaded yet

- **GIVEN** the player's real synced attempt data has not yet loaded
- **WHEN** the widget would otherwise render
- **THEN** it defers rendering until that data is available
