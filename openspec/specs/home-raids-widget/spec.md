# home-raids-widget Specification

## Purpose

Gives players a compact, location-first view of what's still worth raiding today for their Active project, without leaving the home page or wading through Today's per-goal grouping.

## Requirements

### Requirement: Home page renders Daily Raids after Your Projects

The authenticated home page SHALL render a Daily Raids section after Your Projects and before the events calendar. At or above the 768px breakpoint it SHALL render side by side with Your Projects. Below 768px it SHALL render as its own full-width stacked section, after Your Projects and before the events calendar.

#### Scenario: Desktop shows Daily Raids beside Projects

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** Daily Raids renders side by side with Your Projects, below Token Availability and above the events calendar

#### Scenario: Mobile stacks Daily Raids after Projects

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** Daily Raids renders as its own full-width section, after Your Projects and before the events calendar

### Requirement: The widget scopes to the Active project, matching Today's own default

The widget SHALL compute its schedule for the same project Today would default to: the player's Active project, falling back to the Default project when no project is marked Active. It SHALL use only that project's `Active`-status goals, in their configured priority order — the same scope Today itself uses.

#### Scenario: Defaults to the Active project

- **GIVEN** the player has a project marked as their Active project
- **WHEN** the widget loads
- **THEN** it shows that project's schedule, the same project Today would default to

#### Scenario: Falls back to the Default project

- **GIVEN** no project is currently marked Active
- **WHEN** the widget loads
- **THEN** it shows the player's Default project's schedule

#### Scenario: Only Active-status goals contribute

- **GIVEN** the scoped project has a mix of Active, Paused, Completed, and Archived goals
- **WHEN** the widget computes its schedule
- **THEN** only the Active goals' needs are reflected, matching Today's own goal-status scope

### Requirement: The widget shows the real (energy-budget) schedule only, one row per location

The widget SHALL show only the locations included in today's real energy-budget schedule (the same schedule Today's main list computes) — it SHALL NOT include Bonus Raids or Today's Attempts. Each row SHALL represent one battle location, not one goal or one character: the location, the planned raid count at that location, and its primary reward, with no unit portrait, goal-type icon, or character/goal label.

Each row SHALL present its location exactly as Today's own rows do (see `daily-raids-today` — "Campaign locations use the Character Lookup presentation"): the campaign icon, the campaign's own display name on the first line, and the node's tier-and-number label — including a challenge node's "B" suffix — on the second. The widget SHALL NOT use a differently-formatted or compact location label, so that a location reads identically on Home and on Today.

A node whose real synced attempts today have already reached zero remaining SHALL be excluded, using the same real-attempts-based exclusion Today applies to its own schedule.

Assumptions:

- "Real energy-budget schedule" and node exhaustion follow the same daily-attempt-cap, shared-inventory, and real-synced-attempts rules already defined for Today's main schedule.
- The location presentation is owned by `daily-raids-today`; this requirement adopts it rather than defining a second one.

#### Scenario: A location shows a plain row

- **GIVEN** a battle location is node 3 of the Indomitus Elite campaign, part of today's real schedule with 3 planned raids remaining
- **WHEN** the widget renders that location
- **THEN** it shows one row with the campaign icon, "Indomitus" on the first line, "Elite 3" on the second, the raid count, and its primary reward icon — no unit portrait or goal label

#### Scenario: A location reads the same on Home as on Today

- **GIVEN** the same battle location appears both in the widget and in Today's own schedule
- **WHEN** both render
- **THEN** its campaign name and tier-and-node label are identical in both places, not a compact form in one and a full form in the other

#### Scenario: An exhausted node is not shown

- **GIVEN** a battle location's real synced attempts today have reached zero remaining
- **WHEN** the widget renders
- **THEN** that location does not appear in the widget

#### Scenario: Bonus Raids and Today's Attempts are excluded

- **GIVEN** today's data includes Bonus Raids entries and Today's Attempts entries
- **WHEN** the widget renders
- **THEN** neither Bonus Raids nor Today's Attempts entries appear — only the real main schedule

### Requirement: Locations shared by more than one goal are combined into a single row

When two or more in-scope goals each plan a raid at the same battle location today, the widget SHALL show that location once, with its raid count equal to the sum of the raids planned there across those goals — rather than once per contributing goal, as Today's own goal-grouped view does.

#### Scenario: Two goals share a node

- **GIVEN** Goal A plans 2 raids at node 3 of Indomitus Elite and Goal B plans 3 raids at the same node, and no daily cap at that node is exceeded by the combined total
- **WHEN** the widget renders
- **THEN** that node appears once — "Indomitus" / "Elite 3" — showing "5×", instead of appearing once under each goal as Today does

#### Scenario: A single goal's location is unaffected

- **GIVEN** only one in-scope goal plans raids at a given location
- **WHEN** the widget renders
- **THEN** that location's row shows that goal's own planned raid count unchanged

### Requirement: Empty and unavailable states

When the scoped project has no farmable need for today, the widget SHALL show an explicit "nothing to raid today" message rather than an empty grid. When the player has no projects at all, it SHALL show the same no-projects guidance as Your Projects, scoped to this widget. The widget SHALL defer rendering until the real synced-attempts data it depends on has loaded, consistent with Today's own readiness gating.

#### Scenario: No farmable need today

- **GIVEN** the scoped project's Active goals have no unmet farmable need
- **WHEN** the widget loads
- **THEN** it shows an explicit empty message, not a blank grid

#### Scenario: No projects exist

- **GIVEN** the player has no projects
- **WHEN** the widget loads
- **THEN** it shows guidance to create a project, consistent with Your Projects' empty state

#### Scenario: Required data has not loaded yet

- **GIVEN** the player's real synced attempt data has not yet loaded
- **WHEN** the widget would otherwise render
- **THEN** it defers rendering until that data is available

### Requirement: Activating the widget navigates to Today

Activating the widget (outside any per-row control) SHALL navigate to `/dailies/raids/today`.

#### Scenario: Widget opens Today

- **WHEN** the user activates the Daily Raids widget
- **THEN** `/dailies/raids/today` opens, scoped to the same Active/Default project the widget showed
