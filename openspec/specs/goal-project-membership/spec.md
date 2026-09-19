# goal-project-membership Specification

## Purpose

Defines how canonical Character/MoW goals participate in one or more projects, including searchable membership and project-scoped in-flight goal-type uniqueness.

## Requirements

### Requirement: A goal can belong to multiple projects

One canonical goal MAY belong to one or more projects. Edits to that goal SHALL appear everywhere it is a member; membership SHALL not duplicate it.

#### Scenario: Shared goal appears in two projects

- **WHEN** project B is added to a goal already in project A
- **THEN** the same goal identity appears in both projects

#### Scenario: Removing one membership does not delete the goal

- **GIVEN** a goal belongs to A and B
- **WHEN** A is removed
- **THEN** the goal remains in B

### Requirement: Selected memberships render as project chips

Creation and editing SHALL show selected memberships as removable chips containing project color/name and distinct Current plan, Default, and Archived markers where applicable.

#### Scenario: Memberships are visible without opening picker

- **GIVEN** several projects are selected
- **WHEN** the field renders
- **THEN** every selection is visible as a chip

### Requirement: Projects are added through a searchable picker

An Add to project picker SHALL search non-archived projects by name and exclude already-selected projects. Choosing a result SHALL not submit or close the surrounding goal form.

#### Scenario: Search narrows projects

- **WHEN** the user enters part of a project name
- **THEN** matching available projects are shown

#### Scenario: Archived project cannot be newly selected

- **WHEN** an unselected archived project is searched
- **THEN** it is not offered

### Requirement: Every goal retains at least one project membership

At least one project SHALL remain selected. Removing a goal's last remaining membership SHALL relocate the goal to the Default project rather than being refused, and the surface performing the removal SHALL name the Default project as the destination by its current name. When the Default project is itself the goal's only membership, removal has no destination: the membership SHALL remain selected and the surface SHALL explain why. New goals without explicit context SHALL initially select Default project when it exists. If no project exists yet, creation SHALL omit explicit membership so the API creates the Default project on first use; the returned goal SHALL belong to that project.

#### Scenario: Last membership relocates to the Default project

- **GIVEN** a goal whose only membership is a project other than Default
- **WHEN** that membership is removed
- **THEN** the goal belongs to the Default project and the destination is named by its current name

#### Scenario: Last membership is protected

- **GIVEN** a goal whose only membership is the Default project
- **WHEN** removal is attempted
- **THEN** it remains selected with an inline explanation

#### Scenario: Renamed Default project is named as the destination

- **GIVEN** the Default project has been renamed
- **WHEN** a goal's last non-Default membership is removed
- **THEN** the destination is identified by the project's current name rather than a fixed label

#### Scenario: First goal creates the Default project

- **GIVEN** the user has no projects
- **WHEN** a valid goal is created without explicit membership
- **THEN** the API creates the Default project and the goal belongs to it

### Requirement: Archived memberships remain visible and relocatable

An existing archived membership SHALL remain visible and marked Archived, but archived projects SHALL not be addable. Removing an archived membership SHALL follow the same last-membership behavior as any other membership: when it is the goal's only membership, the goal SHALL relocate to the Default project, which can never itself be archived.

#### Scenario: Archived membership remains visible

- **WHEN** a goal's project is later archived
- **THEN** its marked membership chip remains visible during editing

#### Scenario: Archived project cannot be newly added

- **WHEN** an unselected archived project is searched in the add picker
- **THEN** it is not offered

#### Scenario: Final archived membership relocates to Default

- **GIVEN** an archived project is the goal's only membership
- **WHEN** that membership is removed
- **THEN** the goal belongs to the Default project and is no longer reachable only through an archived project

### Requirement: In-flight goal-type uniqueness is scoped to a project

Within one project, at most one Active/Paused goal SHALL exist for a given `(entityType, entityId, goalType)`. Completed/Archived goals SHALL not occupy the slot. Different projects MAY contain different Active/Paused instances for the same unit and type.

#### Scenario: Different projects have different targets

- **GIVEN** project A contains an Active Ragnar Rank goal
- **WHEN** a different Ragnar Rank goal is created only in project B
- **THEN** creation succeeds

#### Scenario: Same project rejects a second in-flight instance

- **GIVEN** project A contains an Active or Paused Ragnar Rank goal
- **WHEN** another Active/Paused Ragnar Rank goal is created in or added to A
- **THEN** the operation is rejected and identifies project A as conflicting

#### Scenario: Historical instance does not conflict

