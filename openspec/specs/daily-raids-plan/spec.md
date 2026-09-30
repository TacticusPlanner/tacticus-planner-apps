# daily-raids-plan Specification

## Purpose

Shows a player the forward-looking, day-by-day continuation of the same schedule Today produces — V1's "Daily Raids" section, ported read-only — so they can see how long their active goals will take to farm out and what each upcoming day looks like, without needing to return to Today every day.

## Requirements

### Requirement: Raids Plan shares Today's selected project

Raids Plan SHALL use the same project selection as Today (one selection shared across both Raids sub-tabs, defaulting to all goals) rather than maintaining an independent selector. Switching the project on either sub-tab SHALL recompute both; with no project selected both show the account-wide plan.

#### Scenario: Selecting a project on Today updates Raids Plan too

- **GIVEN** the user is on Today with all goals selected
- **WHEN** the user selects project B and switches to Raids Plan
- **THEN** Raids Plan shows project B's Active goals in global order without a separate selection

#### Scenario: Default is all goals

- **WHEN** Raids Plan loads with no prior selection this session
- **THEN** it shows the account-wide plan and the selector reads all goals

#### Scenario: Raids Plan mirrors Today's project-list failure state

- **GIVEN** project-list loading fails but global goals load
- **WHEN** Raids Plan loads
- **THEN** it renders the global schedule and does not show a project-list error

#### Scenario: Raids Plan mirrors Today's empty-project state

- **GIVEN** no projects are available but global goals load
- **WHEN** Raids Plan loads
- **THEN** it derives its empty or populated state from Active goals, not project count

### Requirement: Raids Plan includes Today

