## ADDED Requirements

### Requirement: Membership picker can explicitly create and select a project

In both new-goal and goal-edit forms, when a user searches for a project name with no existing match, the membership picker SHALL offer an explicit Create action using that name. Creation SHALL respect existing project naming validation. On success the returned project SHALL immediately become selected membership without submitting or closing the goal form. Merely typing or leaving the search field SHALL NOT create a project.

#### Scenario: Create from new goal

- **WHEN** a user enters a valid unmatched name and chooses Create in the new-goal project picker
- **THEN** one project is created and selected while the rest of the goal draft remains intact

#### Scenario: Create from goal edit

- **WHEN** a user chooses Create in the goal-edit membership picker
- **THEN** the returned project is selected without saving the goal edit until the user explicitly submits it

#### Scenario: Existing or invalid name

- **WHEN** the searched name matches an existing project or violates project naming rules
- **THEN** the picker does not offer a create action that would produce a duplicate or invalid project

#### Scenario: Creation fails

- **WHEN** the project creation request fails
- **THEN** the picker shows an error, retains the typed name and unsaved goal draft, and does not add a phantom membership

#### Scenario: Search text alone has no side effect

- **WHEN** a user types an unmatched name then closes the picker without choosing Create
- **THEN** no project is created and the goal's membership remains unchanged
