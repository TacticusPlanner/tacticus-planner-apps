## RENAMED Requirements

- FROM: `### Requirement: Global Plan shows each in-flight goal once`
- TO: `### Requirement: Goals shows each in-flight goal once in priority order`

- FROM: `### Requirement: Global Plan has distinct data states`
- TO: `### Requirement: Goals has distinct data states`

- FROM: `### Requirement: Owner can reorder from the primary plan`
- TO: `### Requirement: Owner can reorder from Goals`

## MODIFIED Requirements

### Requirement: Goals shows each in-flight goal once in priority order

The Goals page (`/plan/goals`) SHALL list goals in canonical account-wide priority order, with Active and Paused goals leading in that order, including Character and Machine-of-War goals from every project, and SHALL offer no other sort order. A goal in multiple projects SHALL appear once. Paused goals SHALL remain visible with their state but SHALL not enter execution calculations. The view SHALL keep per-goal pause/resume and goal-detail actions available.

#### Scenario: Shared membership and mixed units

- **GIVEN** a Character goal in two projects and a Machine-of-War goal in one project
- **WHEN** Goals loads
- **THEN** each goal appears once in its stored order, with no unit grouping forced by the scheduler

#### Scenario: Paused goal

- **WHEN** a goal is Paused
- **THEN** it retains its visible order position but does not consume planning resources

### Requirement: Goals has distinct data states

The view SHALL distinguish initial loading, failed goal/order loading with retry, no in-flight goals, and a populated plan whose Active goals have no farmable demand. A missing project list SHALL not be mistaken for an empty global plan, because projects are not required to select execution scope.

#### Scenario: Account has no in-flight goals

- **WHEN** the goal request succeeds with no Active or Paused goals
- **THEN** the view shows an empty-goals state and a Create goal action

#### Scenario: Goal request fails

- **WHEN** the goal/order request fails
- **THEN** the view shows a load error and retry, not a no-goals state

#### Scenario: No farmable demand

- **WHEN** Active goals exist but all their needs are met or non-farmable
- **THEN** those goals remain visible and the plan reports no actionable farming rather than claiming there are no goals

### Requirement: Owner can reorder from Goals

At or above 768px, every Active or Paused goal row on the Goals page SHALL have an accessible drag handle that commits a completed move to the account-wide order. Below 768px, a dedicated reorder mode SHALL collapse cards to identity and target and provide touch-sized drag handles; entering it SHALL bring the reorder list into the visible viewport, and a Done/exit affordance SHALL remain reachable while interacting with lower rows. Each completed move SHALL commit without a separate Save; Done SHALL only exit the mode and SHALL not be necessary to persist a drop. Filtering or grouping SHALL not silently change priority: a drop is interpreted against the visible list (see the filtered-list scenarios) and hidden goals keep their relative order. A move SHALL preserve a goal's status, membership, target, and dependency, even if a dependent precedes its prerequisite.

#### Scenario: Desktop cross-project move

- **WHEN** a desktop user drags a goal from project B ahead of a goal in project A
- **THEN** the global order is saved and reflected across project projections

#### Scenario: Mobile reorder mode

- **WHEN** a mobile user enters reorder mode and moves a collapsed card
- **THEN** the move saves immediately and exiting mode restores full cards

#### Scenario: Entering mobile reorder brings work into view

- **WHEN** a mobile user activates Reorder while the goal list is below the viewport
- **THEN** the reorder list is scrolled into view and a useful list or mode target receives focus
- **AND** reduced-motion settings are respected

#### Scenario: Finishing after moving a lower card

- **WHEN** a mobile user completes a drag near the bottom of a long reorder list
- **THEN** the move is committed without pressing Done, its pending/error state is perceivable near the list, and Done remains reachable without scrolling back to the original header

#### Scenario: Project-level reorder appears in the plan

- **GIVEN** global order A, B, C, D, E and a project showing A, C, E
- **WHEN** the user drags E above C on that project's page
- **THEN** Goals shows A, B, E, C, D and every execution consumer uses that order

#### Scenario: Filtered plan

- **GIVEN** global order A, B, C, D, E and a status, Type, or project filter that shows only A, C, and E
- **WHEN** the user drags E above C
- **THEN** the saved global order is A, B, E, C, D — E takes C's position, goals between them shift one place toward E's vacated slot, and the hidden goals keep their relative order

#### Scenario: Grouped list

- **GIVEN** Group is set to a dimension and a goal's group shows it after a neighbour
- **WHEN** the user drags it above that neighbour within the same group
- **THEN** it takes the neighbour's global position exactly as in the filtered case; dropping across a group boundary is not offered

#### Scenario: Goals without a handle

- **WHEN** the list shows Completed, Reached-but-not-in-flight, or Archived goals
- **THEN** those rows have no drag handle and cannot be moved

## REMOVED Requirements

### Requirement: One global active sequence drives execution

**Reason**: The 'Current plan changes' scenario no longer applies; the sequence rule is unchanged.

**Migration**: See the replacement requirement in this delta.

## ADDED Requirements

### Requirement: One global active sequence drives all execution surfaces

Today, Raids Plan, Insights, and priority-sensitive goal/project estimates SHALL take the same Active-goal sequence filtered from canonical global order and SHALL allocate shared inventory, daily energy, and battle attempt caps once across that sequence. A project filter SHALL narrow presentation or summarize matching goal results from that global run; it SHALL NOT re-run an alternate project-only execution plan. All comparable schedule dates SHALL use that same reference date and calendar-day unit.

Assumptions:

- `planningSettings.dailyEnergy` is one account-wide daily energy budget; a battle's daily attempt cap is shared across all Active goals.
- Paused, Completed, and Archived goals do not consume resources or energy.
- Energy-free selected shop and Onslaught supply retains the source rules in `goal-farming-estimates`.

#### Scenario: Mixed Character and Machine-of-War demand

- **GIVEN** a Character Rank goal globally precedes a Machine-of-War Ability goal and both need the same farmable resource
- **WHEN** Today and Insights derive needs
- **THEN** the Character goal receives available owned inventory first and both surfaces report the same resulting per-goal need

#### Scenario: Project projection does not change schedule

- **WHEN** the user filters Insights to project B while Today shows the account-wide plan
- **THEN** Insights shows project B goals' outcomes from the global run, and Today's schedule and inventory allocations remain unchanged
