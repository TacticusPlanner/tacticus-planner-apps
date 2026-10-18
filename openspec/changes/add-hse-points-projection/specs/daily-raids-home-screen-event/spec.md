## MODIFIED Requirements

### Requirement: The HSE tab handles states with no usable event

The HSE tab SHALL always be reachable. It SHALL render the selected instance (see "The HSE tab switches between Home Screen Event instances") as follows. Every instance with scoring data SHALL show its event details (`hse-event-details`) and, when running or upcoming and personal, its points projection (`hse-points-projection`). An upcoming instance SHALL show the event's name, its start date and a "starts in ..." countdown (and, when that event has a raid-point rule, the preview of "The HSE tab previews the next event"). A running instance without a raid-point rule SHALL show the event name and remaining time, its details and projection, without the farm list or any top-10 list. A past instance SHALL show the event name and "Ended on" with its end date and its details, and SHALL NOT show the projection, the farm list, any top-10 list, the preview banner or the raid header controls. With no running, upcoming or past instance it SHALL say no event is scheduled; with only past instances and no selection it SHALL say no event is scheduled and keep the switcher available. While the calendar loads it SHALL show a loading state; on a calendar read failure it SHALL show an inline message that event data could not be loaded and SHALL NOT block the page. A selected upcoming or past event SHALL NOT change Today, Bonus Raids, the Home raids widget or the Raids Plan.

#### Scenario: No event, next one known without a rule

- **GIVEN** no HSE is active and Psyker Boost (no raid-point rule) starts in 43 hours
- **THEN** the tab shows "Psyker Boost", its start date, the countdown, its details and its projection, and no farm list, top-10 lists, preview banner or raid header controls

#### Scenario: Nothing scheduled

- **GIVEN** no HSE instance in the calendar
- **THEN** the tab says no event is scheduled and the switcher has no options

#### Scenario: Only past instances

- **GIVEN** no running or upcoming HSE and past instances exist
- **THEN** the tab says no event is scheduled and the switcher lists the past instances

#### Scenario: Past event with a rule

- **GIVEN** the player selects Machine Hunt of 2026-10-02 to 2026-10-06
- **THEN** the tab shows "Machine Hunt", "Ended on" 6 October 2026 and its details, and no projection, farm list, top-10 lists or raid header controls

#### Scenario: Active event without raid points

- **GIVEN** Psyker Boost is active with 2 days left
- **THEN** the tab shows its name, remaining time, details and projection, and no raid lists

#### Scenario: Calendar read fails

- **THEN** the HSE tab shows an inline error and the rest of Dailies is unaffected

### Requirement: HSE tab layout and localization

The tab SHALL order its sections as: status line, event details, points projection, then (for a rule-bearing event) the raid lists. On desktop (at or above 768px) the event details and the projection SHALL sit side by side above the raid lists, and the farm list SHALL sit beside a column holding the overall top-10 list and, when shown, the event-campaign top-10 list below it; on mobile every section SHALL stack in the order above, with the raid lists in the order farm list, overall top 10, event-campaign top 10. The tab label SHALL be the localized abbreviation of Home Screen Event in en, de, es and fr, with a description that spells it out, and all HSE-tab strings, description templates and the event names for every definition id SHALL exist in all four locales.

#### Scenario: Mobile layout

- **WHEN** the viewport is below 768px and a rule-bearing HSE is active
- **THEN** the details, projection, farm list, overall top 10 and event-campaign top 10 stack in that order

#### Scenario: Desktop layout

- **WHEN** the viewport is at or above 768px and Warp Surge is active
- **THEN** details and projection share a row above the farm list and the top-10 column

#### Scenario: Locale coverage

- **WHEN** translation-coverage tests run
- **THEN** every new key exists in en, de, es and fr
