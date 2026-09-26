## MODIFIED Requirements

### Requirement: A project row navigates to its detail route

Activating a project card outside its controls SHALL navigate to its detail route. Card controls SHALL NOT navigate.

#### Scenario: Card opens detail

- **WHEN** the user activates a project card outside its controls
- **THEN** `/plan/projects/{id}` opens

#### Scenario: Card action does not navigate

- **WHEN** the user invokes an overflow action
- **THEN** that action runs without also opening the card

#### Scenario: Clicking a row opens its detail route

- **WHEN** the user activates a project card outside its action controls
- **THEN** the app navigates to that project's `/plan/projects/{id}` route

#### Scenario: Clicking an action icon does not navigate

- **WHEN** the user activates an Edit, Archive, or Restore menu item
- **THEN** that action runs without navigating away from the dashboard

### Requirement: The detail route's project selector switches which project's detail route is shown

The project switcher SHALL be integrated into the detail header/navigation area. Changing it SHALL navigate to the selected project's route.

#### Scenario: Switcher changes only viewed project

- **GIVEN** project B is viewed
- **WHEN** the user switches to project C
- **THEN** project C's route opens

#### Scenario: Changing the selector navigates to a different project's detail route

- **GIVEN** the user is on project A's detail route
- **WHEN** the user changes the project switcher to project B
- **THEN** the app navigates to project B's detail route

#### Scenario: Acting on a different project's row does not navigate

- **GIVEN** the user is on project A's detail route
- **WHEN** the detail header renders
- **THEN** no other project row is available to act on without first switching routes

### Requirement: Project cards communicate planning value

Every project card SHALL show color, name, description when present, and available goal/unit summary information. Where summary data is available a card SHALL also show reached, blocked, and estimate/progress information; the richer dashboard metrics (reached, blocked, completion date) belong to the Default project card only, as they belonged to the Current plan project before it was removed, and are computed from the one global run. Identity and actions SHALL remain usable while each summary independently loads or fails.

#### Scenario: Summary loads progressively

- **GIVEN** project identity has loaded and summary calculation has not
- **WHEN** the card renders
- **THEN** identity/actions render with a summary skeleton

#### Scenario: One summary fails

- **WHEN** one project's summary fails
- **THEN** only that card shows unavailable/retry state

## REMOVED Requirements

### Requirement: Projects has a list route and a single-project detail route

**Reason**: Routes move to /plan/projects and Current plan, Make current, and Current plan scenarios no longer exist.

**Migration**: See the replacement requirement in this delta.

### Requirement: The list route shows every project without its goal table

**Reason**: Routes move to /plan/projects and Current plan, Make current, and Current plan scenarios no longer exist.

**Migration**: See the replacement requirement in this delta.

### Requirement: Project lifecycle actions render as inline icons on each row

**Reason**: Routes move to /plan/projects and Current plan, Make current, and Current plan scenarios no longer exist.

**Migration**: See the replacement requirement in this delta.

### Requirement: The detail route's current-project row matches the list route's row

**Reason**: Routes move to /plan/projects and Current plan, Make current, and Current plan scenarios no longer exist.

**Migration**: See the replacement requirement in this delta.

## ADDED Requirements

### Requirement: The Default project is permanent

Every account SHALL have exactly one Default project. It SHALL be renamable and editable like any project, SHALL NOT be archived or deleted (no control offers either), and SHALL be the fallback home of a goal whose last other membership is removed. It SHALL be listed first wherever projects are listed and SHALL carry a Default marker. No other project SHALL carry a special status: there is no Active or Current plan project.

#### Scenario: Default project cannot be archived

- **WHEN** the Default project's action menu renders
- **THEN** Archive is unavailable with explanatory text and no delete action exists

#### Scenario: Default project can be renamed

- **WHEN** the user edits the Default project's name
- **THEN** the new name is saved and it remains the Default project, listed first

#### Scenario: No project is special beyond Default

- **WHEN** any project surface renders
- **THEN** it shows no Active, Current plan, or Make current label or control for any project

#### Scenario: A goal's last membership is removed

