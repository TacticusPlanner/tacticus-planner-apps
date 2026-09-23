## MODIFIED Requirements

### Requirement: The detail route assembles membership in bulk

The detail route SHALL provide a project-context action that edits memberships for multiple existing goals without visiting each goal individually. The surface SHALL list the profile's goals with search and useful grouping/sorting by unit, goal type, or current priority. It SHALL distinguish current membership from pending additions and removals and SHALL show a review summary before one explicit save. The save SHALL apply the complete reviewed set atomically. A stale-set, occupied-slot, or last-membership rejection SHALL identify the problem, preserve the draft, and allow the user to refresh/reconcile before retrying. Membership changes SHALL NOT change goal status, target, or canonical global priority.

#### Scenario: Several goals join a project in one save

- **GIVEN** the user is on a project's detail route
- **WHEN** they select three nonmember goals and save
- **THEN** all three belong to the project and every unchanged membership remains

#### Scenario: Existing membership is visible while assembling

- **GIVEN** the project already contains some listed goals
- **WHEN** the surface renders
- **THEN** current membership and any pending add/remove state are visibly distinguishable

#### Scenario: Search narrows the assembly list

- **WHEN** the user searches by unit or goal type or changes a grouping/sort control
- **THEN** matching goals are shown without clearing pending selections hidden by the filter

#### Scenario: Concurrent membership changes are not discarded

- **GIVEN** the project's membership changed elsewhere after the surface was opened
- **WHEN** the user submits the reviewed set
- **THEN** no replacement occurs; the user sees a stale-set conflict and can compare refreshed current membership with their preserved draft before retrying

#### Scenario: Assembly does not remove members

- **WHEN** the user leaves existing members selected and saves additions
- **THEN** those existing members remain; only members explicitly marked for removal are removed

#### Scenario: Added goals do not reorder existing units

- **GIVEN** goals have an established canonical account-wide order
- **WHEN** the user adds or removes project memberships and saves
- **THEN** the canonical order and relative position of every goal remain unchanged

#### Scenario: Several removals and additions in one save

- **WHEN** the user marks two current members for removal, three goals for addition, reviews the summary, and saves
- **THEN** all five membership changes commit together or none commits if any validation fails

#### Scenario: Removing the only membership is blocked

- **WHEN** a pending removal would leave a goal in no project
- **THEN** the save is rejected without applying other changes and the affected goal is identified with guidance to assign another project first

#### Scenario: Pending selection survives navigation within the list

- **WHEN** the user filters, groups, or scrolls the list after making selections
- **THEN** the review summary and eventual saved set retain those selections
