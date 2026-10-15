## ADDED Requirements

### Requirement: Today's campaign-event status re-evaluates while Today stays open

Today SHALL re-read the active `campaign-event` calendar window and the detected campaign event at least once a minute while Today stays open, so the status line's remaining time disappears within a minute of the window's `endUtc` (and a newly active window is picked up) without a reload or a data change.

Assumptions:

- A one-minute refresh is precise enough for campaign-event boundaries.

#### Scenario: The confirmed window ends while Today is open

- **GIVEN** `live-progress.activeCampaignEventId` names a known campaign group and a confirmed `campaign-event` window ends at 2026-10-15T08:00:00Z
- **AND** Today is open at 2026-10-15T07:59:30Z showing the remaining time
- **WHEN** the clock passes 08:00:00Z
- **THEN** within a minute the status line no longer shows a remaining time for that window
