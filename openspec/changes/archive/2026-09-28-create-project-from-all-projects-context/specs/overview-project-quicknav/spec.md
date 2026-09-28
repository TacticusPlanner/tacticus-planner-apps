## ADDED Requirements

### Requirement: The Goals project area can create a project directly

The Goals page's project quick-nav area SHALL offer a labeled Create project action, without requiring navigation to the Projects dashboard. It SHALL open the existing blank project-creation form and remain available in every quick-nav state (loading, failed, empty, and populated). Submitting a valid project SHALL add it to the project list without changing the current route or the Goals membership filter, and SHALL NOT select or otherwise mark the new project. The Projects dashboard's New project action SHALL remain available.

#### Scenario: Desktop creation beside All projects

- **WHEN** the Goals page is viewed at or above 768px with projects loaded
- **THEN** Create project is visible adjacent to the quick-nav's All projects destination
- **AND** activating it opens the blank project-creation form without navigating

#### Scenario: Mobile creation in the project area

- **WHEN** the Goals page is viewed below 768px with projects loaded
- **THEN** a labeled, touch-sized Create project action is available in the mobile project-widget area
- **AND** activating it opens the same blank form

#### Scenario: Creation preserves browsing state

- **GIVEN** a Goals membership filter is selected
- **WHEN** a user creates a project from the Goals page
- **THEN** the new project becomes available in project navigation without changing the selected filter or route

#### Scenario: Creation fails

- **WHEN** saving the new project fails
- **THEN** the form remains open with the entered name, description, and color available for correction or retry

## MODIFIED Requirements

### Requirement: No projects yet

Below 768px, the quick-nav SHALL show the same no-projects teaching copy `home-projects-widget` shows on the home page, since it is that same widget, with the card's own navigate action hidden and the Create project action as the single action. At or above 768px, the desktop chip row SHALL render no project chips and no "all projects" link when there are no projects, since a chip row with no projects in it has nothing to show, but the Create project action SHALL still be rendered.

#### Scenario: Mobile shows the same empty-state teaching as the home widget

- **WHEN** a user with no projects opens the Goals page below 768px
- **THEN** the widget shows the same explanatory copy `home-projects-widget` shows on the home page but without that card's own "go to Projects" action, and the shared Create project action is the only action offered

#### Scenario: Desktop renders nothing when there are no projects

- **WHEN** a user with no projects opens the Goals page at or above 768px
- **THEN** no project chips are rendered (an empty chip row is not shown), and only the Create project action is available

### Requirement: Loading and failure states

Below 768px, the quick-nav SHALL show the same distinct loading and failure states `home-projects-widget` shows on the home page, with the Create project action still available. At or above 768px, the desktop chip row SHALL show a loading skeleton while the project list is loading, and SHALL render no chips and no error message if it fails to load, since the row is a convenience shortcut and the Goals page's own goal list does not depend on it; the Create project action SHALL remain available in both states, and a failure SHALL NOT be presented as an empty list.

#### Scenario: Mobile shows the same loading and failure states as the home widget

- **WHEN** the project list is loading, or fails to load, on the Goals page below 768px
- **THEN** the widget shows the same loading or failure-with-retry state `home-projects-widget` shows on the home page, and the Create project action is available

#### Scenario: Desktop shows a skeleton while loading and hides on failure

- **WHEN** the project list is loading on the Goals page at or above 768px
- **THEN** the chip row shows a loading skeleton and the Create project action is available
- **AND** if the project list fails to load, the chip row does not render at all (no chips and no error message) and the Create project action remains available
