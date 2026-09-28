## RENAMED Requirements

- FROM: `### Requirement: The quick-nav lists projects, Current plan first, archived excluded`
- TO: `### Requirement: The quick-nav lists projects, Default first, archived excluded`

- FROM: `### Requirement: Activating an entry navigates without changing Current plan`
- TO: `### Requirement: Activating an entry navigates to the project's detail route`

## MODIFIED Requirements

### Requirement: The quick-nav lists projects, Default first, archived excluded

The quick-nav SHALL show the Default project first, followed by other non-archived projects in the same order the Projects dashboard uses. Archived projects SHALL NOT appear. At or above 768px every non-archived project SHALL be shown, scrolling horizontally rather than being capped; below 768px it follows `home-projects-widget`'s 3-item cap and "+N more" link.

#### Scenario: Desktop lists every non-archived project

- **GIVEN** the player has 6 non-archived projects, one of which is the Default project
- **WHEN** the quick-nav renders at or above 768px
- **THEN** all 6 appear as chips, the Default project first, scrollable rather than truncated

#### Scenario: Archived projects are excluded

- **GIVEN** the player has archived projects
- **WHEN** the quick-nav renders, on either platform
- **THEN** none of the archived projects appear in it

### Requirement: Desktop's chip row links to the full Projects dashboard

The desktop chip row SHALL include a trailing link to `/plan/projects`, so a user can still reach project lifecycle actions (Edit, Archive/Restore) and archived projects, none of which the quick-nav itself offers.

#### Scenario: A trailing link opens the Projects dashboard

- **WHEN** the desktop chip row renders
- **THEN** a link at its end navigates to `/plan/projects` when activated

### Requirement: Activating an entry navigates to the project's detail route

Activating a project chip (desktop) or card (mobile) SHALL navigate to that project's `/plan/projects/{id}` route.

#### Scenario: Activating a chip opens project detail

- **WHEN** the user activates a project chip or card in the quick-nav
- **THEN** `/plan/projects/{id}` opens for that project
