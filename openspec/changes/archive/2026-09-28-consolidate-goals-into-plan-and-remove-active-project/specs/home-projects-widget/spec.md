## RENAMED Requirements

- FROM: `### Requirement: The widget lists projects, Current plan first; mobile caps the list, desktop does not`
- TO: `### Requirement: The widget lists projects, Default first; mobile caps the list, desktop does not`

## MODIFIED Requirements

### Requirement: The widget lists projects, Default first; mobile caps the list, desktop does not

The widget SHALL show the Default project first, followed by other non-archived projects, each ordered by the same ordering the Projects dashboard uses. Archived projects SHALL NOT appear in the widget.

Below the 768px breakpoint, the widget SHALL cap the list to 3 project cards total and show a "+N more" control that navigates to `/plan/projects` when more than 3 non-archived projects exist. At or above 768px, the widget SHALL show every non-archived project uncapped, with no "+N more" control.

#### Scenario: Desktop shows every project uncapped

- **GIVEN** the player has 5 non-archived projects, one of which is the Default project
- **WHEN** the widget renders at or above the 768px breakpoint
- **THEN** all 5 are shown, the Default project first, with no "+N more" control

#### Scenario: Mobile truncates to 3 with a link to see more

- **GIVEN** the player has 5 non-archived projects, one of which is the Default project
- **WHEN** the widget renders below the 768px breakpoint
- **THEN** the Default project appears first, 2 more projects follow it, and a "+2 more" control links to `/plan/projects`

#### Scenario: Mobile with three or fewer projects needs no truncation

- **GIVEN** the player has 3 or fewer non-archived projects
- **WHEN** the widget renders below the 768px breakpoint
- **THEN** all of them are shown and no "+N more" control is displayed

#### Scenario: Archived projects are excluded

- **GIVEN** the player has archived projects
- **WHEN** the widget renders, on either platform
- **THEN** none of the archived projects appear in the widget or count toward mobile's cap

### Requirement: Activating a card navigates to that project's detail route

Activating a project card SHALL navigate to that project's `/plan/projects/{id}` route.

#### Scenario: Card opens project detail

- **WHEN** the user activates a project card in the widget
- **THEN** `/plan/projects/{id}` opens for that project

### Requirement: No projects yet

When the player has no projects, the widget SHALL explain that projects group unit goals into prioritized plans and provide a labeled action that navigates to `/plan/projects` to create one, instead of rendering empty project cards.

#### Scenario: Empty widget teaches projects

- **WHEN** a user with no projects opens `/home`
- **THEN** the widget shows explanatory copy and a labeled action to `/plan/projects`, with no project cards or "+N more" control
