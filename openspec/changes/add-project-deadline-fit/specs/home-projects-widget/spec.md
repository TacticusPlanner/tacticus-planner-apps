# Spec Delta

## MODIFIED Requirements

### Requirement: Project cards are condensed and identity-only

Each card SHALL show that project's color, name, and a units/goals summary (the count of the project's in-flight goals and of the distinct units among them, derived from the project's `goalIds` joined with the loaded goals list — no per-project read), condensed for the smaller widget footprint. A card for a project with a resolvable, not-ended target SHALL also show its target chip and deadline fit count (`project-deadline-fit`). The home page computes it from one global-plan run, only when at least one listed project has such a target. Cards in this widget SHALL NOT render lifecycle actions (Make current, Edit, Archive/Restore) — the widget is for navigation and at-a-glance status only.

Implementation note: the estimate subsystem now lives in `features/goal-planning`, so `pages/home` can compose the fit count without relocating it. Projects without targets keep the units/goals count as their only summary.

#### Scenario: Card shows identity and summary

- **GIVEN** a project with a color, name, and the goals list loaded
- **WHEN** its card renders in the widget
- **THEN** the card shows the project's color, name, and its units/goals summary, without any action controls

#### Scenario: Targeted card shows its fit count

- **GIVEN** a project targeting Guild War season 29 with 2 of 4 counted goals fitting
- **WHEN** its card renders in the widget
- **THEN** the card also shows "GW S29" and "2 of 4 fit"

#### Scenario: No target, no plan run

- **GIVEN** no listed project has a target
- **WHEN** the widget renders
- **THEN** no plan run is computed for the widget

#### Scenario: Summary still loading

- **GIVEN** the project list has loaded and the goals list has not
- **WHEN** the cards render
- **THEN** every card shows identity with a summary skeleton, and no per-project request is issued

#### Scenario: Two requests for the whole widget

- **GIVEN** the player has five non-archived projects
- **WHEN** the widget renders on desktop
- **THEN** the projects list and the goals list are the only reads it issues
