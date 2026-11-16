# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Add to project adds the selection to one chosen project`
- TO: `### Requirement: Add to project adds the selection to the chosen projects`

## MODIFIED Requirements

### Requirement: Add to project adds the selection to the chosen projects

Activating Add to project SHALL open a destination picker listing the account's non-archived projects (the Default project included) with their colour dots, where the user can check one or more projects and confirm with **Add**; when no non-archived project exists it SHALL instead open project creation and, once created, use the new project as the destination. For each chosen destination, in turn, the client SHALL add every selected goal to that project in one membership request, keeping each goal's existing memberships; a goal that is already a member SHALL be left as it is. Each request SHALL be computed from the destination's membership as the loaded project list carries it and sent with that membership as `expectedGoalIds`; when the server rejects it as `membershipStale` because the membership changed in the meantime, the change SHALL be re-applied once to the current membership that rejection carries and resubmitted, without a member-list read, rather than failing. Membership is never rejected for an occupied slot (slots are per account, see `goal-project-membership`). Membership changes SHALL NOT change any goal's status, target or priority. On success one toast SHALL name the destinations and the number of goals added; when some requests fail, the toast SHALL name the failed destinations with a Retry for them only, and the successful ones SHALL stay added.

#### Scenario: Three goals join a project

- **GIVEN** three goals are selected, one of which already belongs to project B
- **WHEN** the user checks project B in the picker and confirms
- **THEN** one membership request adds the two non-members to B, the member is left as is, every goal keeps its other memberships, and a toast reports 2 goals added to B

#### Scenario: Two goals join two projects

- **GIVEN** two goals are selected and neither belongs to Chaos Core or Team Lavi
- **WHEN** the user checks both projects and confirms
- **THEN** two membership requests are sent, one per project, and a toast reports "Added 2 goals to Chaos Core and Team Lavi"

#### Scenario: One destination fails

- **GIVEN** the user checked Chaos Core and Team Lavi
- **WHEN** the Team Lavi request fails with a server error
- **THEN** the goals stay added to Chaos Core and the toast reads "Added to Chaos Core. Team Lavi failed." with Retry for Team Lavi only

#### Scenario: A goal added elsewhere in the meantime is kept

- **GIVEN** two goals are selected and the user opens the picker
- **WHEN** another goal joins project B from another tab before the user chooses B
- **THEN** the first request is rejected as `membershipStale`, one retry built from the membership the rejection carries adds the selection to B, and the goal added from the other tab stays in B

#### Scenario: No member-list read precedes the request

- **GIVEN** the projects and goals have loaded
- **WHEN** the user chooses a destination
- **THEN** the membership request is issued without first reading that project's member list

#### Scenario: An occupied slot does not block the add

- **GIVEN** three goals are selected and one of them has the same unit and kind as a goal already in project B
- **WHEN** the user chooses project B
- **THEN** all three goals are added to B — membership is not slot-checked — and the toast reports 3 goals added

#### Scenario: No project exists yet

- **GIVEN** the account has no non-archived project
- **WHEN** the user activates Add to project
- **THEN** project creation opens instead of a picker, and the created project receives the selection
