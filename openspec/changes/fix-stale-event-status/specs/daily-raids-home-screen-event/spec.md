## ADDED Requirements

### Requirement: HSE countdowns stay current while the tab stays open

The active and next HSE SHALL be re-selected at least once a minute while the HSE tab is open, so an ended event stops showing as running within a minute without a reload. The status line and preview banner countdowns SHALL be measured from the instant the selection was made at, not a separate clock read at render.

Assumptions:

- A one-minute refresh is precise enough for HSE boundaries and countdowns.

#### Scenario: Running event ends while the tab is open

- **GIVEN** Machine Hunt ends at 2026-10-06T08:00:00Z and the HSE tab is open at 2026-10-06T07:59:30Z showing it as running
- **WHEN** the clock passes 08:00:00Z
- **THEN** within a minute Machine Hunt is no longer the running event and the tab shows the next event or the no-event state

#### Scenario: Countdown uses the selection instant

- **GIVEN** the selection was made at an instant 30 hours before Warp Surge starts
- **WHEN** the status line and preview banner render
- **THEN** both say Warp Surge starts "tomorrow", consistent with that instant