- **GIVEN** project A contains only a Completed or Archived Ragnar Rank goal
- **WHEN** a new Ragnar Rank goal is created in A
- **THEN** creation succeeds

#### Scenario: Shared canonical goal occupies every selected project

- **GIVEN** one Active Ragnar Rank goal belongs to A and B
- **WHEN** another Ragnar Rank goal is added to B
- **THEN** the operation is rejected for B

### Requirement: Project conflicts are resolved in the membership context

Goal creation/editing SHALL evaluate conflict state against selected projects rather than globally disabling a goal type for the unit. It SHALL identify each conflicting project and let the user remove that membership or use the existing goal.

#### Scenario: Only one selected project conflicts

- **GIVEN** Rank is occupied in A but available in B
- **WHEN** both projects are selected for a new Ragnar Rank goal
- **THEN** A is identified as conflicting while B is identified as available

### Requirement: Independent equipment goals are unsupported

Goal creation, filters, details, and client contract types SHALL support Character and MoW entities only. They SHALL not offer Item entities or the UpgradeItem goal type. Character/MoW Upgrade goals SHALL remain supported and their material targets SHALL use upgrade-material terminology.

#### Scenario: Goal type chooser omits equipment

- **WHEN** the user creates a goal
- **THEN** no independent equipment target or Upgrade Equipment goal type is offered

#### Scenario: Unit Upgrade remains available

- **WHEN** a valid Character or MoW is selected
- **THEN** its ordinary Upgrade goal type remains available

### Requirement: Membership editing adapts to desktop and mobile

At or above 768px, search SHALL use a compact anchored picker. Below 768px, it SHALL use a touch-friendly full-width popover or Sheet while selected chips remain visible.

#### Scenario: Mobile membership editing

- **WHEN** membership is edited below 768px
- **THEN** search and selection remain touch-friendly without obscuring selected chips

### Requirement: Membership is removable from the project context

Wherever a goal is presented as a member of a specific project, the system SHALL offer removing that goal from that project as an action distinct from deleting the goal. This action SHALL NOT require opening the goal's edit form. Removal SHALL affect only the named project's membership and SHALL leave the goal's other memberships, status, progress, and target unchanged.

#### Scenario: Removal is available without opening the edit form

- **WHEN** a goal is shown in the context of a project it belongs to
- **THEN** an action removing it from that project is available directly from that context

#### Scenario: Other memberships are unaffected

- **GIVEN** a goal belongs to projects A and B
- **WHEN** it is removed from A in A's context
- **THEN** it remains a member of B with its status, progress, and target unchanged

#### Scenario: Removal is absent without project scope

- **WHEN** a goal is shown outside any single project's context
- **THEN** no project-removal action is offered for it

### Requirement: Relocation reports an occupied destination slot before removing

Because a project holds at most one Active/Paused goal per `(entityType, entityId, goalType)`, relocating an Active or Paused goal to the Default project can conflict with a goal already there. The system SHALL detect that conflict and explain it, identifying the Default project and the conflicting goal type, rather than reporting a generic failure. The goal's memberships SHALL remain unchanged when relocation is refused.

#### Scenario: Occupied destination slot is explained

- **GIVEN** a goal's only membership is project A, and the Default project already contains an Active goal for the same unit and goal type
- **WHEN** removal from A is attempted
- **THEN** the conflict is explained, naming the Default project and the goal type, and the goal remains a member of A

#### Scenario: Historical goal in the destination does not conflict

- **GIVEN** the Default project contains only a Completed or Archived goal for the same unit and goal type
- **WHEN** a goal's last membership is removed
- **THEN** relocation succeeds

#### Scenario: Conflict arising after the check is still reported

- **GIVEN** the destination slot becomes occupied between the check and the removal
- **WHEN** the removal is submitted
- **THEN** the same conflict explanation is shown and the goal's memberships remain unchanged

#### Scenario: A goal that occupies no slot relocates regardless of the destination

- **GIVEN** a Completed or Archived goal whose only membership is project A, and the Default project holds an Active goal for the same unit and goal type
- **WHEN** removal from A is attempted
- **THEN** relocation succeeds, because a goal in that status occupies no goal-type slot

### Requirement: Membership removal submits the goal's current memberships

Replacing a goal's project memberships replaces the whole list, so a removal SHALL be computed from the goal's memberships as they stand at the moment of submission rather than from a previously loaded copy. A membership added elsewhere after the surface was loaded SHALL survive an unrelated removal.

#### Scenario: Concurrently added membership survives a removal

