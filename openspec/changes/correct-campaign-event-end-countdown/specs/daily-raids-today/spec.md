## MODIFIED Requirements

### Requirement: Today states the detected campaign event and its remaining time

Today SHALL show a campaign-event status block reporting the campaign event it has detected as active and, only when the active calendar occurrence is confirmed, how long remains until that event ends. The block SHALL carry its own heading at the same weight as the schedule's own "Today's raids" heading, with the detected event — its campaign icon, its name, and its end-time status — on the line beneath.

The detected campaign event SHALL be the one named by `live-progress.activeCampaignEventId`, rendered by that campaign group's localized display name. This is the same signal that governs which event-campaign nodes are farmable (see "Only the active campaign event is farmable"), so the status line and Today's schedule can never disagree about whether an event is active.

When `live-progress.activeCampaignEventId` is present but does not resolve to a known campaign group, the status line SHALL still report that a campaign event is active, using generic copy in place of the name, and SHALL NOT display the raw group id. It SHALL NOT report that no campaign event is active, because Today is gating event-node eligibility on that id regardless of whether a display name exists for it. Failure to resolve a name SHALL degrade the status line only — it SHALL NOT prevent Today from rendering.

When `live-progress.activeCampaignEventId` is absent or null, the status line SHALL state that no campaign event is active, regardless of what the events calendar shows for the current instant. Today's schedule excludes every event-campaign node in exactly that situation, so the status line SHALL NOT claim an event is active that Today will not schedule.

The remaining time SHALL be taken from the `endUtc` of a `confirmed: true` events-calendar entry for the `campaign-event` definition whose window contains the current instant, rendered as localized relative time at the same coarseness the app's other remaining-time displays use. If that window is a `confirmed: false` projection, the status line SHALL keep the detected event identity and state that its end time is not confirmed, without a numeric remaining-time phrase. When no such calendar entry is active, the status line SHALL name the detected campaign event and omit the remaining time rather than showing an estimated, stale, or zero duration.

Assumptions this requirement depends on:

- `live-progress.activeCampaignEventId` is a campaign group id, and a campaign group's display name is the same for both of its tiers — the status line names the event, not a tier.
- That id originates in synced player data, not the catalog, so the catalog may not yet carry a display name for a campaign event that has already gone live in game.
- At most one `campaign-event` calendar entry is active at any instant.
- `campaign-event` calendar entries may be projected placeholders rather than authored occurrences. A projected boundary is the catalog's best-known schedule, not a guarantee from the game; the served `confirmed` flag distinguishes it from an authored occurrence.

#### Scenario: An event is detected and the calendar knows when it ends

- **GIVEN** `live-progress.activeCampaignEventId` names the Adepta Sororitas event campaign group
- **AND** a confirmed `campaign-event` calendar entry's window contains the current instant and ends in three days
- **WHEN** Today loads
- **THEN** the status line names "Adepta Sororitas" and states that it ends in three days

#### Scenario: The active window is only projected

- **GIVEN** `live-progress.activeCampaignEventId` names a known event campaign group
- **AND** the only active `campaign-event` entry is unconfirmed and its projected `endUtc` is three hours away
- **WHEN** Today loads
- **THEN** the status line names the detected event and states that the end time is not confirmed, without saying it ends in three hours

#### Scenario: No campaign event is detected

- **GIVEN** `live-progress.activeCampaignEventId` is absent or null
- **WHEN** Today loads
- **THEN** the status line states that a campaign event is not active, and no campaign name or remaining time is shown

#### Scenario: The calendar shows an event but none is detected

- **GIVEN** `live-progress.activeCampaignEventId` is absent or null
- **AND** a `campaign-event` calendar entry's window contains the current instant
- **WHEN** Today loads
- **THEN** the status line still states that a campaign event is not active, matching Today's schedule, which excludes every event-campaign node in this situation

#### Scenario: A detected event id has no known display name

- **GIVEN** `live-progress.activeCampaignEventId` names a campaign group the catalog does not recognize
- **WHEN** Today loads
- **THEN** the status line reports that a campaign event is active without naming it, shows remaining time only if the calendar has a confirmed active window, does not display the raw group id, and Today renders normally rather than failing

#### Scenario: An event is detected but the calendar has no active window

- **GIVEN** `live-progress.activeCampaignEventId` names a campaign event group
- **AND** no `campaign-event` calendar entry's window contains the current instant
- **WHEN** Today loads
- **THEN** the status line names that campaign event and omits the remaining time, rather than showing an expired, zero, or estimated duration

#### Scenario: A detected event shows its campaign icon

- **GIVEN** `live-progress.activeCampaignEventId` resolves to a known campaign group
- **WHEN** Today renders the status block
- **THEN** the detected event's campaign icon renders beside its name

#### Scenario: On mobile the status block sits below the energy-usage row

- **GIVEN** Today is viewed below the mobile breakpoint
- **WHEN** Today renders its header
- **THEN** the campaign-event status block occupies its own row directly below the daily energy-usage row, and is read after it

#### Scenario: On desktop the status block takes half the header

- **GIVEN** Today is viewed at or above the mobile breakpoint
- **WHEN** Today renders its header
- **THEN** the header splits into two equal halves — the schedule's own heading, its energy/raid totals and the daily energy-usage indicator on the leading half, and the campaign-event status block on the trailing half — with the energy bar's percentage staying at its own half's trailing edge

#### Scenario: The status line is part of Today's guided tour

- **GIVEN** a user starts Today's guided tour on either a mobile or a desktop viewport
- **WHEN** the tour reaches the campaign-event status line
- **THEN** it highlights that block with its own step explaining what the detected campaign event governs and why an unconfirmed end has no countdown
