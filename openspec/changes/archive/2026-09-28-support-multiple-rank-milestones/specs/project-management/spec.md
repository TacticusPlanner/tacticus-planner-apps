## MODIFIED Requirements

### Requirement: Assembly blocks a selection whose goal-type slot is occupied

A project permits distinct Active/Paused Rank end targets but at most one in-flight goal per non-Rank unit/type slot or exact Rank unit/normalized-target slot. A save that would violate a slot SHALL be rejected in full. The assembly surface SHALL identify a listed goal whose exact slot is already held, prevent it from being selected, and state the reason. It SHALL permit a different Rank target for the same unit.

#### Scenario: Conflicting goal cannot be selected

- **GIVEN** the project contains an Active Bellator Silver3 Rank goal
- **WHEN** assembly lists another active Bellator Silver3 goal
- **THEN** that exact-target goal cannot be selected, with the existing milestone named

#### Scenario: A conflict arising after the check rejects the whole save

- **GIVEN** several goals are selected and one exact slot becomes occupied after preview
- **WHEN** the user saves
- **THEN** nothing is added, the conflict is explained, and the selection stays available to correct

#### Scenario: Historical goal in the project does not block selection

- **GIVEN** the project has only Completed/Archived Bellator Silver3 goals
- **WHEN** assembly lists an active Bellator Silver3 goal
- **THEN** it can be selected and saved

#### Scenario: Different target is selectable

- **GIVEN** the project contains Bellator Silver3
- **WHEN** assembly lists Bellator Gold1
- **THEN** Gold1 can be selected and saved
