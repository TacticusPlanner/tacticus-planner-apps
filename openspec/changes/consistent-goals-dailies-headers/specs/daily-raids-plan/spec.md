## MODIFIED Requirements

### Requirement: Raids Plan uses an icon-led responsive schedule

Raids Plan SHALL use the same unit portraits, resource art, and energy/raid-attempt icon language as Today.

#### Scenario: Plan reuses combined shard rows

- **GIVEN** a plan day where a goal's only scheduled resource is the goal unit's shards
- **WHEN** that day is rendered
- **THEN** it uses the same non-duplicated combined unit-and-shard row as Today

#### Scenario: Mobile plan is compact

- **WHEN** Raids Plan is viewed below the 768px mobile breakpoint
- **THEN** its whole-plan summary and day schedules use dense, scan-friendly rows without removing labels, totals, or controls

#### Scenario: Desktop plan fills the page width without over-stretching day columns

- **WHEN** Raids Plan is viewed at or above the 768px desktop breakpoint
- **THEN** the whole-plan summary expands across the available content width, and day columns retain a readable minimum width and grow no wider than a comfortable maximum, so they do not stretch to fill leftover row width

#### Scenario: Few visible days do not stretch to fill the row

- **GIVEN** fewer day columns are visible than would fit at their maximum comfortable width in the current row
- **WHEN** Raids Plan is viewed at or above the 768px desktop breakpoint
- **THEN** each visible day column renders at its maximum comfortable width rather than expanding further to fill the remaining row space

### Requirement: Card density toggle

Raids Plan SHALL provide a control to collapse or expand each day column's raid-list detail, applying uniformly to every visible day column at once. This control SHALL render within the whole-plan summary row rather than in a separate row of its own.

#### Scenario: Collapsing hides per-day raid-list detail

- **WHEN** the user activates the collapse control
- **THEN** every visible day column hides its per-goal raid-list detail while continuing to show that day's summary stats

#### Scenario: Expanding restores per-day raid-list detail

- **GIVEN** day columns are currently collapsed
- **WHEN** the user activates the expand control
- **THEN** every visible day column shows its per-goal raid-list detail again

#### Scenario: Toggle shares the summary row on desktop

- **WHEN** Raids Plan is viewed at or above the 768px desktop breakpoint
- **THEN** the collapse/expand control appears within the whole-plan summary row, not below it in a separate row

#### Scenario: Toggle compresses to an icon on mobile

- **WHEN** Raids Plan is viewed below the 768px mobile breakpoint
- **THEN** the collapse/expand control renders as an icon-only control, retaining an accessible name for its current action

#### Scenario: Days revealed by "Show all days" keep the current density state

- **GIVEN** the density toggle is currently set to collapsed (or expanded)
- **WHEN** the user activates "Show all days"
- **THEN** the newly-revealed day columns render in that same collapsed (or expanded) state, matching the columns already visible - there is one density state for the whole plan, not one per day

### Requirement: Raids Plan pages days 3-at-a-time

Raids Plan SHALL initially render only the first 3 day columns (Today, Day 2, Day 3), with a "Show all days" control that reveals the remaining days when more exist — the same truncate-then-reveal pattern Bonus Raids uses. This control SHALL render within the whole-plan summary area, alongside the collapse/expand density toggle, rather than below the day columns.

#### Scenario: More than 3 days truncates with a Show all control

- **GIVEN** the plan takes more than 3 days total
- **WHEN** Raids Plan loads
- **THEN** only Today, Day 2, and Day 3 are shown, the whole-plan summary area includes a "Show all days" control, and later days are not rendered until it is activated

#### Scenario: Show all days reveals the rest

- **GIVEN** Raids Plan is showing its truncated view with a "Show all days" control
- **WHEN** the user activates it
- **THEN** every remaining day column is revealed in order

#### Scenario: 3 or fewer total days needs no truncation

- **GIVEN** the plan takes 3 days or fewer total
- **WHEN** Raids Plan loads
- **THEN** all day columns are shown and no "Show all days" control is displayed

#### Scenario: Show all days shares the summary area with the density toggle on desktop

- **GIVEN** the plan takes more than 3 days total
- **WHEN** Raids Plan is viewed at or above the 768px desktop breakpoint
- **THEN** the "Show all days" control and the collapse/expand density toggle both appear within the whole-plan summary area, not in separate rows below it

#### Scenario: Show all days shares the summary area with the density toggle on mobile

- **GIVEN** the plan takes more than 3 days total
- **WHEN** Raids Plan is viewed below the 768px mobile breakpoint
- **THEN** the "Show all days" control and the collapse/expand density toggle both still appear within the whole-plan summary area, not in separate rows below it - this placement is not desktop-only
