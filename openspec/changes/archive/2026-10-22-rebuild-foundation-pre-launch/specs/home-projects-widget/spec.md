# Spec Delta

## MODIFIED Requirements

### Requirement: Project cards are condensed and identity-only

Each card SHALL show that project's color, name, and a units/goals summary (the count of the project's in-flight goals and of the distinct units among them, derived from the project's `goalIds` joined with the loaded goals list — no per-project read), condensed for the smaller widget footprint. Cards in this widget SHALL NOT render lifecycle actions (Make current, Edit, Archive/Restore) — the widget is for navigation and at-a-glance status only.

Implementation note: the Projects dashboard's full available/blocked/estimate summary is computed by a larger subsystem (`use-goal-attainment.ts`, `use-plan-insights.ts`, `use-goals-overview-metrics.ts`) that lives in `pages/goals/model`, not `features/project-management`. Relocating that subsystem so a home-page glance card could reach it was judged disproportionate to this widget's purpose and descoped; the units/goals count is the permanent home-widget summary, not an interim state.

#### Scenario: Card shows identity and summary

- **GIVEN** a project with a color, name, and the goals list loaded
- **WHEN** its card renders in the widget
- **THEN** the card shows the project's color, name, and its units/goals summary, without any action controls

#### Scenario: Summary still loading

- **GIVEN** the project list has loaded and the goals list has not
- **WHEN** the cards render
- **THEN** every card shows identity with a summary skeleton, and no per-project request is issued

#### Scenario: Two requests for the whole widget

- **GIVEN** the player has five non-archived projects
- **WHEN** the widget renders on desktop
- **THEN** the projects list and the goals list are the only reads it issues

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
