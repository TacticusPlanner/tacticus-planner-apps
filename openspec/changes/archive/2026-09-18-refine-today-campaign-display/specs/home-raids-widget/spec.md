## MODIFIED Requirements

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
