# Spec Delta

## Purpose

The Home page's Legendary Event card: which LRE it shows, what it says in each lifecycle state, how it navigates, its loading, failure and empty states, and its Home tour step.

## ADDED Requirements

### Requirement: Home renders a Legendary Event card before the calendar

The authenticated home page SHALL render a card titled "Legendary Event" (localized) in a new row directly after the Your Projects / Daily Raids row and before the Events calendar. At or above 768px the card occupies the left half of that row; below 768px it is full width. Existing rows are unchanged.

#### Scenario: Desktop placement

- **WHEN** a signed-in user opens `/home` at or above 768px
- **THEN** the Legendary Event card sits in its own row after Your Projects / Daily Raids, left-aligned at half width, with the Events calendar last

#### Scenario: Mobile placement

- **WHEN** a signed-in user opens `/home` below 768px
- **THEN** the card renders full width after Daily Raids and before the Events calendar

### Requirement: The card shows the active event, else the next upcoming one

The card SHALL show the `active` LRE when one exists, else the `upcoming` LRE with the earliest next stage start (lifecycle per `lre-events-hub`). It SHALL show the event unit's portrait and localized name and a LIVE badge when active. For an active event it SHALL show "ends in …" with the stage end, "Stage N of 3" when the synced entry has `currentEventRun`, and the synced points with points to the next milestone ("3,410 points · 90 to next milestone"); when the synced entry is missing it shows "no synced progress yet". For an upcoming event it SHALL show the local start date and time and "starts in …". Countdowns tick at least once a minute.

#### Scenario: Active event with synced progress

- **GIVEN** Lysander is active, stage ends 2026-09-06T00:00Z, the synced entry has `currentEventRun` 1 and `currentPoints` 3,410, and the next milestone is at 3,500
- **WHEN** the card renders at 2026-09-04T12:00Z
- **THEN** it shows Lysander with LIVE, "Stage 1 of 3", "Ends in 1 day", and "3,410 points · 90 to next milestone"

#### Scenario: Upcoming event only

- **GIVEN** no event is active and Uthar's next stage starts 2026-10-04T00:00Z
- **WHEN** the card renders
- **THEN** it shows Uthar without LIVE, the local start date and time, and "Starts in …"

#### Scenario: Active event without synced entry

- **GIVEN** Lysander is active and the synced chunk has no entry for it
- **WHEN** the card renders
- **THEN** it shows Lysander with LIVE, the stage timing, and "no synced progress yet"

### Requirement: The whole card opens the event page

The card SHALL be activatable as a whole by click, tap, Enter and Space, with button semantics and a focusable target, navigating to `/events/lre/:eventId` of the shown event; in the empty state it navigates to `/events/lre`. It SHALL do so in every state.

#### Scenario: Click opens the event

- **WHEN** the user activates the card showing Lysander
- **THEN** the app navigates to `/events/lre/astarLysander`

#### Scenario: Keyboard activation

- **WHEN** the card has focus and the user presses Enter or Space
- **THEN** the same navigation occurs

### Requirement: Distinct loading, error and empty states

The card SHALL show a skeleton body while the catalog read is pending, an error body when it failed, and an empty body ("no Legendary Event scheduled") when no event is active or upcoming. A failed player-data read SHALL not blank the card: the event and timing render and the progress line reads "synced data unavailable".

#### Scenario: Loading

- **WHEN** the `lres` read has not resolved
- **THEN** the card shows its skeleton body

#### Scenario: Catalog failure

- **WHEN** the `lres` read fails
- **THEN** the card shows its error body and Home still renders

#### Scenario: Nothing scheduled

- **WHEN** every catalog LRE is archived
- **THEN** the card shows the empty body and still opens `/events/lre` on activation

### Requirement: The card has a Home tour step

The Home page tour SHALL include a step targeting the card, on desktop and mobile, with localized title and content.

#### Scenario: Tour covers the card

- **WHEN** the Home tour runs on desktop or mobile
- **THEN** a step highlights the Legendary Event card after the Daily Raids step and before the calendar navigation step