Raids Plan SHALL compute its schedule from the same Active goals (account-wide, or the selected project's) in canonical global priority order and the same engine run as Today. It SHALL render the complete sequence beginning with Day 1 labeled "Today", followed by Day 2 onward.

#### Scenario: Day columns start with Today

- **GIVEN** an account-wide in-scope farmable schedule
- **WHEN** Raids Plan loads
- **THEN** its first day is Today and matches the Today tab's schedule

#### Scenario: Everything resolves within Day 1

- **GIVEN** all in-scope farmable need resolves within Day 1
- **WHEN** Raids Plan loads
- **THEN** it still renders Today as the complete one-day plan

### Requirement: Raids Plan's per-day summary stats

Each day card header SHALL show: the day title ("Today" for Day 1, "Day N" otherwise); that day's calendar date, localized, where Day 1 is today's date and Day N is N - 1 days later; that day's total energy spent out of `planningSettings.dailyEnergy`, and that day's total raid-attempt count (the sum of raids performed across every node and goal that day), each as a compact icon pill; a daily-energy fill bar; and the portraits of the distinct units whose goals have actionable cells that day, in goal-priority order.

#### Scenario: A day's energy total reflects only that day's spend

- **GIVEN** Day N's schedule spends less than the full daily energy budget (all in-scope needs for that day are covered early)
- **WHEN** Raids Plan loads
- **THEN** that day's energy pill shows its actual energy spent out of the budget, not the full budget

#### Scenario: A day's raid-attempt count sums every goal's raids that day

- **GIVEN** two different goals each perform raids on Day N
- **WHEN** Raids Plan loads
- **THEN** that day's raid-attempt pill shows the combined total across both goals, not just one

#### Scenario: Energy bar fill and color

- **GIVEN** `planningSettings.dailyEnergy` is 738 and Day 2 spends 700 energy, Day 3 spends 500
- **WHEN** Raids Plan loads
- **THEN** Day 2's bar is filled 700 / 738 = 94.9% and shown in the "not full" (warning) color, because it is below the 95% threshold ported from V1
- **AND** Day 3's bar is filled 500 / 738 = 67.8% in the warning color
- **AND** a day spending 738 (100%) or more is capped at 100% fill and shown in the success color

#### Scenario: Calendar date per day

- **GIVEN** today is 30 September 2026
- **WHEN** Raids Plan loads
- **THEN** Today shows 30 September, Day 2 shows 1 October, and Day 3 shows 2 October, formatted for the active language

#### Scenario: Day unit row excludes units with only raided cells

- **GIVEN** on Day 1 every cell for unit A is in the Raided section and unit B has an actionable cell
- **WHEN** Raids Plan renders Day 1
- **THEN** the day's unit row shows unit B and not unit A

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

### Requirement: Raids Plan shares Today's campaign eligibility and location presentation

Every Raids Plan day SHALL use the same filtered battle catalog as Today, including only the currently active campaign event when one exists. Raids Plan SHALL NOT render inline location chips; each scheduled node SHALL instead be listed in its material cell's tooltip using the same localized campaign name and node label as Today.

#### Scenario: Plan contains an event campaign location

- **GIVEN** live progress identifies one active campaign event
- **WHEN** Raids Plan calculates and renders its day schedules
- **THEN** only that event campaign can contribute event locations, and a cell scheduled on an event node lists it in its tooltip with the localized campaign name, node number, and raid count used by Today

### Requirement: Raids Plan uses an icon-led horizontal day strip

Raids Plan SHALL use the same unit portraits, resource art, and energy/raid-attempt icon language as Today. Its day columns SHALL be presented as a single horizontal strip of fixed-width day cards (V1's Daily Raids day strip) on both desktop and mobile, scrolled horizontally rather than wrapped into rows.

#### Scenario: Desktop plan renders a horizontal day strip

- **WHEN** Raids Plan is viewed at or above the 768px desktop breakpoint
- **THEN** the whole-plan summary expands across the available content width
- **AND** the day cards render side by side in one horizontally scrollable row, each between a readable minimum and a comfortable maximum width, without wrapping onto a second row

#### Scenario: Mobile plan uses the same horizontal strip

- **WHEN** Raids Plan is viewed below the 768px mobile breakpoint
- **THEN** the day cards render in the same single horizontally scrollable row, each card sized to fit within the viewport width with the next card's edge visible as a scroll affordance
- **AND** the whole-plan summary keeps all its labels and totals

#### Scenario: Strip can be scrolled by dragging or native scrolling

- **GIVEN** the day strip is wider than its container
- **WHEN** the user drags it with a mouse, swipes it by touch, or uses a scrollbar, trackpad, or keyboard scrolling
- **THEN** the strip scrolls horizontally, and a drag that moves the strip does not activate the control under the pointer

### Requirement: Raids Plan's per-day material schedule

Each rendered day card SHALL show that day's own raid-attempt schedule, computed by the same shared engine (priority-ordered shared inventory carried forward from prior days, per-battle daily-attempt caps shared across every goal that day, the same `planningSettings.dailyEnergy` budget) with no change to the engine's goal-priority farm order. The schedule SHALL be presented material-first: one cell per material scheduled that day, merging every goal's entries for that material into one cell, in a grid of three cells per row.

Assumption: the engine allocates shared inventory to goals in priority order, so per-goal owned amounts for one material never double-count the same held item.

#### Scenario: A material needed by two goals on the same day is one cell

- **GIVEN** Day N schedules raids for Purity Seal (`upgArmC001`) toward both a Marneus Calgar Stone I → Stone II goal (priority 1) and a Chief Librarian Tigurius Stone I → Stone II goal (priority 2)
- **WHEN** Raids Plan renders Day N
- **THEN** Day N shows exactly one Purity Seal cell, and that cell shows both units' portraits

#### Scenario: Merged cell progress sums each goal's allocation

- **GIVEN** the same two goals each need 1 Purity Seal and the player holds 1 Purity Seal at the start of Day N
- **WHEN** Raids Plan renders Day N
- **THEN** the engine allocates the held Purity Seal to Calgar (priority 1): Calgar owned 1 / target 1, Tigurius owned 0 / target 1
- **AND** the merged cell's badge reads owned (1 + 0 = 1) / target (1 + 1 = 2), i.e. `1/2`, in item count units anchored at the start of Day N

#### Scenario: Cell order follows goal priority

- **GIVEN** Day N schedules materials for goals of different priorities
- **WHEN** Raids Plan renders Day N
- **THEN** actionable cells are ordered by the highest-priority goal each material serves, then by the existing per-goal resource order, and a material first appears where its highest-priority goal would place it

#### Scenario: A later day's inventory reflects earlier days' consumption

- **GIVEN** an upgrade needed on Day 3 was already partially consumed from shared inventory by Day 1 and Day 2's higher-priority goals
- **WHEN** Raids Plan loads
- **THEN** Day 3's cell for that upgrade reflects only what's left after Day 1 and Day 2, not the original combined need

### Requirement: Raids Plan pages days 3-at-a-time from the strip end

Raids Plan SHALL initially render only the first 3 day cards (Today, Day 2, Day 3), with a "Show all days" control that reveals the remaining days when more exist. This control SHALL render at the end of the day strip, after the last visible day card, on both desktop and mobile.

#### Scenario: More than 3 days truncates with a Show all control

- **GIVEN** the plan takes more than 3 days total
- **WHEN** Raids Plan loads
- **THEN** only Today, Day 2, and Day 3 are shown, followed at the end of the strip by a "Show all days" control, and later days are not rendered until it is activated

#### Scenario: Show all days reveals the rest

- **GIVEN** Raids Plan is showing its truncated view with a "Show all days" control
- **WHEN** the user activates it
- **THEN** every remaining day card is revealed in order and the control is no longer shown

#### Scenario: 3 or fewer total days needs no truncation

- **GIVEN** the plan takes 3 days or fewer total
- **WHEN** Raids Plan loads
- **THEN** all day cards are shown and no "Show all days" control is displayed

### Requirement: Separating raided materials preserves plan presentation and calculations

The Raided split SHALL change only where cells are displayed. Cells in both sections SHALL use the same material-cell presentation and keep their relative order within each section. Day and whole-plan summaries SHALL continue to describe the original calculated plan. The split SHALL NOT recalculate the plan, choose replacement nodes, or change energy totals, duration, or other plan totals. A section with no cells SHALL be omitted rather than leaving an empty divider.

#### Scenario: Split preserves layout and totals

- **GIVEN** a day contains Raided and actionable cells
- **WHEN** Raids Plan renders
- **THEN** cells in both sections use the same presentation
- **AND** relative order is preserved within each section
- **AND** day and whole-plan totals are unchanged and no replacement nodes are scheduled

#### Scenario: Every cell is raided

- **GIVEN** Day 1 contains planned cells and all of them are Raided
- **WHEN** Raids Plan renders
- **THEN** the day card and its original summary remain visible with only the "Raided" section
- **AND** this is not presented as goal completion or an empty plan

### Requirement: Day cards have a fixed height with a scrolling grid

Each day card SHALL be one fixed height across every card, with its header always visible and its material grid scrolling vertically inside the card when the grid is taller than the remaining space. Day cards SHALL always show their material grid; there SHALL be no control to collapse it.

#### Scenario: Long day scrolls inside its card

- **GIVEN** Day N has more material cells than fit below its header
- **WHEN** Raids Plan renders
- **THEN** Day N's card is the same height as its neighbours, its header stays in view, and its grid scrolls within the card

#### Scenario: Short day keeps the common height

- **GIVEN** Day N has only three cells
- **WHEN** Raids Plan renders
- **THEN** Day N's card has the same height as the other day cards

#### Scenario: Grids mount as cards approach the viewport

- **GIVEN** all days are revealed and most are off-screen in the strip
- **WHEN** Raids Plan renders
- **THEN** every day card's header renders immediately, and a card's grid renders no later than when the card scrolls within about one card width of the visible area, after which it stays rendered

### Requirement: Material cells show progress and related units

Each material cell SHALL show the material's art, an `owned/target` badge (the merged progress at the start of that day, in item count units, anchored to each goal's current progression), and the portraits of up to two distinct units whose goals the material serves that day, followed by a `+N` count when more units share it. The badge SHALL use a success style when owned is at least target. Each cell SHALL be keyboard-focusable and have an accessible name containing the material name. Activating a cell SHALL NOT open any dialog.

#### Scenario: Overflow of related units

- **GIVEN** a Day N material cell serves goals for four distinct units
- **WHEN** Raids Plan renders
- **THEN** the cell shows the first two units' portraits in goal-priority order followed by `+2`

#### Scenario: A unit with two goals needing the material counts once

- **GIVEN** a unit has a rank goal and an ascend goal that both need the same material on Day N
- **WHEN** Raids Plan renders
- **THEN** the cell shows that unit's portrait once and its progress includes both goals' amounts

### Requirement: Material cell tooltip lists units and nodes

Hovering or focusing a material cell, or tapping it on a touch device, SHALL show a tooltip containing the localized material name, the localized names of the units it serves that day, and up to four scheduled nodes as "campaign node × raids", followed by "+N more" when the cell is scheduled on more than four nodes.

#### Scenario: Tooltip on desktop

- **GIVEN** a Purity Seal cell scheduled on 5 nodes for Calgar and Tigurius
- **WHEN** the user hovers or keyboard-focuses the cell at or above the 768px breakpoint
- **THEN** the tooltip shows "Purity Seal", "Marneus Calgar, Chief Librarian Tigurius", the first four nodes each with its raid count, and "+1 more"

#### Scenario: Tooltip on mobile

- **WHEN** the user taps a material cell below the 768px breakpoint
- **THEN** the same tooltip content is shown, and tapping elsewhere dismisses it

### Requirement: Every day separates raided materials

Every day card SHALL present its Raided cells in a separate section labelled "Raided", placed after the actionable cells. A cell SHALL be Raided on any day when its merged owned amount is at least its merged target at the start of that day. On Day 1 only, a cell SHALL also be Raided when every node it is scheduled on has real synced attempts left today of exactly zero. Nodes with positive or unknown real attempts SHALL NOT count as exhausted. There SHALL be no control to toggle this.

Assumption: real synced attempt counts describe today only; future days have no real attempt data, so the exhausted-node condition applies to Day 1 only.

#### Scenario: Day 1 cell with every node exhausted is Raided

- **GIVEN** Day 1 has a cell scheduled on two nodes, both with zero real attempts left today, and another cell with attempts remaining
- **WHEN** Raids Plan renders
- **THEN** the cell with attempts remaining appears in the actionable section
- **AND** the exhausted cell appears after it, under a "Raided" divider

#### Scenario: Partially exhausted cell stays actionable

- **GIVEN** a Day 1 cell is scheduled on two nodes, one with zero real attempts left and one with unknown attempt data
- **WHEN** Raids Plan renders
- **THEN** the cell stays in the actionable section

#### Scenario: Future day cell already satisfied is Raided

- **GIVEN** on Day 4 a material cell's merged progress at the start of the day is 12/12
- **WHEN** Raids Plan renders Day 4
- **THEN** that cell appears under Day 4's "Raided" divider with a success-styled badge

#### Scenario: Future day ignores real attempts

- **GIVEN** a battle has zero real attempts left today and is scheduled on Day 1 and Day 2
- **WHEN** Raids Plan renders
- **THEN** its Day 1 cell is Raided if every Day 1 node is exhausted, and its Day 2 cell stays actionable unless Day 2's merged progress already meets its target

#### Scenario: Refreshed attempt data moves cells between sections

- **GIVEN** a Day 1 cell is actionable
- **WHEN** refreshed data reports zero remaining attempts for every node it is scheduled on
- **THEN** the cell moves to the "Raided" section without user action, and returns if later data reports positive attempts

### Requirement: Character filter bar highlights a unit across days

Above the day strip, Raids Plan SHALL show a bar of the distinct unit portraits that have at least one actionable cell anywhere in the full plan (including days not yet revealed), in goal-priority order. Selecting a portrait SHALL mark it selected, dim every cell on every day card that does not serve that unit, and show controls to jump to that unit's first and last scheduled day (a single control when both are the same day). Selecting the selected portrait again SHALL clear the filter. Each portrait SHALL be a toggle button with the unit's localized name as its accessible name and a pressed state.

#### Scenario: Selecting a unit dims unrelated cells

- **GIVEN** Calgar and Tigurius both have cells in the plan
- **WHEN** the user selects Calgar in the filter bar
- **THEN** on every day card, cells not serving Calgar are dimmed and cells serving Calgar are not
- **AND** selecting Calgar again restores every cell

#### Scenario: Jump to a unit's last day beyond the revealed days

- **GIVEN** only three days are revealed and Tigurius's last scheduled day is Day 9
- **WHEN** the user selects Tigurius and activates the "Day 9" jump
- **THEN** all days are revealed and the strip scrolls so that Day 9's card is in view

#### Scenario: Jumps on mobile

- **GIVEN** Raids Plan is viewed below the 768px breakpoint
- **WHEN** the user selects a unit and activates its first-day jump
- **THEN** the strip scrolls so that day's card is in view, and the filter bar wraps without horizontal page overflow

#### Scenario: No filter bar without scheduled units

- **GIVEN** the plan has no actionable cells on any day
- **WHEN** Raids Plan renders
- **THEN** no filter bar is shown
