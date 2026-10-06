## Purpose

Defines the Home page Home Screen Events card shown beside Token Availability: which events it lists (live first, then upcoming, up to two), whole-card navigation to the HSE tab, distinct loading, error and empty states, and its Home tour step.

## Requirements

### Requirement: Home renders a Home Screen Events card beside Token Availability

The authenticated home page SHALL render a card titled "Events" (localized), distinct from and not replacing the "Events calendar". The card covers Home Screen Events and Legendary Events. At or above the 768px (`md`) breakpoint it SHALL share one row with the Token Availability card, the two cards side by side, with the Token Availability content wrapping to fit its narrower card. Below 768px it SHALL stack directly after the Token Availability card. The events calendar remains the last section.

#### Scenario: Desktop shares a row with Token Availability

- **WHEN** a signed-in user opens `/home` at or above 768px
- **THEN** Token Availability and Events are side by side in one row above the Your Projects/Daily Raids row, with all token entries still visible (wrapping as needed)

#### Scenario: Mobile stacks after Token Availability

- **WHEN** a signed-in user opens `/home` below 768px
- **THEN** Events renders full width directly after Token Availability and before Your Projects

#### Scenario: Calendar is not the same card

- **WHEN** the home page renders
- **THEN** both the "Events" card and the "Events calendar" are present and separately titled

### Requirement: The card lists live events first, then upcoming events, up to three rows

The card SHALL show at most three rows drawn from two sources: Home Screen Events from the game-events calendar (the same selection as the HSE tab) and Legendary Events from the catalog `lres` dataset with the lifecycle defined by `legendary-events-hub`. Live rows come first (a live Home Screen Event, then a live Legendary Event), each marked LIVE (visible text, not colour alone) with an "ends in …" relative countdown. Remaining slots are filled by upcoming events of both types in ascending start order, each with its start as a local date and time and a relative "starts in …" countdown. Each row shows its event type icon and accent colour; a live Legendary Event row also shows "Event N of 3" and synced points when the synced entry exists. Activity and ordering are decided by UTC instants (start inclusive, end exclusive); the device timezone only affects the displayed start text.

Assumptions:

- At most one Home Screen Event and at most one Legendary Event are live at a time.
- Local time is the device timezone; event windows stay UTC.

#### Scenario: Live event and one upcoming

- **GIVEN** Machine Hunt is live (ends 2026-10-05T08:00Z), Lysander's run is live (ends 2026-10-06T00:00Z), Training Rush starts 2026-10-09T08:00Z and Uthar's run starts 2026-10-11T00:00Z
- **WHEN** the card renders at 2026-10-03T12:00Z
- **THEN** it shows Machine Hunt (LIVE), Lysander (LIVE, with run and points when synced), then Training Rush with its local start and "starts in …", and Uthar is not shown

#### Scenario: Cap of two

- **GIVEN** one live Home Screen Event, one live Legendary Event and three upcoming events
- **WHEN** the card renders
- **THEN** only the two live rows and the earliest upcoming event are shown

#### Scenario: Only upcoming events

- **GIVEN** nothing is live, Uthar starts 2026-10-04T00:00Z and Training Rush starts 2026-10-09T08:00Z
- **WHEN** the card renders
- **THEN** Uthar is first and Training Rush second, neither marked LIVE

#### Scenario: Timezone changes display only

- **GIVEN** an event starts at 2026-10-02T08:00:00Z
- **WHEN** the card renders with the device in `Pacific/Honolulu` and again in `UTC`
- **THEN** the displayed local start differs by the offset, while which event is live or upcoming is identical

### Requirement: Distinct loading, error and empty states

The card SHALL show a distinct loading body while either read is pending, a distinct error body when both reads failed, and a distinct empty body when the reads succeeded but no event of either type is live or upcoming ("no events scheduled"), with inline links to `/dailies/hse` and `/events/legendary-events`. When exactly one source fails the rows of the other source SHALL still render, with an inline "could not load <type>" note for the failed one.

#### Scenario: Loading

- **WHEN** the calendar read or the catalog read has not resolved
- **THEN** the card shows its loading body

#### Scenario: Read failure

- **WHEN** both the calendar read and the catalog read fail
- **THEN** the card shows its error body, and Home still renders

#### Scenario: One source fails

- **GIVEN** the calendar read failed and the catalog read succeeded with Lysander upcoming
- **WHEN** the card renders
- **THEN** Lysander's row renders and an inline note says Home Screen Events could not be loaded

#### Scenario: Nothing scheduled

- **WHEN** both reads succeed and nothing is live or upcoming
- **THEN** the card shows the empty body with the two inline links

### Requirement: The card has a Home tour step

The Home page tour SHALL include a step targeting the card, on desktop and mobile, with localized title and content that mentions both event types.

#### Scenario: Tour covers the card

- **WHEN** the Home tour runs on desktop or mobile
- **THEN** a step highlights the Events card

### Requirement: Each row opens its own destination

Each row SHALL be a link (activatable by click, tap and Enter, and openable in a new tab) with a focusable target: a Home Screen Event row navigates to `/dailies/hse`; a Legendary Event row navigates to `/events/legendary-events/:eventId`. The card itself SHALL NOT navigate as a whole.

#### Scenario: HSE row opens the HSE tab

- **WHEN** the user activates the Machine Hunt row
- **THEN** the app navigates to `/dailies/hse`

#### Scenario: Legendary Event row opens the event page

- **WHEN** the user activates the Lysander row
- **THEN** the app navigates to `/events/legendary-events/astarLysander`

#### Scenario: Keyboard activation

- **WHEN** a row has focus and the user presses Enter
- **THEN** that row's navigation occurs
