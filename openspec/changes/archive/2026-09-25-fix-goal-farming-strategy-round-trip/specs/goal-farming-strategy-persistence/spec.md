## Purpose

Ensures a valid goal farming strategy selected by the user is persisted, shown again on edit, and used consistently by planning views.

## ADDED Requirements

### Requirement: Edited strategy round-trips

For a goal type that supports farming strategies, a valid changed strategy SHALL be saved and returned on subsequent reads. Reopening the goal or refreshing the app SHALL show the saved value, not an older default. A failed save SHALL be visible and SHALL NOT be represented as success.

#### Scenario: Save and reopen

- **WHEN** a user changes a supported goal from one strategy to another and the save succeeds
- **THEN** reopening the goal and refreshing the app show the new strategy

#### Scenario: Save fails

- **WHEN** the strategy update request fails
- **THEN** the edit surface reports the failure and does not silently discard the draft or claim the new strategy was saved

### Requirement: Planner consumes persisted strategy

Raids Plan, Dailies Today, and goal/plan estimates SHALL use the persisted strategy for the goal, subject to the existing strategy definitions and eligible goal types.

#### Scenario: Recalculation after strategy change

- **WHEN** a supported goal's changed strategy has been saved and planning data is refreshed
- **THEN** strategy-dependent farming order and estimates are calculated using that saved value
