## Purpose

Shows a player the forward-looking, day-by-day continuation of the same schedule Today produces — V1's "Daily Raids" section, ported read-only — so they can see how long their active goals will take to farm out and what each upcoming day looks like, without needing to return to Today every day.

## ADDED Requirements

### Requirement: Raids Plan uses an icon-led responsive schedule

Raids Plan SHALL use the same unit portraits, resource art, and energy/raid-attempt icon language as Today.

#### Scenario: Plan reuses combined shard rows

- **GIVEN** a plan day where a goal's only scheduled resource is the goal unit's shards
- **WHEN** that day is rendered
- **THEN** it uses the same non-duplicated combined unit-and-shard row as Today

#### Scenario: Mobile plan is compact

- **WHEN** Raids Plan is viewed below the 768px mobile breakpoint
- **THEN** its whole-plan summary and day schedules use dense, scan-friendly rows without removing labels, totals, or controls

#### Scenario: Desktop plan fills the page width

- **WHEN** Raids Plan is viewed at or above the 768px desktop breakpoint
- **THEN** the whole-plan summary and visible day columns expand across the available content width while retaining readable minimum widths

### Requirement: Raids Plan shares Today's selected project

Raids Plan SHALL use the same selected project as Today (one selection shared across both Raids sub-tabs), rather than maintaining an independent selector. Switching the project on either sub-tab SHALL recompute both.

#### Scenario: Selecting a project on Today updates Raids Plan too

- **GIVEN** the user is on Raids Plan showing project A's schedule
- **WHEN** the user switches to Today and selects project B
- **THEN** Raids Plan now shows project B's schedule when next viewed, without requiring a separate selection

#### Scenario: Raids Plan mirrors Today's project-list failure state

- **GIVEN** the project-list request fails
- **WHEN** Raids Plan loads
- **THEN** it shows the same load error and retry action as Today, not an empty-project prompt

#### Scenario: Raids Plan mirrors Today's empty-project state

- **GIVEN** the project-list request succeeds with no projects
- **WHEN** Raids Plan loads
- **THEN** it shows the same empty-project prompt as Today, not a load error

### Requirement: Raids Plan includes Today

Raids Plan SHALL compute its schedule from the same in-scope (`Active`-status, priority-ordered) goals and the same engine run as Today, and SHALL render the complete sequence beginning with Day 1 labeled "Today", followed by Day 2 onward.

#### Scenario: Day columns start with Today

- **GIVEN** a project with an in-scope farmable schedule
- **WHEN** Raids Plan loads
- **THEN** the first rendered day column is labeled "Today" and contains the same Day 1 schedule shown on the Today tab

#### Scenario: Everything resolves within Day 1

- **GIVEN** every in-scope goal's farmable need is fully covered within Day 1 (Today's own schedule already clears it)
- **WHEN** Raids Plan loads
- **THEN** Raids Plan still renders the Today column as the complete one-day plan

### Requirement: Raids Plan's per-day schedule

Each rendered day column SHALL show that day's own raid-attempt schedule, computed by the same shared engine (priority-ordered shared inventory carried forward from prior days, per-battle daily-attempt caps shared across every goal that day, the same `planningSettings.dailyEnergy` budget), grouped by goal and marked fully-raided per node exactly as Today's schedule is (same conventions, not a separate implementation).

#### Scenario: A day's schedule is grouped by goal

- **GIVEN** Day N's schedule includes raids toward two or more different goals
- **WHEN** Raids Plan loads
- **THEN** that day's column is organized into per-goal groups, each labeled with that goal's unit and target, the same way Today's schedule is

#### Scenario: A later day's inventory reflects earlier days' consumption

- **GIVEN** an upgrade needed on Day 3 was already partially consumed from shared inventory by Day 1 and Day 2's higher-priority goals
- **WHEN** Raids Plan loads
- **THEN** Day 3's schedule for that upgrade reflects only what's left after Day 1 and Day 2, not the original combined need

### Requirement: Raids Plan's per-day summary stats

