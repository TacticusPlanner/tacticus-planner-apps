# home-projects-widget Specification

## Purpose

Gives players a glanceable summary of their projects on the home page — the Default project first, then the others — so they can open a project on the Goals page without visiting the Projects page first.

## Requirements

### Requirement: Home page renders Your Projects after Token Availability

The authenticated home page SHALL render Your Projects after Upcoming events and before the events calendar below the 1024px (`lg`) breakpoint, full width; at or above 1024px it SHALL sit in the middle column of the Daily Raids / Your Projects / Upcoming events row. Cards SHALL be laid out in one column below 768px, two from 768px, and one again from 1024px, where the widget is a narrow column. The header SHALL carry an "All projects" link to `/plan/projects`.

#### Scenario: Desktop shows Projects in a grid

- **WHEN** a signed-in user opens `/home` at or above the 1024px breakpoint
- **THEN** Your Projects renders in the middle column between Daily Raids and Upcoming events, above the calendar, its cards in one column

#### Scenario: Mobile stacks all sections in order

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** Right now, Daily Raids, Upcoming events, Your Projects and the events calendar render as separate full-width stacked sections in that order, project cards in one column

#### Scenario: Header link

- **WHEN** the user activates "All projects"
- **THEN** `/plan/projects` opens

### Requirement: The widget lists projects, Default first, five on desktop and three on a phone

The widget SHALL show the Default project first, followed by other non-archived projects, each ordered by the same ordering the Projects dashboard uses. Archived projects SHALL NOT appear in the widget.

The widget SHALL show the first 5 project cards at or above the 768px breakpoint and the first 3 below it (the Home card limit shared with Daily Raids and Upcoming events). When more non-archived projects exist it SHALL show a "Show N more" control (N the hidden count) that reveals the rest in place and becomes "Show less", exposing its state with `aria-expanded`. The expanded state is not persisted.

#### Scenario: Desktop shows five

- **GIVEN** the player has 7 non-archived projects, one of which is the Default project
- **WHEN** the widget renders at or above the 768px breakpoint
- **THEN** the Default project and the next 4 are shown with "Show 2 more"; activating it shows all 7 and the control reads "Show less"

#### Scenario: Mobile shows three

- **GIVEN** the player has 5 non-archived projects, one of which is the Default project
- **WHEN** the widget renders below the 768px breakpoint
- **THEN** the Default project appears first, 2 more projects follow it, and "Show 2 more" reveals the other 2 in place

#### Scenario: Within the limit needs no toggle

- **GIVEN** the player has 3 or fewer non-archived projects
- **WHEN** the widget renders at any width
- **THEN** all of them are shown and no "Show N more" control is displayed

#### Scenario: Archived projects are excluded

- **GIVEN** the player has archived projects
- **WHEN** the widget renders, on either platform
- **THEN** none of the archived projects appear in the widget or count toward mobile's cap

### Requirement: Project cards are condensed and identity-only

Each card SHALL be two lines tall whatever it holds. The first line SHALL show the project's color, name and Default badge, and for a targeted project the deadline chip's timing alone ("starts in 18 days", `project-deadline`, without its link since the whole card is a button; the event's name moves to the chip's tooltip and accessible text). The second line SHALL show the unit portraits and one line of facts that truncates rather than wraps, most useful first: the deadline fit count for a resolvable, not-ended target (`project-deadline-fit`), "Done by" or "No date" (`plan-completion-outlook`, its not-estimated count left out when the fit count already gives it), then the goal count. The count of in-flight goals and of the distinct units among them come from the project's `goalIds` joined with the loaded goals list — no per-project read; the units show as portraits rather than a count. Reached and blocked counts are left out to keep the rows short. The home page computes these from one global-plan run, only when at least one listed project holds a goal. Cards in this widget SHALL NOT render lifecycle actions (Make current, Edit, Archive/Restore) — the widget is for navigation and at-a-glance status only.

