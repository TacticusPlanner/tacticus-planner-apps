## MODIFIED Requirements

### Requirement: Plan wizard entry points

For signed-in users on an event that is active or upcoming, the event header row SHALL show the wizard button after the linked projects line, on every tab: a primary **Plan this event** button until the event has a plan, then a secondary **Refine plan** button. An event has a plan when a project targets it and every lane holds at least two stored teams; while either is unknown (loading or failed) it counts as having none, and each lane's Suggest teams dialog SHALL show a **Plan all lanes for a goal** link. Both SHALL open `/legendary-events/:eventId/plan` with step 1's target on the next step (a `?target=` step preselects another). An archived or finished event SHALL show neither.

#### Scenario: Open from Overview

- **WHEN** the user presses Plan this event on Uthar's page
- **THEN** the app navigates to `/legendary-events/votanUthar/plan` at step 1

#### Scenario: Refine an existing plan

- **GIVEN** the project "Fabius Bile · 5 stars" targets Fabius Bile and each lane holds two or more teams
- **WHEN** Fabius Bile's page renders
- **THEN** the header row shows the project and a secondary **Refine plan** button that opens the wizard

#### Scenario: Plan an event without a project

- **GIVEN** no project targets Farsight
- **WHEN** Farsight's page renders
- **THEN** the header row shows "No project for this event" and a primary **Plan this event** button
