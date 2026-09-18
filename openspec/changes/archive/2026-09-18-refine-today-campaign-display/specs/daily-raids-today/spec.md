## MODIFIED Requirements

### Requirement: Campaign locations use the Character Lookup presentation

Today, Bonus Raids, and Today's Attempts SHALL render each battle as the primary element of its row: the campaign icon, the campaign's own display name, and the node's tier-and-number label, ordered ahead of the resource or material it farms — which renders as a secondary caption. Raw battle ids SHALL only be used as a fallback when catalog presentation metadata is unavailable. When a resource is scheduled at more than one location, each location SHALL render as its own row at the same visual weight as a single location would, rather than a compact list of chips. The Raids Plan tab is unaffected by this requirement and continues to render locations as compact chips secondary to the resource.

The campaign name and the tier-and-number label SHALL be split across two lines:

1. The first line SHALL carry only the campaign's own display name, with no tier, difficulty, or mirror qualifier — so that every tier of one storyline shares an identical first line (for example, all four Indomitus tiers read "Indomitus").
2. The second line SHALL carry every qualifier that distinguishes the node's tier, followed by the node number: "Standard 22", "Elite 40", "Mirror 12", "Mirror Elite 40", "Extremis 3". A challenge node SHALL additionally carry a "B" suffix on its node number ("Extremis 12B"), matching the suffix the Raids Plan chips already show.

The second line SHALL NOT be a generic battle-number label that omits the tier: the tier must be recoverable from the line carrying the number, because a node number alone does not identify a battle.

Assumptions this requirement depends on:

- A storyline campaign group's tier is fully described by its difficulty (Standard/Elite) plus whether it is a mirror track; an event campaign group's tier is fully described by its Standard/Extremis difficulty plus its separate challenge flag.
- Both lines are localized game-data display text, resolved from catalog ids through the `campaigns` namespace rather than stored as display strings.

#### Scenario: A scheduled node has campaign presentation metadata

- **GIVEN** a scheduled battle resolves to catalog campaign metadata
- **WHEN** Today renders the battle
- **THEN** its row shows the campaign icon, the campaign name on the first line and the tier-and-node label on the second, ordered ahead of the resource it farms, with the resource name and progress rendered as a secondary caption

#### Scenario: A storyline elite node splits its tier onto the node line

- **GIVEN** a scheduled battle is node 40 of the Fall of Cadia Elite campaign
- **WHEN** Today renders the battle
- **THEN** its first line reads "Fall of Cadia" and its second line reads "Elite 40"

#### Scenario: Every tier of one storyline shares a first line

- **GIVEN** Today's schedule includes node 22 of Indomitus Standard and node 12 of the Indomitus mirror track
- **WHEN** Today renders both
- **THEN** both rows' first line reads "Indomitus", and their second lines read "Standard 22" and "Mirror 12" respectively

#### Scenario: A mirror elite node keeps both qualifiers on the node line

- **GIVEN** a scheduled battle is node 40 of the Saim-Hann elite mirror campaign
- **WHEN** Today renders the battle
- **THEN** its first line reads "Saim-Hann" and its second line reads "Mirror Elite 40", retaining both the mirror and the elite qualifier

#### Scenario: An event-campaign node shows its event tier

- **GIVEN** a scheduled battle is node 3 of the Death Guard event campaign's Extremis track
- **WHEN** Today renders the battle
- **THEN** its first line reads "Death Guard" and its second line reads "Extremis 3"

#### Scenario: A challenge node is distinguished from the regular node of the same number

- **GIVEN** a scheduled battle is the challenge node numbered 12 of an event campaign's Extremis track
- **WHEN** Today renders the battle
- **THEN** its second line reads "Extremis 12B", distinguishing it from the regular node 12 of that same track

#### Scenario: Today's Attempts uses the same two-line presentation

- **GIVEN** a location appears in Today's Attempts
- **WHEN** Today renders it
- **THEN** its campaign name and tier-and-node label are split across two lines by the same rules the schedule's rows use, rather than a differently-formatted label

#### Scenario: A node with no catalog presentation metadata falls back to its battle id

- **GIVEN** a scheduled battle does not resolve to catalog campaign metadata
- **WHEN** Today renders the battle
- **THEN** its row shows the raw battle id in place of the campaign name and omits the second line entirely, rather than rendering a partial campaign name, an empty line, or a node number with no tier word

#### Scenario: A resource farmed at multiple locations shows one row per location

- **GIVEN** a resource is scheduled to be farmed at more than one location today
- **WHEN** Today renders that resource's card
- **THEN** each location renders as its own full-weight row rather than a compact chip, and the resource's name/progress caption appears once for the card

## ADDED Requirements

### Requirement: Today states the detected campaign event and its remaining time

Today SHALL show a campaign-event status block reporting the campaign event it has detected as active and how long remains until that event ends. The block SHALL carry its own heading at the same weight as the schedule's own "Today's raids" heading, with the detected event — its campaign icon, its name, and the remaining time — on the line beneath.

The detected campaign event SHALL be the one named by `live-progress.activeCampaignEventId`, rendered by that campaign group's localized display name. This is the same signal that governs which event-campaign nodes are farmable (see "Only the active campaign event is farmable"), so the status line and Today's schedule can never disagree about whether an event is active.

When `live-progress.activeCampaignEventId` is present but does not resolve to a known campaign group, the status line SHALL still report that a campaign event is active, using generic copy in place of the name, and SHALL NOT display the raw group id. It SHALL NOT report that no campaign event is active, because Today is gating event-node eligibility on that id regardless of whether a display name exists for it. Failure to resolve a name SHALL degrade the status line only — it SHALL NOT prevent Today from rendering.

When `live-progress.activeCampaignEventId` is absent or null, the status line SHALL state that no campaign event is active, regardless of what the events calendar shows for the current instant. Today's schedule excludes every event-campaign node in exactly that situation, so the status line SHALL NOT claim an event is active that Today will not schedule.

The remaining time SHALL be taken from the end of the events-calendar entry for the `campaign-event` definition whose window contains the current instant, rendered as localized relative time at the same coarseness the app's other remaining-time displays use. When no such calendar entry is active, the status line SHALL name the detected campaign event and omit the remaining time rather than showing an estimated, stale, or zero duration.

Assumptions this requirement depends on:

- `live-progress.activeCampaignEventId` is a campaign group id, and a campaign group's display name is the same for both of its tiers — the status line names the event, not a tier.
- That id originates in synced player data, not the catalog, so the catalog may not yet carry a display name for a campaign event that has already gone live in game.
- At most one `campaign-event` calendar entry is active at any instant.
- `campaign-event` calendar entries may be projected placeholders rather than authored occurrences, so their boundaries are the calendar's best-known schedule rather than a guarantee from the game.

#### Scenario: An event is detected and the calendar knows when it ends

- **GIVEN** `live-progress.activeCampaignEventId` names the Adepta Sororitas event campaign group
- **AND** a `campaign-event` calendar entry's window contains the current instant and ends in three days
- **WHEN** Today loads
- **THEN** the status line names "Adepta Sororitas" and states that it ends in three days

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
- **THEN** the status line reports that a campaign event is active without naming it, shows the remaining time if the calendar has an active window, does not display the raw group id, and Today renders normally rather than failing

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
- **THEN** it highlights that block with its own step explaining what the detected campaign event governs
