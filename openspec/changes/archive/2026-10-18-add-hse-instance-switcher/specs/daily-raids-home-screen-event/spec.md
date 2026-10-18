## ADDED Requirements

### Requirement: The HSE tab switches between Home Screen Event instances

The HSE tab SHALL offer an event switcher listing every Home Screen Event instance in the game-events calendar (authored occurrences and projected placeholders, deduplicated), grouped as Running (window contains now), Upcoming (starts after now, ascending by start) and Past (ended, newest first). Each option SHALL show the localized event name and its start and end dates in the player's locale and timezone, and, for an event with a target parameter (Faction Boost), the localized target. Previous and Next buttons SHALL step to the instance with the closest earlier or later start (ties by definition id) and SHALL be disabled at either end of the list.

With no instance selected the tab SHALL show the default instance: the running HSE chosen by the existing overlap rule, else the next upcoming HSE, else the "no event is scheduled" state. The selection SHALL be held in the URL search parameter `event` of the HSE tab, keyed by the occurrence id or, for a projected placeholder, by definition id and start; it SHALL survive a reload, SHALL NOT be shared with other Dailies tabs, and a key that no longer resolves SHALL fall back to the default and be removed from the URL. A key SHALL only be judged against a calendar that has synced at least once: until then the tab SHALL stay loading and keep the parameter. Selecting the default instance SHALL remove the parameter. A pinned selection SHALL stay selected when its event starts or ends; only its status changes.

#### Scenario: Default is the running event

- **GIVEN** Psyker Boost runs 2026-10-19T08:00Z to 2026-10-23T08:00Z and it is 2026-10-20T12:00Z
- **WHEN** the player opens Dailies > HSE without a selection
- **THEN** the switcher shows Psyker Boost and the tab shows it as running

#### Scenario: Default is the next event when none runs

- **GIVEN** it is 2026-10-17T12:48Z, Against the Tide ended 2026-10-17T08:00Z and Psyker Boost starts 2026-10-19T08:00Z
- **THEN** the switcher shows Psyker Boost and the tab shows its countdown

#### Scenario: Step to the event after next

- **GIVEN** Psyker Boost (starts 2026-10-19) is shown, and Faction Focus (`hse-faction-focus`) and Operation Imperator (`hse-global-operation-imperator`) both start 2026-10-26T08:00Z
- **WHEN** the player presses Next
- **THEN** Faction Focus is shown (same start, lower definition id), and pressing Next again shows Operation Imperator

#### Scenario: Overlapping running events are both reachable

- **GIVEN** Operation Imperator and Faction Focus both run on 2026-10-27
- **THEN** both are listed under Running and either can be selected

#### Scenario: Look back at a past event

- **WHEN** the player selects Against the Tide (2026-10-10 to 2026-10-17) under Past
- **THEN** the URL carries its key, and a reload shows the same instance

#### Scenario: Stale key

- **GIVEN** the URL carries an `event` key that is not in the calendar
- **THEN** the default instance is shown and the parameter is removed

#### Scenario: Shared link on a fresh device

- **GIVEN** a player opens a shared HSE link with an `event` key on a device whose calendar has not synced yet
- **THEN** the tab shows its loading state and keeps the parameter until the calendar has synced, then shows that instance

#### Scenario: Other tabs are unaffected

- **GIVEN** a past instance is selected on HSE
- **WHEN** the player opens Today and returns to HSE from the tab bar
- **THEN** HSE shows the default instance

#### Scenario: On desktop

- **WHEN** the viewport is at or above 768px
- **THEN** the switcher with its Previous and Next buttons sits on the title row

#### Scenario: On mobile

- **WHEN** the viewport is below 768px
- **THEN** the switcher takes its own full-width row below the title, with the Previous and Next buttons at its ends

### Requirement: The HSE tab has an onboarding tour

The HSE tab SHALL register a Joyride tour with desktop and mobile steps covering the event switcher, the status line and, when shown, the farm list and top-10 lists, with step copy in en, de, es and fr.

#### Scenario: Tour covers the switcher

