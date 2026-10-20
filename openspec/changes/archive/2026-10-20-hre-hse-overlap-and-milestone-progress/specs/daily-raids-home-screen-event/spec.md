## MODIFIED Requirements

### Requirement: The farm list covers the whole schedule and is filled to the energy budget

The HSE tab's main list, titled "Farm list for event points", SHALL be computed over the whole schedule, not from Today's picks. The scope SHALL be every Active goal in global priority order, whatever project Today has selected (Paused goals do not plan; a goal in several projects counts once), and the need SHALL be each goal's remaining need over all of its stages after the Plan's priority-ordered inventory allocation, summed per resource.

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

- **WHEN** the player changes the daily energy in the Planning Settings opened from the HSE tab
- **THEN** the budget and the farm list change accordingly

#### Scenario: Filter-then-pick

- **GIVEN** a Raids Filter excludes the highest-ratio location
- **THEN** it is not a candidate and the list is filled from the remaining passing locations; no material is reported as filtered out

### Requirement: The farm list handles empty cases

When the farm list has no rows it SHALL say why: no active goals in scope; no energy budget (the daily energy is 0 or all of it is spent, also when less energy is left than any candidate costs); nothing contributes (no point-earning, unlocked location with attempts left drops a resource the goals need), with a pointer to the top-10 lists below; or, when Raids Filters are active and candidates exist without them, that no location matches the Raids Filters, with a Reset action. The status line and both top-10 lists SHALL still render in every case.

#### Scenario: No active goals

- **GIVEN** there is no Active goal
- **THEN** the farm list says there are no active goals

#### Scenario: No energy

- **GIVEN** the planning-settings daily energy is fully spent today
- **THEN** the farm list says there is no energy left

#### Scenario: Nothing contributes

- **GIVEN** no point-earning location drops a resource the goals need
- **THEN** the farm list says so and points to the best locations below

#### Scenario: Filtered empty

- **GIVEN** a Raids Filter leaves no candidate that would exist without it
- **THEN** the farm list says no location matches the Raids Filters and offers Reset

### Requirement: The HSE tab handles states with no usable event

The HSE tab SHALL always be reachable. It SHALL render the selected instance (see "The HSE tab switches between Home Screen Event instances") as follows. Every instance with scoring data SHALL show its event details (`hse-event-details`) and, when running or upcoming and personal, its points projection (`hse-points-projection`). An upcoming instance SHALL show the event's name, its start date and a "starts in ..." countdown (and, when that event has a raid-point rule, the preview of "The HSE tab previews the next event"). A running instance without a raid-point rule SHALL show the event name and remaining time, its details and projection, without the farm list or any top-10 list. A past instance SHALL show the event name and "Ended on" with its end date and its details, and SHALL NOT show the projection, the farm list, any top-10 list, or the preview banner. With no running, upcoming or past instance it SHALL say no event is scheduled; with only past instances and no selection it SHALL say no event is scheduled and keep the switcher available. While the calendar loads it SHALL show a loading state; on a calendar read failure it SHALL show an inline message that event data could not be loaded and SHALL NOT block the page. A selected upcoming or past event SHALL NOT change Today, Bonus Raids, the Home raids widget or the Raids Plan.

#### Scenario: No event, next one known without a rule

- **GIVEN** no HSE is active and Psyker Boost (no raid-point rule) starts in 43 hours
- **THEN** the tab shows "Psyker Boost", its start date, the countdown, its details and its projection, and no farm list, top-10 lists or preview banner

#### Scenario: Nothing scheduled

- **GIVEN** no HSE instance in the calendar
- **THEN** the tab says no event is scheduled and the switcher has no options

#### Scenario: Only past instances

- **GIVEN** no running or upcoming HSE and past instances exist
- **THEN** the tab says no event is scheduled and the switcher lists the past instances

#### Scenario: Past event with a rule

- **GIVEN** the player selects Machine Hunt of 2026-10-02 to 2026-10-06
- **THEN** the tab shows "Machine Hunt", "Ended on" 6 October 2026 and its details, and no projection, farm list or top-10 lists

#### Scenario: Active event without raid points

- **GIVEN** Psyker Boost is active with 2 days left
- **THEN** the tab shows its name, remaining time, details and projection, and no raid lists

#### Scenario: Calendar read fails

- **THEN** the HSE tab shows an inline error and the rest of Dailies is unaffected

### Requirement: The HSE tab previews the next event

When the shown instance is upcoming and has a raid-point rule, whether it is the default (no event running) or one the player selected, the HSE tab SHALL show the farm list and the top-10 lists computed with that event's rule, SHALL label them as a preview (the event's name, that it is not live, when it starts, and that the lists use the energy left today), and SHALL keep the status line's countdown. With no selection a running event always wins over a preview. A preview SHALL NOT be shown for an upcoming event without a rule, nor when nothing is scheduled; those keep their existing states. The energy budget SHALL keep its meaning (planning-settings daily energy minus energy really spent today). A preview SHALL NOT change Today, Bonus Raids, Home or the Plan.

#### Scenario: Preview of the next event

- **GIVEN** no HSE is running and Warp Surge starts in 30 hours
- **THEN** the tab shows the status line countdown for Warp Surge, a banner saying it is a preview and not live, the farm list and both top-10 lists computed for Warp Surge's rule

#### Scenario: Preview of a later event while one runs

- **GIVEN** Machine Hunt is running and the player selects Warp Surge of 2026-11-05
- **THEN** the lists are computed for Warp Surge with the preview banner, and returning to the default shows Machine Hunt's live lists

#### Scenario: Live event wins by default

- **GIVEN** Machine Hunt is running, Warp Surge is upcoming and nothing is selected
- **THEN** the lists are computed for Machine Hunt and no preview banner is shown

#### Scenario: Next event without a rule

- **GIVEN** no HSE is running, nothing is selected and the next one is Faction Boost, followed later by Warp Surge
- **THEN** no lists or preview are shown, only the countdown for Faction Boost; selecting Warp Surge shows its preview

## REMOVED Requirements

### Requirement: The HSE tab header offers project, filters and planning settings

**Reason**: Severyn asked to remove the project selector, Raids Filters and Planning Settings controls from the HRE and HSE tabs.

**Migration**: Set the Raids Filters and Planning Settings on Today. The farm list and top-10 lists cover every active goal, whatever project Today has selected, keep using the persisted Raids Filters and the Planning Settings daily energy, and the empty-list Reset action still clears the Raids Filters.