Each day column SHALL show that day's total energy spent (out of `planningSettings.dailyEnergy`) and that day's total raid-attempt count (the sum of raids performed across every node and goal that day).

#### Scenario: A day's energy total reflects only that day's spend

- **GIVEN** Day N's schedule spends less than the full daily energy budget (all in-scope needs for that day are covered early)
- **WHEN** Raids Plan loads
- **THEN** that day's column shows its actual energy spent, not the full budget

#### Scenario: A day's raid-attempt count sums every goal's raids that day

- **GIVEN** two different goals each perform raids on Day N
- **WHEN** Raids Plan loads
- **THEN** that day's raid-attempt count is the combined total across both goals, not just one

### Requirement: Raids Plan's whole-plan summary

Above the day columns, Raids Plan SHALL show: the total number of days until every in-scope goal's farmable need is fully met (counted from Today/Day 1), the total energy that will be spent across the whole plan, the total raid-attempt count across the whole plan, the number of days with more than 60 unused energy that day (a day where `planningSettings.dailyEnergy` minus that day's energy spent exceeds 60 — ported from V1's threshold, not redesigned), and the plan's completion date.

#### Scenario: Whole-plan totals include the rendered Today column

- **GIVEN** a project whose plan takes 5 days total
- **WHEN** Raids Plan loads
- **THEN** the total-days, total-energy, and total-raid-attempt summary stats reflect all 5 rendered days from Today through Day 5

#### Scenario: Days-with-unused-energy counts only days over the threshold

- **GIVEN** a plan where some days spend the full daily energy budget and others leave more than 60 energy unused
- **WHEN** Raids Plan loads
- **THEN** the "days unused" count includes only the days exceeding that 60-energy threshold, not every day with any leftover energy at all

#### Scenario: Completion date matches the plan's last day

- **GIVEN** a plan that takes N days total
- **WHEN** Raids Plan loads
- **THEN** the displayed completion date is N - 1 days after today's date, so a one-day plan completes Today

### Requirement: Raids Plan pages days 3-at-a-time

Raids Plan SHALL initially render only the first 3 day columns (Today, Day 2, Day 3), with a "Show all days" control that reveals the remaining days when more exist — the same truncate-then-reveal pattern Bonus Raids uses.

#### Scenario: More than 3 days truncates with a Show all control

- **GIVEN** the plan takes more than 3 days total
- **WHEN** Raids Plan loads
- **THEN** only Today, Day 2, and Day 3 are shown, followed by a "Show all days" control, and later days are not rendered until it is activated

#### Scenario: Show all days reveals the rest

- **GIVEN** Raids Plan is showing its truncated view with a "Show all days" control
- **WHEN** the user activates it
- **THEN** every remaining day column is revealed in order

#### Scenario: 3 or fewer total days needs no truncation

- **GIVEN** the plan takes 3 days or fewer total
- **WHEN** Raids Plan loads
- **THEN** all day columns are shown and no "Show all days" control is displayed

### Requirement: Card density toggle

Raids Plan SHALL provide a control to collapse or expand each day column's raid-list detail, applying uniformly to every visible day column at once.

#### Scenario: Collapsing hides per-day raid-list detail

- **WHEN** the user activates the collapse control
- **THEN** every visible day column hides its per-goal raid-list detail while continuing to show that day's summary stats

#### Scenario: Expanding restores per-day raid-list detail

- **GIVEN** day columns are currently collapsed
- **WHEN** the user activates the expand control
- **THEN** every visible day column shows its per-goal raid-list detail again

### Requirement: Raids Plan shares Today's campaign eligibility and location presentation

Every Raids Plan day SHALL use the same filtered battle catalog as Today, including only the currently active campaign event when one exists, and SHALL render scheduled nodes with the same shared Character Lookup campaign-location chips.

#### Scenario: Plan contains an event campaign location

- **GIVEN** live progress identifies one active campaign event
- **WHEN** Raids Plan calculates and renders its day schedules
- **THEN** only that event campaign can contribute event locations, and every rendered location uses the campaign icon, localized compact location label, node number, and raid count used by Today
