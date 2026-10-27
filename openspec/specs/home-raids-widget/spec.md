# home-raids-widget Specification

## Purpose

Gives players a compact, location-first view of what's still worth raiding today for all their Active goals, without leaving the home page or wading through Today's per-goal grouping.

## Requirements

### Requirement: Home page renders Daily Raids after Your Projects

The authenticated home page SHALL render a Daily Raids section in the position defined by `home-projects-widget` "Home page renders Your Projects after Token Availability".

#### Scenario: Desktop shows Daily Raids beside Projects

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** Daily Raids renders side by side with Your Projects, below Token Availability and above the events calendar

### Requirement: The widget shows the real (energy-budget) schedule only, one row per location

The widget SHALL show only the locations included in today's real energy-budget schedule (the same schedule Today's main list computes) — it SHALL NOT include Today's Attempts, and it SHALL NOT include Bonus Raids while today's real energy spend is below the daily energy limit. Once that spend reaches or exceeds the limit, the widget SHALL mirror Today (see `daily-raids-today` — "Bonus Raids"): it SHALL show the Bonus Raids locations instead of the real schedule's, preceded by a short caption stating that the daily energy limit has been reached, and when no Bonus Raids location remains it SHALL show that caption with its explicit empty message. It decides this with the same rule Today uses, so both surfaces always agree. Each row SHALL represent one battle location, not one goal or one character: the location, the same "upgrades left" label Today shows for it (see `daily-raids-today` — "Today's raid schedule shows what is left to farm"; none when the node is planned up to its daily cap or a full day of its attempts would not cover the need), and its primary reward, with no unit portrait, goal-type icon, or character/goal label.

Each row SHALL present its location exactly as Today's own rows do (see `daily-raids-today` — "Campaign locations use the Character Lookup presentation"): the campaign icon, the campaign's own display name on the first line, and the node's tier-and-number label — including a challenge node's "B" suffix — on the second. The widget SHALL NOT use a differently-formatted or compact location label, so that a location reads identically on Home and on Today.

A node whose real synced attempts today have already reached zero remaining SHALL be excluded, using the same real-attempts-based exclusion Today applies to its own schedule.

Assumptions:

- "Real energy-budget schedule" and node exhaustion follow the same daily-attempt-cap, shared-inventory, and real-synced-attempts rules already defined for Today's main schedule.
- The location presentation is owned by `daily-raids-today`; this requirement adopts it rather than defining a second one.
- When Bonus Raids replace the schedule (the daily energy limit being spent) is owned by `daily-raids-today`; this requirement adopts it rather than defining a second rule.

#### Scenario: A location shows a plain row

- **GIVEN** a battle location is node 3 of the Indomitus Elite campaign, part of today's real schedule, planned below its daily cap while its goal still needs 3 of the upgrade, and a full day of attempts there is expected to drop at least 3
- **WHEN** the widget renders that location
- **THEN** it shows one row with the campaign icon, "Indomitus" on the first line, "Elite 3" on the second, "3 upgrades left", and its primary reward icon — no unit portrait or goal label

#### Scenario: A location reads the same on Home as on Today

- **GIVEN** the same battle location appears both in the widget and in Today's own schedule
- **WHEN** both render
- **THEN** its campaign name and tier-and-node label are identical in both places, not a compact form in one and a full form in the other

#### Scenario: An exhausted node is not shown

- **GIVEN** a battle location's real synced attempts today have reached zero remaining
- **WHEN** the widget renders
- **THEN** that location does not appear in the widget

#### Scenario: Bonus Raids and Today's Attempts are excluded

- **GIVEN** today's data includes Bonus Raids entries and Today's Attempts entries, and today's real energy spend is below the daily energy limit
- **WHEN** the widget renders
- **THEN** neither Bonus Raids nor Today's Attempts entries appear — only the real main schedule — and no limit-reached caption is shown

#### Scenario: Bonus Raids replace the schedule once the energy limit is spent

- **GIVEN** the daily energy limit is 288, the player's synced attempts today have spent 300 energy, and Bonus Raids has an entry at a location with attempts left
- **WHEN** the widget renders
- **THEN** it shows a caption saying the daily energy limit is reached followed by that Bonus Raids location as a row, no real-schedule locations, and Bonus Raids locations that are exhausted are still excluded

### Requirement: Locations shared by more than one goal are combined into a single row

When two or more in-scope goals each plan a raid at the same battle location today, the widget SHALL show that location once, with its "upgrades left" count equal to the sum of what those goals still need of the row's primary reward there (no label once their combined planned raids reach the node's daily cap, or when a full day of its attempts would not be expected to drop that sum) — rather than once per contributing goal, as Today's own goal-grouped view does.

#### Scenario: Two goals share a node

- **GIVEN** Goal A still needs 2 and Goal B still needs 3 of the same upgrade at node 3 of Indomitus Elite, and their combined planned raids there stay below its daily cap
- **WHEN** the widget renders
- **THEN** that node appears once — "Indomitus" / "Elite 3" — showing "5 upgrades left", instead of appearing once under each goal as Today does

#### Scenario: A single goal's location is unaffected

- **GIVEN** only one in-scope goal plans raids at a given location
- **WHEN** the widget renders
- **THEN** that location's row shows that goal's own "upgrades left" count unchanged

### Requirement: Activating the widget navigates to Today

Activating the widget (outside any per-row control) SHALL navigate to Today (`/dailies/raids`).

#### Scenario: Widget opens Today

- **WHEN** the user activates the Daily Raids widget
- **THEN** Today (`/dailies/raids`) opens; the widget passes no project to it

### Requirement: The widget scopes to all Active goals, matching Today

The widget SHALL compute its schedule from the same account-wide scope Today uses: every `Active`-status goal in the account, each once in canonical global priority order, regardless of project membership. It SHALL NOT select, default to, or depend on a project.

#### Scenario: Uses every project's Active goals

- **GIVEN** Active goals in several projects
- **WHEN** the widget loads
- **THEN** it shows the schedule for all of them, the same schedule Today shows

#### Scenario: Only Active-status goals contribute

- **GIVEN** the account has a mix of Active, Paused, Completed, and Archived goals
- **WHEN** the widget computes its schedule
- **THEN** only the Active goals' needs are reflected, matching Today's own goal-status scope

### Requirement: Empty and unavailable states are account-wide

When the account's Active goals have no farmable need for today, the widget SHALL show an explicit "nothing to raid today" message rather than an empty grid. When the player has no Active goals, it SHALL show guidance to create or resume a goal. The widget SHALL defer rendering until the real synced-attempts data it depends on has loaded, consistent with Today's own readiness gating.

#### Scenario: No farmable need today

- **GIVEN** the account's Active goals have no unmet farmable need
- **WHEN** the widget loads
- **THEN** it shows an explicit empty message, not a blank grid

#### Scenario: No Active goals exist

- **GIVEN** the player has no Active goals
- **WHEN** the widget loads
- **THEN** it shows guidance to create or resume a goal, not a project prompt

#### Scenario: Required data has not loaded yet

- **GIVEN** the player's real synced attempt data has not yet loaded
- **WHEN** the widget would otherwise render
- **THEN** it defers rendering until that data is available
