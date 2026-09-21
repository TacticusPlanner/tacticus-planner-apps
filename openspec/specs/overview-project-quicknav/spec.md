# overview-project-quicknav Specification

## Purpose

Gives Goals Overview its own glanceable, one-click way to jump into a specific project's detail route, so a user doesn't need to visit the Projects dashboard first just to switch which project they're looking at.

## Requirements

### Requirement: Overview renders a project quick-nav above its control row

Goals Overview SHALL render a project quick-nav above its existing control row (the status filter, Type/Sort/Group, project-membership filter, and Planning Settings row defined by `goals-navigation`). At or above the 768px breakpoint it SHALL render as a single horizontally-scrollable row of project chips; below 768px it SHALL render the same widget `home-projects-widget` defines for the home page.

#### Scenario: Desktop shows a chip row above the controls

- **WHEN** Goals Overview renders at or above the 768px breakpoint
- **THEN** a single row of project chips appears above the status filter and other controls

#### Scenario: Mobile shows the same widget as the home page

- **WHEN** Goals Overview renders below the 768px breakpoint
- **THEN** the project quick-nav renders with the same content, capping, and "+N more" behavior as the home page's Your Projects widget (`home-projects-widget`)

### Requirement: The quick-nav lists projects, Current plan first, archived excluded

The quick-nav SHALL show Current plan first when one exists, followed by other non-archived projects in the same order the Projects dashboard uses. Archived projects SHALL NOT appear. At or above 768px every non-archived project SHALL be shown, scrolling horizontally rather than being capped; below 768px it follows `home-projects-widget`'s 3-item cap and "+N more" link.

#### Scenario: Desktop lists every non-archived project

- **GIVEN** the player has 6 non-archived projects, one of which is Current plan
- **WHEN** the quick-nav renders at or above 768px
- **THEN** all 6 appear as chips, Current plan first, scrollable rather than truncated

#### Scenario: Archived projects are excluded

- **GIVEN** the player has archived projects
- **WHEN** the quick-nav renders, on either platform
- **THEN** none of the archived projects appear in it

### Requirement: Desktop's chip row links to the full Projects dashboard

The desktop chip row SHALL include a trailing link to `/goals/projects`, so a user can still reach project lifecycle actions (Make current, Edit, Archive/Restore) and archived projects, none of which the quick-nav itself offers.

#### Scenario: A trailing link opens the Projects dashboard

- **WHEN** the desktop chip row renders
- **THEN** a link at its end navigates to `/goals/projects` when activated

### Requirement: Activating an entry navigates without changing Current plan

Activating a project chip (desktop) or card (mobile) SHALL navigate to that project's `/goals/projects/{id}` route and SHALL NOT change Current plan.

#### Scenario: Activating a chip opens project detail

- **WHEN** the user activates a project chip or card in the quick-nav
- **THEN** `/goals/projects/{id}` opens for that project, and Current plan is unchanged

### Requirement: No projects yet

Below 768px, the quick-nav SHALL show the same no-projects teaching state `home-projects-widget` shows on the home page, since it is that same widget. At or above 768px, the desktop chip row SHALL render nothing rather than an empty row with only the "all projects" link, since a chip row with no projects in it has nothing to show.

#### Scenario: Mobile shows the same empty-state teaching as the home widget

- **WHEN** a user with no projects opens Goals Overview below 768px
- **THEN** the widget shows the same explanatory copy and create-a-project action `home-projects-widget` shows on the home page

#### Scenario: Desktop renders nothing when there are no projects

- **WHEN** a user with no projects opens Goals Overview at or above 768px
- **THEN** no chip row is rendered

### Requirement: Loading and failure states

Below 768px, the quick-nav SHALL show the same distinct loading and failure states `home-projects-widget` shows on the home page. At or above 768px, the desktop chip row SHALL show a loading skeleton while the project list is loading, and SHALL render nothing (rather than an error message) if it fails to load, since the row is a convenience shortcut and Overview's own goal list does not depend on it.

#### Scenario: Mobile shows the same loading and failure states as the home widget

- **WHEN** the project list is loading, or fails to load, on Goals Overview below 768px
- **THEN** the widget shows the same loading or failure-with-retry state `home-projects-widget` shows on the home page

#### Scenario: Desktop shows a skeleton while loading and hides on failure

- **WHEN** the project list is loading on Goals Overview at or above 768px
- **THEN** the chip row shows a loading skeleton, and if the project list fails to load, the chip row does not render at all
