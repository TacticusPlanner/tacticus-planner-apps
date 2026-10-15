## MODIFIED Requirements

### Requirement: The widget shows the real (energy-budget) schedule only, one row per location

The widget SHALL show only the locations included in today's real energy-budget schedule (the same schedule Today's main list computes) — it SHALL NOT include Today's Attempts, and it SHALL NOT include Bonus Raids while today's real energy spend is below the daily energy limit. Once that spend reaches or exceeds the limit, the widget SHALL mirror Today (see `daily-raids-today` — "Bonus Raids"): it SHALL show the Bonus Raids locations instead of the real schedule's, preceded by a short caption stating that the daily energy limit has been reached, and when no Bonus Raids location remains it SHALL show that caption with its explicit empty message. It decides this with the same rule Today uses, so both surfaces always agree. Each row SHALL represent one battle location, not one goal or one character: the location, the planned raid count at that location, and its primary reward, with no unit portrait, goal-type icon, or character/goal label.

Each row SHALL present its location exactly as Today's own rows do (see `daily-raids-today` — "Campaign locations use the Character Lookup presentation"): the campaign icon, the campaign's own display name on the first line, and the node's tier-and-number label — including a challenge node's "B" suffix — on the second. The widget SHALL NOT use a differently-formatted or compact location label, so that a location reads identically on Home and on Today.

A node whose real synced attempts today have already reached zero remaining SHALL be excluded, using the same real-attempts-based exclusion Today applies to its own schedule.

Assumptions:

- "Real energy-budget schedule" and node exhaustion follow the same daily-attempt-cap, shared-inventory, and real-synced-attempts rules already defined for Today's main schedule.
- The location presentation is owned by `daily-raids-today`; this requirement adopts it rather than defining a second one.
- When Bonus Raids replace the schedule (the daily energy limit being spent) is owned by `daily-raids-today`; this requirement adopts it rather than defining a second rule.

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

- **GIVEN** today's data includes Bonus Raids entries and Today's Attempts entries, and today's real energy spend is below the daily energy limit
- **WHEN** the widget renders
- **THEN** neither Bonus Raids nor Today's Attempts entries appear — only the real main schedule — and no limit-reached caption is shown

#### Scenario: Bonus Raids replace the schedule once the energy limit is spent

- **GIVEN** the daily energy limit is 288, the player's synced attempts today have spent 300 energy, and Bonus Raids has an entry at a location with attempts left
- **WHEN** the widget renders
- **THEN** it shows a caption saying the daily energy limit is reached followed by that Bonus Raids location as a row, no real-schedule locations, and Bonus Raids locations that are exhausted are still excluded
