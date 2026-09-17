## Purpose

Gives players a glanceable summary of their projects on the home page — Current plan first, plus a few others — so they can jump straight into a project's detail without visiting the Projects dashboard first.

## ADDED Requirements

### Requirement: Home page renders Your Projects after Token Availability

The authenticated home page SHALL render a Your Projects section after Token Availability. At or above the 768px breakpoint it SHALL render side by side with the Daily Raids section, above the events calendar. Below 768px it SHALL render as its own full-width stacked section, in the same top-to-bottom order (Token Availability, Your Projects, Daily Raids, events calendar).

#### Scenario: Desktop shows Projects and Daily Raids side by side

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** Your Projects and Daily Raids render side by side, below Token Availability and above the events calendar

#### Scenario: Mobile stacks all sections in order

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** Token Availability, Your Projects, Daily Raids, and the events calendar render as separate full-width stacked sections in that order

### Requirement: The widget lists projects, Current plan first; mobile caps the list, desktop does not

The widget SHALL show the player's Current plan project first, if one exists, followed by other non-archived projects, each ordered by the same ordering the Projects dashboard uses. Archived projects SHALL NOT appear in the widget.

Below the 768px breakpoint, the widget SHALL cap the list to 3 project cards total and show a "+N more" control that navigates to `/goals/projects` when more than 3 non-archived projects exist. At or above 768px, the widget SHALL show every non-archived project uncapped, with no "+N more" control.

#### Scenario: Desktop shows every project uncapped

- **GIVEN** the player has 5 non-archived projects, one of which is Current plan
- **WHEN** the widget renders at or above the 768px breakpoint
- **THEN** all 5 are shown, Current plan first, with no "+N more" control

#### Scenario: Mobile truncates to 3 with a link to see more

- **GIVEN** the player has 5 non-archived projects, one of which is Current plan
- **WHEN** the widget renders below the 768px breakpoint
- **THEN** Current plan appears first, 2 more projects follow it, and a "+2 more" control links to `/goals/projects`

#### Scenario: Mobile with three or fewer projects needs no truncation

- **GIVEN** the player has 3 or fewer non-archived projects
- **WHEN** the widget renders below the 768px breakpoint
- **THEN** all of them are shown and no "+N more" control is displayed

#### Scenario: Archived projects are excluded

- **GIVEN** the player has archived projects
- **WHEN** the widget renders, on either platform
- **THEN** none of the archived projects appear in the widget or count toward mobile's cap

### Requirement: Project cards are condensed and identity-only

Each card SHALL show that project's color, name, and a units/goals summary (a count of the project's in-progress unit goals, cheaply derived from its goal list), condensed for the smaller widget footprint. Cards in this widget SHALL NOT render lifecycle actions (Make current, Edit, Archive/Restore) — the widget is for navigation and at-a-glance status only.

Implementation note: the Projects dashboard's full available/blocked/estimate summary is computed by a larger subsystem (`use-goal-attainment.ts`, `use-plan-insights.ts`, `use-goals-overview-metrics.ts`) that lives in `pages/goals/model`, not `features/project-management`. Relocating that subsystem so a home-page glance card could reach it was judged disproportionate to this widget's purpose and descoped; the units/goals count is the permanent home-widget summary, not an interim state.

#### Scenario: Card shows identity and summary

- **GIVEN** a project with a color, name, and a loaded summary
- **WHEN** its card renders in the widget
- **THEN** the card shows the project's color, name, and its units/goals summary, without any action controls

#### Scenario: Summary still loading

- **GIVEN** a project's identity has loaded and its summary calculation has not
- **WHEN** its card renders
- **THEN** the card shows identity with a summary skeleton, consistent with how the Projects dashboard handles the same loading state

### Requirement: Activating a card navigates to that project's detail route

Activating a project card SHALL navigate to that project's `/goals/projects/{id}` route without changing Current plan.

#### Scenario: Card opens project detail

- **WHEN** the user activates a project card in the widget
- **THEN** `/goals/projects/{id}` opens for that project, and Current plan is unchanged

### Requirement: No projects yet

When the player has no projects, the widget SHALL explain that projects group unit goals into prioritized plans and provide a labeled action that navigates to `/goals/projects` to create one, instead of rendering empty project cards.

#### Scenario: Empty widget teaches projects

- **WHEN** a user with no projects opens `/home`
- **THEN** the widget shows explanatory copy and a labeled action to `/goals/projects`, with no project cards or "+N more" control

### Requirement: Distinct loading and failure states

The widget SHALL present a distinct state for project data still loading versus the project list failing to load, separate from the no-projects empty state.

#### Scenario: Project list is loading

- **WHEN** the player's project list has not yet loaded
- **THEN** the widget shows a loading state rather than the empty-projects message

#### Scenario: Project list fails to load

- **WHEN** the player's project list fails to load
- **THEN** the widget shows an explicit failure state with a retry action, not the empty-projects message
