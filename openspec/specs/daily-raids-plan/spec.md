# daily-raids-plan Specification

## Purpose

Shows a player the forward-looking, day-by-day continuation of the same schedule Today produces — V1's "Daily Raids" section, ported read-only — so they can see how long their active goals will take to farm out and what each upcoming day looks like, without needing to return to Today every day.

## Requirements

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

### Requirement: Raids Plan shares Today's campaign eligibility and location presentation

Every Raids Plan day SHALL use the same filtered battle catalog as Today, including only the currently active campaign event when one exists, and SHALL render scheduled nodes with the same shared Character Lookup campaign-location chips.

#### Scenario: Plan contains an event campaign location

- **GIVEN** live progress identifies one active campaign event
- **WHEN** Raids Plan calculates and renders its day schedules
- **THEN** only that event campaign can contribute event locations, and every rendered location uses the campaign icon, localized compact location label, node number, and raid count used by Today

### Requirement: Day 1 separates raided nodes from actionable nodes

Raids Plan's Day 1 ("Today") column SHALL present nodes whose real synced attempts today are explicitly zero in a separate section labelled "Raided", placed after the section of remaining nodes. There SHALL be no control to toggle this; it always applies. Nodes with positive remaining attempts or unknown attempt data SHALL stay in the main (actionable) section. Day 2 onward SHALL be unaffected, including when the same battle appears on multiple days. Nodes SHALL move between sections when refreshed attempt data changes, without user action.

Assumption: Real synced attempt counts describe today, whereas future-day simulated attempt caps describe a plan, not attempts already used.

This separation SHALL NOT change campaign eligibility, farming strategy, energy affordability, or the existing Today behavior. A node remaining in the main section SHALL NOT be presented as proof of full actionability.

#### Scenario: Exhausted nodes appear in a Raided section

- **GIVEN** the Day 1 column includes a node with zero real attempts left today and another with attempts remaining
- **WHEN** Raids Plan renders
- **THEN** the node with attempts remaining appears in the main section
- **AND** the exhausted node appears after it, under a "Raided" divider

#### Scenario: Later days are unaffected

- **GIVEN** Day 2's column includes a node the simulated plan has fully allocated for that day
- **WHEN** Raids Plan renders Day 2
- **THEN** that node remains in Day 2's column with no "Raided" section, because Day 2 has no real attempts-left data to act on

#### Scenario: The same battle appears today and on a future day

- **GIVEN** a battle appears in Day 1 and Day 2 and has zero real attempts remaining today
- **WHEN** Raids Plan renders
- **THEN** its Day-1 entry appears under "Raided" and its Day-2 entry appears normally

#### Scenario: Positive and unknown attempt counts stay actionable

- **GIVEN** Day 1 includes one node with positive remaining attempts and another with no real attempt data
- **WHEN** Raids Plan renders
- **THEN** both nodes appear in the main section, without treating unknown data as exhausted

#### Scenario: Refreshed attempt data moves nodes between sections

- **GIVEN** a Day-1 node has remaining attempts and is in the main section
- **WHEN** refreshed data reports zero remaining attempts for that node
- **THEN** the node moves to the "Raided" section
- **AND** if a subsequent refresh reports positive remaining attempts and the node is still in the plan, it returns to the main section

#### Scenario: No raided nodes means no Raided section

- **GIVEN** no Day-1 node has zero real attempts remaining
- **WHEN** Raids Plan renders
- **THEN** no "Raided" divider or empty section is shown

#### Scenario: Every Day-1 node is raided

- **GIVEN** Day 1 contains planned nodes and all have zero real attempts remaining today
- **WHEN** Raids Plan renders
- **THEN** the day card and its original summary remain visible with only the "Raided" section
- **AND** this is not presented as goal completion or an empty plan
- **AND** future days remain unchanged

### Requirement: Separating raided nodes preserves plan presentation and calculations

The split SHALL change only where Day-1 nodes are displayed. Nodes in both sections SHALL retain their material-oriented presentation and selected density, and keep their relative order within each section. Day and whole-plan summaries SHALL continue to describe the original calculated plan. The split SHALL NOT recalculate the plan, choose replacement nodes, or change energy totals, duration, or other plan totals. Resource and goal groups with no nodes in a section SHALL be omitted rather than leaving empty headers or card shells.

#### Scenario: Split preserves layout and totals

- **GIVEN** a plan contains exhausted and non-exhausted Day-1 nodes and a selected density
- **WHEN** Raids Plan renders
- **THEN** cards in both sections use the same presentation and density
- **AND** relative order is preserved within each section
- **AND** day and whole-plan totals are unchanged and no replacement nodes are scheduled

#### Scenario: Empty groups are omitted

- **GIVEN** all nodes within a resource group or goal group have zero real attempts remaining today
- **WHEN** Raids Plan renders
- **THEN** that group does not appear in the main section and appears only under "Raided"
- **AND** no empty header or card shell is left in the main section