- **WHEN** the player starts the tour on the HSE tab
- **THEN** a step highlights the event switcher and explains that other upcoming and past events can be opened

## MODIFIED Requirements

### Requirement: The HSE tab handles states with no usable event

The HSE tab SHALL always be reachable. It SHALL render the selected instance (see "The HSE tab switches between Home Screen Event instances") as follows. An upcoming instance SHALL show the event's name, its start date and a "starts in ..." countdown (and, when that event has a raid-point rule, the preview of "The HSE tab previews the next event"). A running instance without a raid-point rule SHALL show the event name and remaining time and say it does not earn points from campaign raiding, without the farm list or any top-10 list. A past instance SHALL show the event name and "Ended on" with its end date, and SHALL NOT show the farm list, any top-10 list, the preview banner or the raid header controls, whether or not it has a rule. With no running, upcoming or past instance it SHALL say no event is scheduled; with only past instances and no selection it SHALL say no event is scheduled and keep the switcher available. While the calendar loads it SHALL show a loading state; on a calendar read failure it SHALL show an inline message that event data could not be loaded and SHALL NOT block the page. A selected upcoming or past event SHALL NOT change Today, Bonus Raids, the Home raids widget or the Raids Plan.

#### Scenario: No event, next one known without a rule

- **GIVEN** no HSE is active and Faction Boost (no raid-point rule) starts in 30 hours
- **THEN** the tab shows "Faction Boost", its start date and the countdown, and no farm list, top-10 lists, preview banner or header controls

#### Scenario: Nothing scheduled

- **GIVEN** no HSE instance in the calendar
- **THEN** the tab says no event is scheduled and the switcher has no options

#### Scenario: Only past instances

- **GIVEN** no running or upcoming HSE and past instances exist
- **THEN** the tab says no event is scheduled and the switcher lists the past instances

#### Scenario: Past event with a rule

- **GIVEN** the player selects Machine Hunt of 2026-10-02 to 2026-10-06
- **THEN** the tab shows "Machine Hunt", "Ended on" 6 October 2026, and no farm list, top-10 lists or raid header controls

#### Scenario: Active event without raid points

- **GIVEN** Faction Boost is active with 3 days left
- **THEN** the tab shows its name and remaining time and that it does not earn points from campaign raiding

#### Scenario: Calendar read fails

- **THEN** the HSE tab shows an inline error and the rest of Dailies is unaffected

### Requirement: The HSE tab previews the next event

When the shown instance is upcoming and has a raid-point rule, whether it is the default (no event running) or one the player selected, the HSE tab SHALL show the farm list and the top-10 lists (and the project selector, Raids Filters and Planning Settings actions) computed with that event's rule, SHALL label them as a preview (the event's name, that it is not live, when it starts, and that the lists use the energy left today), and SHALL keep the status line's countdown. With no selection a running event always wins over a preview. A preview SHALL NOT be shown for an upcoming event without a rule, nor when nothing is scheduled; those keep their existing states. The energy budget SHALL keep its meaning (planning-settings daily energy minus energy really spent today). A preview SHALL NOT change Today, Bonus Raids, Home or the Plan.

#### Scenario: Preview of the next event

- **GIVEN** no HSE is running and Warp Surge starts in 30 hours
- **THEN** the tab shows the status line countdown for Warp Surge, a banner saying it is a preview and not live, the farm list and both top-10 lists computed for Warp Surge's rule, and the header actions

#### Scenario: Preview of a later event while one runs

- **GIVEN** Machine Hunt is running and the player selects Warp Surge of 2026-11-05
- **THEN** the lists are computed for Warp Surge with the preview banner, and returning to the default shows Machine Hunt's live lists

#### Scenario: Live event wins by default

- **GIVEN** Machine Hunt is running, Warp Surge is upcoming and nothing is selected
- **THEN** the lists are computed for Machine Hunt and no preview banner is shown

#### Scenario: Next event without a rule

- **GIVEN** no HSE is running, nothing is selected and the next one is Faction Boost, followed later by Warp Surge
- **THEN** no lists or preview are shown, only the countdown for Faction Boost; selecting Warp Surge shows its preview
