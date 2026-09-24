## ADDED Requirements

### Requirement: Overview project area can create a project directly

Goals Overview SHALL offer a labeled Create project action in its project quick-nav area, without requiring navigation to the Projects dashboard. It SHALL open the existing blank project-creation form and remain available when the account has no projects or when project loading fails. Submitting a valid project SHALL add it to the project list without changing the current route, Goals membership filter, or Current plan. The Projects dashboard's New project action SHALL remain available.

#### Scenario: Desktop creation beside All projects

- **WHEN** Goals Overview is viewed at or above 768px with projects loaded
- **THEN** Create project is visible adjacent to the quick-nav's All projects destination
- **AND** activating it opens the blank project-creation form without navigating

#### Scenario: Mobile creation in the project area

- **WHEN** Goals Overview is viewed below 768px with projects loaded
- **THEN** a labeled, touch-sized Create project action is available in the mobile project-widget area
- **AND** activating it opens the same blank form

#### Scenario: No projects exist

- **WHEN** Goals Overview's project list loads successfully with no projects
- **THEN** Create project remains available at both breakpoints without first visiting the dashboard

#### Scenario: Projects are loading or fail to load

- **WHEN** Goals Overview's project list is loading or has failed
- **THEN** the existing loading or failure presentation remains distinct and Create project remains available; the failure is not shown as an empty list

#### Scenario: Creation preserves browsing state

- **GIVEN** a Goals membership filter or Current plan is selected
- **WHEN** a user creates a project from Overview
- **THEN** the new project becomes available in project navigation without changing the selected filter, Current plan, or route

#### Scenario: Creation fails

- **WHEN** saving the new project fails
- **THEN** the form remains open with the entered name, description, and color available for correction or retry
