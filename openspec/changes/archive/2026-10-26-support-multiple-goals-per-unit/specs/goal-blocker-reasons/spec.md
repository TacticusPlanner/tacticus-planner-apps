## MODIFIED Requirements

### Requirement: Every prerequisite reason offers a remedy

A prerequisite reason SHALL offer an action that opens goal creation
pre-filled for the goal that would satisfy it, for the same unit. When the plan
already contains that goal, the action SHALL instead open that existing goal
for review. The missing-Unlock reason SHALL pre-fill an Unlock goal. When the
plan contains an in-flight Ascension goal for the unit that ends below the
required progression, the missing-Ascension reason SHALL offer both actions:
create a covering Ascension goal (pre-filled with the required end) and review
the existing goal; the reason clears once a covering goal is in the plan.

#### Scenario: Missing Unlock offers to create an Unlock goal

- **GIVEN** a goal reporting a missing-Unlock-prerequisite reason
- **WHEN** the user invokes the reason's action
- **THEN** goal creation opens pre-filled for an Unlock goal on that unit

#### Scenario: Existing prerequisite offers review instead

- **GIVEN** a goal reporting that its prerequisite is not yet reached
- **WHEN** the user invokes the reason's action
- **THEN** the existing prerequisite goal is opened for review rather than a new goal being
  created

#### Scenario: Too-low Ascension goal offers a covering milestone

- **GIVEN** a Rank goal needing a Legendary progression and an in-flight Ascension goal for
  the unit ending at an Epic progression
- **WHEN** the user opens the missing-Ascension reason
- **THEN** it offers to create an Ascension goal pre-filled with the required Legendary end and
  to review the existing Epic goal
- **AND** after the new goal is created, the Rank goal no longer reports the reason
