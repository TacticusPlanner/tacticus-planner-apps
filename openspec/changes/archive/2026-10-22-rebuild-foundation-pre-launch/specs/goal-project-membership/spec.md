# Spec Delta

## MODIFIED Requirements

### Requirement: In-flight goal-type uniqueness is scoped to a project

Across the account, at most one Active/Paused non-Rank goal SHALL exist per `(entityType, entityId, goalType)`. For Rank, at most one Active/Paused goal SHALL exist per `(entityType, entityId, normalizedEndTarget)`; different Rank targets MAY coexist. Completed/Archived goals SHALL not occupy a slot. Project membership SHALL NOT affect a slot: one in-flight goal MAY belong to any number of projects, and adding a goal to or removing it from a project SHALL never be rejected for a slot.

#### Scenario: Different projects have different targets

- **GIVEN** project A contains an Active Ragnar Rank Gold1 goal
- **WHEN** the user wants Ragnar Gold1 in project B
- **THEN** the existing goal is added to B; creating another in-flight Ragnar Rank Gold1 goal only in B is rejected and identifies the existing goal

#### Scenario: Same project rejects a second in-flight instance

- **GIVEN** an Active or Paused Ragnar Rank goal targeting Gold1 exists in any project
- **WHEN** another in-flight Ragnar Rank goal with the same normalized Gold1 target is created with any project selection
- **THEN** the operation is rejected and the existing goal is identified

#### Scenario: Historical instance does not conflict

- **GIVEN** the account has only Completed/Archived Ragnar Rank Gold1 goals
- **WHEN** a new Ragnar Rank Gold1 goal is created
- **THEN** creation succeeds

#### Scenario: Shared canonical goal occupies every selected project

- **GIVEN** one Active Ragnar Rank Gold1 goal belongs to A and B
- **WHEN** it is added to project C or removed from A
- **THEN** the change is accepted without any slot check (subject only to the last-membership rule)

#### Scenario: Distinct Rank target in one project

- **GIVEN** an Active Ragnar Silver3 goal
- **WHEN** a Ragnar Gold1 goal is created, in the same project or another
- **THEN** both are accepted

### Requirement: Project conflicts are resolved in the membership context

Goal creation/editing SHALL evaluate target-specific Rank conflicts and goal-type non-Rank conflicts against the account's in-flight goals, read from the goals list the page already holds, rather than globally disabling a goal type for the unit or fetching per-project member lists. It SHALL identify the existing goal, and let the user use the existing goal (add it to the selected projects) instead of creating a duplicate.

#### Scenario: Only one selected project conflicts

- **GIVEN** an in-flight Ragnar Gold1 goal exists in project A only
- **WHEN** the user starts a new Ragnar Gold1 goal with projects A and B selected
- **THEN** the existing goal is identified as conflicting for the whole draft (not per project) and the user can add it to B instead of creating another

#### Scenario: No request is issued for the check

- **WHEN** the conflict check runs for a goal draft
- **THEN** no per-project member list is requested; the check uses the loaded goals list

### Requirement: The scoped Goals page's row menu hosts project removal

When the Goals page is scoped to a project, each goal row's "⋯" menu, on desktop and mobile alike, SHALL offer that project's removal action between Pause/Resume and Delete: "Remove from this project" when the goal belongs to another project as well, and "Move to project" when the scoped project is its only one (see "The goal row's project-removal action offers a chosen destination when relocation is needed"). The goal's memberships are known from the goals list itself; the item SHALL be disabled only while the account's projects are not loaded. Without a project scope the menu SHALL offer no project-removal item. While scoped, the row's delete confirmation SHALL name removal from the scoped project as the alternative.

#### Scenario: Scoped row menu offers removal

- **GIVEN** the Goals page is scoped to project A and a goal belongs to A and B
- **WHEN** its row menu is opened
- **THEN** it lists Edit, Pause, Remove from this project and Delete, in that order

#### Scenario: Removal happens without a picker

- **GIVEN** the Goals page is scoped to project A and a goal belongs to A and B
- **WHEN** the user picks Remove from this project
- **THEN** the goal leaves A, stays in B, leaves the scoped list, and a toast names the goal and A

#### Scenario: Last project asks for a destination

- **GIVEN** the Goals page is scoped to project A, a goal's only project is A, and project B exists
- **WHEN** the user picks Move to project and chooses B
- **THEN** the goal belongs to B and no longer to A, and a toast names the goal and B

#### Scenario: Partly loaded memberships keep removal disabled

- **GIVEN** the Goals page is scoped to project A, the goals have loaded and the project list is still loading
- **WHEN** a goal's row menu is opened
- **THEN** the project-removal item is disabled until the project list loads, and is then enabled at once; no member-list request is ever issued

#### Scenario: Unscoped menu has no removal

- **WHEN** a row menu is opened on the Goals page without a project scope
- **THEN** it offers no project-removal item

#### Scenario: Delete confirmation names the alternative while scoped

- **GIVEN** the Goals page is scoped to project A
- **WHEN** a row's delete confirmation opens
- **THEN** it says the deletion is account-wide and names removal from A as the alternative

## REMOVED Requirements

### Requirement: Relocation reports an occupied destination slot before removing

**Reason**: Slots are per account, not per project, so moving a goal between projects can never collide with a slot; there is nothing to pre-check or report.

**Migration**: The membership editor and the row's "Move to project" action relocate without a slot check. The only rejections a membership change can still produce are a stale membership and a last-membership removal, handled as before.