- **WHEN** a goal's last non-Default membership is removed
- **THEN** the client has already added the Default project membership (the API itself rejects removing a goal's only remaining membership), so the goal remains a member of the Default project

### Requirement: Project detail links to Goals

The project detail route SHALL link to the Goals page (`/plan/goals`) with copy explaining that project order is a view of the account-wide priority order shown there. The link SHALL be reachable at both breakpoints, including while the mobile reorder mode is on.

#### Scenario: Link to Goals

- **WHEN** a user opens a project's detail route
- **THEN** a link to `/plan/goals` is visible and describes the shared order

### Requirement: Projects has list and detail routes under /plan/projects

The system SHALL present the project dashboard at `/plan/projects` and an owned project's grouped goal detail at `/plan/projects/{id}`.

#### Scenario: Dashboard and detail remain addressable

- **WHEN** the user opens either project route
- **THEN** the requested dashboard or project detail renders at its stable URL

#### Scenario: The list route shows every project

- **WHEN** the user navigates to `/plan/projects`
- **THEN** the project dashboard renders, with no single project's goal table shown

#### Scenario: The detail route shows one project

- **WHEN** the user navigates to `/plan/projects/{id}` for a project they own
- **THEN** that project's semantic header renders above its grouped goal content

### Requirement: The list route shows every project, Default first, without its goal table

The dashboard SHALL show the Default project first, other non-archived projects after it, and archived projects in a subdued section collapsed by default when non-archived projects exist. It SHALL explain a project as a named selection of account goals whose displayed order is a projection of global priority, and the Default project as the permanent home of goals that belong to no other project. The explanation SHALL be visible on arrival at both breakpoints. The dashboard SHALL NOT render a goal table.

#### Scenario: The Default project is immediately identifiable

- **WHEN** the dashboard renders
- **THEN** the Default project appears first with a visible Default label

#### Scenario: Archived projects do not compete for focus

- **GIVEN** available and archived projects exist
- **WHEN** the dashboard initially renders
- **THEN** archived projects are grouped in a collapsed section

#### Scenario: All projects are visible without extra navigation

- **WHEN** the user opens the list route
- **THEN** every owned project remains available, including archived projects in their expandable section, and no goal table is rendered

#### Scenario: The dashboard says what a project is

- **WHEN** the dashboard renders with at least one project
- **THEN** visible copy describes projects as organizational selections sharing the account's global priority

#### Scenario: The explanation is not hidden behind an interaction

- **WHEN** the dashboard renders at either breakpoint
- **THEN** the explanation is readable without hover, focus, or opening a control

### Requirement: Project lifecycle actions are Edit and Archive/Restore in an overflow menu

Project actions SHALL no longer render as an always-visible inline icon cluster. Edit and Archive/Restore SHALL appear in an accessible overflow menu. Archive SHALL be unavailable with explanatory text for the Default project, which is permanent (see "The Default project is permanent").

#### Scenario: Secondary actions are labeled

- **WHEN** a project action menu opens
- **THEN** applicable Edit and Archive or Restore actions appear with text labels

#### Scenario: Archiving a project

- **GIVEN** a custom (non-default) project
- **WHEN** the user activates Archive from its action menu
- **THEN** the project moves to the archived section and offers Restore

#### Scenario: Restoring an archived project

- **GIVEN** an archived project
- **WHEN** the user activates Restore from its action menu
- **THEN** the project returns to the available-project section

#### Scenario: Archive is unavailable for the Default project

- **GIVEN** the Default project
- **WHEN** its action menu renders
- **THEN** Archive is unavailable and explanatory text identifies the restriction

### Requirement: The detail route header replaces the list row

The detail route SHALL replace the reused list row with a semantic project header containing back navigation, identity, description, summary metrics, overflow management actions, and the project's browsing controls — a labeled project switcher, a labeled status filter, and a labeled Group control. Grouped goal content SHALL render below the header, not the browsing controls.

#### Scenario: Archiving from the detail route behaves like archiving from the list

- **GIVEN** the user is on an eligible project's detail route
- **WHEN** the user activates Archive from the header action menu
- **THEN** the project is archived with the same lifecycle result as archiving it from the dashboard

#### Scenario: Browsing controls render inside the header

- **GIVEN** the user opens a project's detail route
- **WHEN** the header renders
- **THEN** the project switcher, status filter, and Group control render together inside the header card, each with a visible label reading "Project", "Filter", and "Group By" respectively, and only the grouped goal content renders below the header
