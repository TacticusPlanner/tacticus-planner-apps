## MODIFIED Requirements

### Requirement: Currently active events are indicated

The calendar SHALL indicate which visible entries are active at the current time without rendering a visible `Live now` tag. The current time SHALL be re-evaluated at least once a minute while the page stays open, so an entry stops being indicated as active within a minute of its `endUtc` (and starts being indicated within a minute of its `startUtc`) without a reload or a catalog data change.

Assumptions:

- Activity uses the entry's UTC window, start inclusive and end exclusive.
- A one-minute refresh is precise enough for event boundaries.

#### Scenario: Today's active event is highlighted

- **WHEN** the calendar renders an entry whose window contains the current time
- **THEN** that entry is visually indicated as currently active without a visible `Live now` tag

#### Scenario: An event ends while the page stays open

- **GIVEN** the calendar is open and shows Machine Hunt (window ending at 10:00 local time) as active at 09:59:30
- **WHEN** the clock passes 10:00 and no catalog data changes
- **THEN** within a minute Machine Hunt is no longer indicated as active

## ADDED Requirements

### Requirement: The current week follows the local date while the page stays open

The calendar's current week (week offset 0) SHALL start at the local midnight of the current date, re-evaluated at least once a minute, so a page left open across local midnight moves its window to the new date without a reload. Navigated weeks SHALL stay relative to that current week.

#### Scenario: Page open across midnight

- **GIVEN** the calendar is open on the current week at 23:59:30 local time on 2026-10-14
- **WHEN** the local clock passes midnight
- **THEN** within a minute the visible range starts on 2026-10-15 and ends before 2026-10-22, and the calendar reads that range

#### Scenario: Stable within a day

- **WHEN** a minute passes without crossing local midnight
- **THEN** the visible range does not change and the calendar data is not re-read for it
