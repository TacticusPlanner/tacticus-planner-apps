## MODIFIED Requirements

### Requirement: In-flight goal-type uniqueness is scoped to a project

Within one project, at most one Active/Paused non-Rank goal SHALL exist per `(entityType, entityId, goalType)`. For Rank, at most one Active/Paused goal SHALL exist per `(entityType, entityId, normalizedEndTarget)`; different Rank targets MAY coexist. Completed/Archived goals SHALL not occupy a slot. Different projects MAY contain different active instances.

#### Scenario: Different projects have different targets

- **GIVEN** project A contains an Active Ragnar Rank goal
- **WHEN** a different Ragnar Rank goal is created only in B
- **THEN** creation succeeds

#### Scenario: Same project rejects a second in-flight instance

- **GIVEN** A contains an Active or Paused Ragnar Rank goal targeting Gold1
- **WHEN** another in-flight Ragnar Rank goal with the same normalized Gold1 target is created in or added to A
- **THEN** the operation is rejected and identifies A and its existing goal

#### Scenario: Historical instance does not conflict

- **GIVEN** A contains only Completed/Archived Ragnar Rank Gold1 goals
- **WHEN** a new Ragnar Rank Gold1 goal is created in A
- **THEN** creation succeeds

#### Scenario: Shared canonical goal occupies every selected project

- **GIVEN** one Active Ragnar Rank Gold1 goal belongs to A and B
- **WHEN** another Ragnar Rank Gold1 goal is added to B
- **THEN** the operation is rejected for B

#### Scenario: Distinct Rank target in one project

- **GIVEN** A contains Ragnar Silver3
- **WHEN** Ragnar Gold1 is added to A
- **THEN** the membership is allowed

### Requirement: Project conflicts are resolved in the membership context

Goal creation/editing SHALL evaluate target-specific Rank conflicts and goal-type non-Rank conflicts against selected projects rather than globally disabling a goal type for the unit. It SHALL identify each conflicting project and the existing goal, and let the user remove that membership or use the existing goal.

#### Scenario: Only one selected project conflicts

- **GIVEN** Rank Gold1 is occupied in A but available in B
- **WHEN** both projects are selected for a new Ragnar Gold1 goal
- **THEN** A and its existing Gold1 goal are identified as conflicting while B is available

### Requirement: Relocation reports an occupied destination slot before removing

Relocating an Active/Paused goal SHALL check the destination's non-Rank goal-type or Rank normalized-target slot before removing its last membership. A conflict SHALL name the destination and existing goal/target and leave memberships unchanged. The destination remains the Default project in the membership editor or the user's chosen project for the row action.

#### Scenario: Occupied destination slot is explained

- **GIVEN** a goal's only membership is A and the destination has an Active goal with the same non-Rank type or exact Rank target
- **WHEN** moving it from A is attempted
- **THEN** the conflict names the destination and existing goal/target, and the goal stays in A

#### Scenario: Historical goal in the destination does not conflict

- **GIVEN** the destination has only Completed/Archived goals for that slot
- **WHEN** a goal's last membership is removed to it
- **THEN** relocation succeeds

#### Scenario: Conflict arising after the check is still reported

- **GIVEN** the destination slot becomes occupied between preview and save
- **WHEN** removal is submitted
- **THEN** the same conflict is shown and memberships remain unchanged

#### Scenario: A goal that occupies no slot relocates regardless of the destination

- **GIVEN** a Completed/Archived goal in A whose destination has an Active goal in the same slot
- **WHEN** removal from A is attempted
- **THEN** relocation succeeds because the moved goal occupies no in-flight slot
