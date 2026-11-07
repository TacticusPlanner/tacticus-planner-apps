## ADDED Requirements

### Requirement: The HSE tab has raid list controls

When the raid lists are shown, the HSE tab SHALL show, above them and not in the title row, the Dailies project selector (with "All projects") and the Raids Filters action. The project selection SHALL be the one Dailies-wide, session-only selection shared with Today and the HRE tab. The farm list SHALL follow the selected project; the top-10 lists SHALL stay goal-independent. Both lists SHALL follow the Raids Filters. The tab SHALL NOT show the Planning Settings action.

#### Scenario: Controls above the raid lists

- **GIVEN** a rule-bearing HSE is running
- **THEN** the project selector and Raids Filters show above the farm list and the top-10 lists, and no Planning Settings action is shown

#### Scenario: Project shared across Dailies tabs

- **GIVEN** a project is picked on the HSE tab
- **WHEN** the player opens Today
- **THEN** Today shows the same project selected

## MODIFIED Requirements

### Requirement: The farm list covers the whole schedule and is filled to the energy budget

The HSE tab's main list, titled "Farm list for event points", SHALL be computed over the whole schedule, not from Today's picks. The scope SHALL be the Active goals of the Dailies project selected in the raid list controls (see "The HSE tab has raid list controls"), or every Active goal without one, in global priority order (Paused goals do not plan; a goal in several projects counts once), and the need SHALL be each goal's remaining need over all of its stages after the Plan's priority-ordered inventory allocation, summed per resource.

A location SHALL be a candidate only when all of these hold: (1) it earns event points for the active rule (points per raid greater than 0); (2) it is unlocked by the player's campaign progress, has an energy cost above 0 and has attempts left today (the synced attempts left when known, otherwise the node's daily cap, where a cap of 0 means unlimited); (3) it drops a resource that an in-scope goal still needs somewhere in the schedule, where a goal that pins its farm locations is served only by the pinned ones; (4) it passes the persisted Raids Filters, evaluated with the resource it drops.

The energy budget SHALL be the planning-settings daily energy minus the energy the player has really spent today across all campaigns, never below 0. Candidates SHALL be ordered by points per raid divided by energy cost, descending; ties by points per raid descending, then the best (lowest) priority among the goals the location serves, then battle id ascending. The list SHALL be filled in that order: each location gets as many raids as the attempts left, the remaining budget and the remaining need allow (the need is reduced by what earlier locations already farm, so two locations dropping the same resource do not farm it past the need); a location that does not fit is skipped and later candidates are still considered. Locations with no raids SHALL NOT be shown. The day total badges SHALL show the sum of row points and the sum of row energy, and the energy total SHALL never exceed the budget.

#### Scenario: Only point-earning, goal-contributing locations

- **GIVEN** five unlocked locations: one with 0 points, one that drops nothing any goal needs, one whose attempts are all used today, and two that qualify
- **THEN** the list shows only the two that qualify

#### Scenario: Whole schedule, not Today's picks

- **GIVEN** a goal needs a material in a later stage that Today's plan does not farm yet, and a point-earning node drops it
- **THEN** that node is a candidate

#### Scenario: Ordering and tie-breaks

- **GIVEN** location A with 12 points at energy 6 (ratio 2) and B with 15 points at energy 10 (ratio 1.5)
- **THEN** A is listed before B; with equal ratio the location with more points per raid is first, then the better goal priority, then the lower battle id

#### Scenario: Filled until the budget is used

- **GIVEN** 100 energy left today and locations costing 30 each ordered by ratio
- **THEN** the first three get raids (90 energy), the energy badge shows 90, and the total never exceeds 100

#### Scenario: Skipped location does not stop the fill

- **GIVEN** 20 energy left, the best-ratio location costs 30 and the next costs 10
- **THEN** the 30-energy location is skipped and the 10-energy one is listed

#### Scenario: Spent energy and used attempts reduce the list

- **GIVEN** daily energy 240, 90 energy really spent today, and 2 of a node's 3 attempts used
- **THEN** the budget is 150 and that node gets at most 1 raid

#### Scenario: Raids capped by need

- **GIVEN** a node would drop the needed material at 1 per raid and 3 are still needed
- **THEN** it is given 3 raids at most, even with budget left

#### Scenario: Changing daily energy changes the list

- **WHEN** the player changes the daily energy in the Planning Settings opened from Today
- **THEN** the budget and the farm list change accordingly

#### Scenario: Filter-then-pick

- **GIVEN** a Raids Filter excludes the highest-ratio location
- **THEN** it is not a candidate and the list is filled from the remaining passing locations; no material is reported as filtered out

#### Scenario: A selected project narrows the farm list

- **GIVEN** the project "Necrons" is selected in the raid list controls (or on Today)
- **THEN** the farm list serves only that project's Active goals, and the top-10 lists are unchanged