A card SHALL be as tall as a Daily Raids row and an Upcoming events row, so the three widgets are the same height at or above 1024px when each shows its card count with its "Show N more" control.

Implementation note: the estimate subsystem now lives in `features/goal-planning`, so `pages/home` can compose the status line without relocating it.

#### Scenario: Card shows identity and summary

- **GIVEN** a project with a color, name, and the goals list loaded
- **WHEN** its card renders in the widget
- **THEN** the card shows the project's color, name, unit portraits and goal count, without any action controls

#### Scenario: Targeted card shows its fit count

- **GIVEN** a project targeting the Legendary Event Uthar with 2 of 4 counted goals fitting
- **WHEN** its card renders in the widget
- **THEN** the card's first line also shows "starts in 18 days" (read as "LE · Uthar · starts in 18 days" by a screen reader), and its facts start with "2 of 4 fit"

#### Scenario: Cards match the other Home rows

- **GIVEN** Daily Raids, Your Projects and Upcoming events each have more items than Home's card count
- **WHEN** a signed-in user opens `/home` at or above the 1024px breakpoint
- **THEN** each card in the three widgets is the same height, whatever facts a project card holds, and the three widgets end level

#### Scenario: No goals, no plan run

- **GIVEN** no listed project holds a goal
- **WHEN** the widget renders
- **THEN** no plan run is computed for the widget

#### Scenario: Done by on any card

- **GIVEN** an untargeted project whose goals finish by Dec 26
- **WHEN** its card renders in the widget
- **THEN** it shows "Done by Dec 26"

#### Scenario: Summary still loading

- **GIVEN** the project list has loaded and the goals list has not
- **WHEN** the cards render
- **THEN** every card shows identity with a summary skeleton, and no per-project request is issued

#### Scenario: Two requests for the whole widget

- **GIVEN** the player has five non-archived projects
- **WHEN** the widget renders on desktop
- **THEN** the projects list and the goals list are the only reads it issues

### Requirement: No projects yet

When the player has no projects, the widget SHALL explain that projects group unit goals into prioritized plans and provide a labeled action that navigates to `/plan/projects` to create one, instead of rendering empty project cards.

#### Scenario: Empty widget teaches projects

- **WHEN** a user with no projects opens `/home`
- **THEN** the widget shows explanatory copy and a labeled action to `/plan/projects`, with no project cards or "Show N more" control

### Requirement: Distinct loading and failure states

The widget SHALL present a distinct state for project data still loading versus the project list failing to load, separate from the no-projects empty state. When the goals list fails, the cards SHALL keep their identity and show the summary as unavailable with one retry that re-reads the goals list.

#### Scenario: Project list is loading

- **WHEN** the player's project list has not yet loaded
- **THEN** the widget shows a loading state rather than the empty-projects message

#### Scenario: Project list fails to load

- **WHEN** the player's project list fails to load
- **THEN** the widget shows an explicit failure state with a retry action, not the empty-projects message

#### Scenario: Goals list fails to load

- **GIVEN** the project list loaded
- **WHEN** the goals list read fails
- **THEN** each card renders its identity with an unavailable summary and a retry action that re-reads the goals list once

### Requirement: Activating a card opens that project on Goals

Activating a project card SHALL navigate to the Goals page scoped to that project, `/plan/goals?project={id}`.

#### Scenario: Card opens the scoped Goals page

- **WHEN** the user activates a project card in the widget
- **THEN** `/plan/goals?project={id}` opens with that project selected in its project select

### Requirement: Widget cards show unit portraits

Each project card in the home widget SHALL show the same unit portraits as the Projects page card (`project-management`), at a smaller size, with "+N" past 4 units. They come from the goals list the widget already reads, with no extra request.

#### Scenario: Portraits without extra reads

- **GIVEN** the player has five non-archived projects with goals
- **WHEN** the widget renders
- **THEN** each card shows its unit portraits, and the projects list and the goals list are still the only reads
