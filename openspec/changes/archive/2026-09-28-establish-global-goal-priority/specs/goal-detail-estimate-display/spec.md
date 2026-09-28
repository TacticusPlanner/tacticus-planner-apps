## MODIFIED Requirements

### Requirement: The goal-detail estimate states which model produced it

The Estimate section SHALL distinguish an isolated estimate for this goal alone from a plan-aware estimate computed in the account-wide Active-goal schedule with one shared energy budget and globally higher-priority work. The label SHALL reflect the actual computation, not the goal's membership or launch route. An isolated figure SHALL show the "Isolated estimate" badge; a global plan-aware figure SHALL explain global priority contention. Exactly one SHALL appear when a date is shown, and neither for a blocked or unavailable estimate.

#### Scenario: An estimate computed within a project reads as plan-aware

- **GIVEN** a goal detail opened from project detail showing that goal's projection from the global plan
- **WHEN** its Estimate section renders a date
- **THEN** it shows a global plan-aware caption, not an isolated badge or claim of a project-only budget

#### Scenario: An estimate computed for one goal reads as isolated

- **GIVEN** a goal detail opened from a plan-of-one surface, even if it belongs to a project
- **WHEN** its Estimate section renders a date
- **THEN** it shows the Isolated estimate badge and not the plan-aware caption

#### Scenario: Neither framing appears without a date

- **WHEN** the goal's estimate is Blocked or unavailable
- **THEN** neither framing label is shown
