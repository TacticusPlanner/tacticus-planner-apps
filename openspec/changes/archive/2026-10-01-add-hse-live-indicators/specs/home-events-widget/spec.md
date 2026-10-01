## ADDED Requirements

### Requirement: Home renders a Home Screen Events card beside Token Availability

The authenticated home page SHALL render a card titled "Home Screen Events" (localized), distinct from and not replacing the "Events calendar". The card is HSE-only for now. At or above the 768px (`md`) breakpoint it SHALL share one row with the Token Availability card, the two cards side by side, with the Token Availability content wrapping to fit its narrower card. Below 768px it SHALL stack directly after the Token Availability card. The events calendar remains the last section.

#### Scenario: Desktop shares a row with Token Availability

- **WHEN** a signed-in user opens `/home` at or above 768px
- **THEN** Token Availability and Home Screen Events are side by side in one row above the Your Projects/Daily Raids row, with all token entries still visible (wrapping as needed)

#### Scenario: Mobile stacks after Token Availability

- **WHEN** a signed-in user opens `/home` below 768px
- **THEN** Home Screen Events renders full width directly after Token Availability and before Your Projects

#### Scenario: Calendar is not the same card

- **WHEN** the home page renders
- **THEN** both the "Home Screen Events" card and the "Events calendar" are present and separately titled

### Requirement: The card lists the live event first, then upcoming events, up to two

The card SHALL show at most two entries. If an HSE is active it SHALL be first, marked LIVE (visible text, not colour alone) with an "ends in ..." relative countdown. Remaining slots are filled by upcoming HSEs in ascending start order, each with its start as a local date and time and a relative "starts in ..." countdown. Activity and ordering are decided by UTC instants (start inclusive, end exclusive); the device timezone only affects the displayed start text. The entries come from the same selection as the HSE tab (`add-home-screen-event-tracking`), so the card never disagrees with it about which event is live.

Assumptions:

- At most one HSE is active at a time; if data overlaps, the existing selection rule picks the single active one.
- Local time is the device timezone; the event window itself stays UTC.

#### Scenario: Live event and one upcoming

- **GIVEN** Machine Hunt is active (ends 2026-10-05T08:00Z) and Training Rush starts 2026-10-09T08:00Z, and nothing else is scheduled
- **WHEN** the card renders
- **THEN** it shows Machine Hunt first with LIVE and its "ends in" countdown, then Training Rush with its local start and "starts in" countdown

#### Scenario: Cap of two

- **GIVEN** one active and three upcoming events
- **WHEN** the card renders
- **THEN** only the active event and the earliest upcoming event are shown

#### Scenario: Only upcoming events

- **GIVEN** no active HSE and three upcoming events
- **WHEN** the card renders
- **THEN** the two earliest upcoming events are shown by start time, neither marked LIVE

#### Scenario: Timezone changes display only

- **GIVEN** an event starts at 2026-10-02T08:00:00Z
- **WHEN** the card renders with the device in `Pacific/Honolulu` and again in `UTC`
- **THEN** the displayed local start differs by the offset, while which event is live or upcoming is identical

### Requirement: The whole card opens the HSE tab

The card SHALL be activatable as a whole by click, tap, Enter and Space, navigating to `/dailies/hse`, with button semantics and a focusable target, following the Raids widget pattern. It SHALL do so in every state (loading, error, empty, populated).

#### Scenario: Click opens the HSE tab

- **WHEN** the user activates the card by click
- **THEN** the app navigates to `/dailies/hse`

#### Scenario: Keyboard activation

- **WHEN** the card has focus and the user presses Enter or Space
- **THEN** the app navigates to `/dailies/hse`

### Requirement: Distinct loading, error and empty states

The card SHALL show a distinct loading body while the calendar read is pending, a distinct error body when it failed, and a distinct empty body when it succeeded but there is no active or upcoming HSE ("no upcoming events"). The empty copy words the gap as no event scheduled, not as no event running in game. After 2026-10-10T08:00Z the shipped API calendar has no authored HSE, so the card is expected to show the empty body until the calendar is updated.

#### Scenario: Loading

- **WHEN** the calendar read has not resolved
- **THEN** the card shows its loading body

#### Scenario: Read failure

- **WHEN** the calendar read fails
- **THEN** the card shows its error body, and Home still renders

#### Scenario: Nothing scheduled

- **WHEN** the read succeeds and there is no active or upcoming HSE
- **THEN** the card shows the empty body

### Requirement: The card has a Home tour step

The Home page tour SHALL include a step targeting the card, on desktop and mobile, with localized title and content.

#### Scenario: Tour covers the card

- **WHEN** the Home tour runs on desktop or mobile
- **THEN** a step highlights the Home Screen Events card