- **GIVEN** a goal belongs to projects A and B, and gains project C elsewhere after the current view loaded
- **WHEN** the user removes it from A
- **THEN** it still belongs to B and C

### Requirement: Removal is unavailable while the destination cannot be determined

Relocation depends on knowing the Default project. While that is unknown — the project list is loading, failed to load, or the user is unauthenticated — the removal action SHALL be unavailable rather than submitted, and SHALL NOT submit an incomplete membership list.

#### Scenario: Removal waits for the project list

- **GIVEN** the project list has not loaded
- **WHEN** a goal's action menu is opened in a project context
- **THEN** the removal action is not actionable and no request is sent

### Requirement: Account-wide deletion is distinguishable from project removal

A control that deletes a goal from the account SHALL state that its effect is account-wide and not limited to the project being viewed, and SHALL name project removal as the alternative when the goal is being viewed in a project's context. Project removal SHALL NOT present itself as destructive, and SHALL NOT require the same confirmation as deletion.

#### Scenario: Delete confirmation states its scope

- **GIVEN** a goal is viewed within a project
- **WHEN** its delete confirmation is shown
- **THEN** the confirmation states that deletion removes the goal from the account rather than from the project, and identifies project removal as the alternative

#### Scenario: Removal and deletion are visually distinct

- **WHEN** both actions are offered for the same goal
- **THEN** deletion is presented as destructive and confirmed, while removal is presented as an ordinary action

### Requirement: Goals can be filtered by project membership

The Goals Overview SHALL offer filtering the goal list by project membership, including an option that applies no membership filter. The filter SHALL narrow only the displayed list. It SHALL NOT change any goal's status, membership, or priority, and SHALL NOT change which project any calculating view uses.

#### Scenario: Filtering narrows the list to one project's goals

- **GIVEN** goals belonging to several projects
- **WHEN** the user filters Overview by one project
- **THEN** only goals belonging to that project are listed

#### Scenario: Unfiltered is available and is the initial state

- **WHEN** Overview is first opened
- **THEN** no membership filter is applied and every goal remains eligible for display

#### Scenario: Filtering applies on every status tab

- **GIVEN** a project contains goals in Archived status as well as in-flight ones
- **WHEN** the user filters Overview by that project and selects the Archived status filter
- **THEN** that project's archived goals are listed rather than an empty list

#### Scenario: Filtering does not affect planning

- **GIVEN** a project is selected in the Overview membership filter
- **WHEN** the user opens a project-aware Dailies or Insights view
- **THEN** that view's project selection is unchanged by the Overview filter

### Requirement: Project membership does not change a goal's activation

A project organizes goals; it does not activate or deactivate them. Adding a goal to a project, removing it from one, relocating it to the Default project, and making a different project the Current plan SHALL all leave the goal's status unchanged. Pausing and resuming a goal SHALL remain available per goal and SHALL remain the only way a user changes whether a goal is active. No membership surface SHALL present membership as activating, deactivating, pausing, or resuming a goal.

#### Scenario: Editing membership leaves status alone

- **GIVEN** a Paused goal belonging to project A
- **WHEN** the user adds it to project B, or removes it from A, from any membership surface
- **THEN** the goal is still Paused afterwards

#### Scenario: Changing Current plan leaves statuses alone

- **GIVEN** project B contains Active and Paused goals and project A is Current plan
- **WHEN** the user makes project B the Current plan
- **THEN** every goal in project B keeps the status it had

#### Scenario: Membership editing states what it does and does not do

- **WHEN** a goal's project memberships are shown for editing
- **THEN** visible copy states that membership changes only which projects contain the goal, and that pausing or resuming the goal is a separate per-goal action

#### Scenario: No membership control offers activation

- **WHEN** any surface that adds or removes project membership renders
- **THEN** it offers no control described as activating, deactivating, pausing, or resuming the goal as a consequence of membership

### Requirement: A newly created goal's status does not depend on which projects it is filed into

Creating a goal SHALL produce a goal with the same status whichever projects are selected for it, including when none of them is the Current plan and when the goal is filed into the Default project by default. The creation surface SHALL NOT state or imply that the chosen projects determine whether the new goal starts active.

#### Scenario: Creating into a non-current project

- **GIVEN** project A is Current plan
- **WHEN** the user creates a goal whose only selected project is project B
- **THEN** the created goal has the same status it would have had if project A had been selected

#### Scenario: The membership field makes no promise about status

- **WHEN** the goal creation form renders its project membership field
- **THEN** its copy describes only which projects will contain the goal
