## MODIFIED Requirements

### Requirement: The HSE tab handles states with no usable event

The HSE tab SHALL always be reachable. It SHALL render the selected instance (see "The HSE tab switches between Home Screen Event instances") as follows. Every instance with scoring data SHALL show its event details (`hse-event-details`) and, when running or upcoming and personal, its points projection (`hse-points-projection`). An upcoming instance SHALL show the event's name, its start date and a "starts in ..." countdown (and, when that event has a raid-point rule, the preview of "The HSE tab previews the next event"). A running instance without a raid-point rule SHALL show the event name and remaining time, its details and projection, without the farm list or any top-10 list. A past instance SHALL show the event name and "Ended on" with its end date and its details, and SHALL NOT show the projection, the farm list, any top-10 list, or the preview banner. With no running, upcoming or past instance it SHALL say no event is scheduled; with only past instances and no selection it SHALL say no event is scheduled and keep the switcher available. While the calendar loads it SHALL show a loading state; on a calendar read failure it SHALL show an inline message that event data could not be loaded and SHALL NOT block the page.

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

When the shown instance is upcoming and has a raid-point rule, whether it is the default (no event running) or one the player selected, the HSE tab SHALL show the farm list and the top-10 lists computed with that event's rule, SHALL label them as a preview (the event's name, that it is not live, when it starts, and that the lists use the energy left today), and SHALL keep the status line's countdown. A preview SHALL NOT be shown for an upcoming event without a rule, nor when nothing is scheduled; those keep their existing states. The energy budget SHALL keep its meaning (planning-settings daily energy minus energy really spent today).

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
