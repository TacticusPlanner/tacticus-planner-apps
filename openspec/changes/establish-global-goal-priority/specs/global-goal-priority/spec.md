## Purpose

Presents one editable account-wide goal order and makes it the shared execution input for planning, while projects remain organizational filters.

## ADDED Requirements

### Requirement: Global Plan shows each in-flight goal once

`/goals/plan` SHALL show every Active and Paused goal in canonical account-wide priority order, including Character and Machine-of-War goals and goals outside Current plan. A goal in multiple projects SHALL appear once. Paused goals SHALL remain visible with their state but SHALL not enter execution calculations. The view SHALL keep per-goal pause/resume and goal-detail actions available.

#### Scenario: Shared membership and mixed units

- **GIVEN** a Character goal in two projects and a Machine-of-War goal in one project
- **WHEN** Global Plan loads
- **THEN** each goal appears once in its stored order, with no unit grouping forced by the scheduler

#### Scenario: Paused goal

- **WHEN** a goal is Paused
- **THEN** it retains its visible order position but does not consume planning resources

### Requirement: Global Plan has distinct data states

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

### Requirement: Owner can reorder from the primary plan

At or above 768px, every in-flight goal row SHALL have an accessible drag handle that commits a completed move to the account-wide order. Below 768px, a dedicated reorder mode SHALL collapse cards to identity and target and provide touch-sized drag handles; each completed move SHALL commit without a separate Save. Grouping or filtering SHALL not silently change priority. A move SHALL preserve a goal's status, membership, target, and dependency, even if a dependent precedes its prerequisite.

#### Scenario: Desktop cross-project move

- **WHEN** a desktop user drags a goal from project B ahead of a goal in project A
- **THEN** the global order is saved and reflected across project projections

#### Scenario: Mobile reorder mode

- **WHEN** a mobile user enters reorder mode and moves a collapsed card
- **THEN** the move saves immediately and exiting mode restores full cards

#### Scenario: Filtered plan

- **WHEN** a non-priority filter hides some goals
- **THEN** reordering is unavailable until the complete in-flight order is shown, so hidden positions are not ambiguous

### Requirement: Reorder conflicts are recoverable

The client SHALL submit the complete in-flight ID set with the loaded order revision. On a stale-set or stale-revision conflict it SHALL retain the user's attempted move, show that the list changed, refresh the canonical order, and require a reviewed retry; it SHALL not silently replay the move or show success.

#### Scenario: Goal created during drag

- **WHEN** a new goal is created after the plan loaded and before a drag commits
- **THEN** the move is rejected with refresh/review affordance and no false success state

### Requirement: One global active sequence drives execution

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

#### Scenario: Current plan changes

- **WHEN** the user marks another project Current plan
- **THEN** the global active sequence and all execution results remain unchanged
