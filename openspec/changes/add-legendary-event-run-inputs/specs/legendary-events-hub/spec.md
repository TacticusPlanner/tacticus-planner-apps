# Spec Delta

## MODIFIED Requirements

### Requirement: Run status is read from the synced progress chunk

The Run status section SHALL show, from the synced `lre-progress` entry whose `id` equals the event id: "Event N of 3" from `currentEventRun` (omitted when null); tokens `current/max` with "next token in …", counted down from the instant the chunk was observed plus `nextTokenInSeconds` and read as "next token ready" once that instant has passed (omitted when the bucket is null or full); `currentPoints`; `currentCurrency`; claimed chests as `currentClaimedChestIndex` (the Tacticus API sends a 1-based count of chests opened, and -1 when it omits the field, which reads as 0); `currentShards`; and the next points milestone: the first entry of the event's own `rewards.pointsMilestones` (from its `lres` record) whose `cumulativePoints` exceeds `currentPoints`, as "N points to milestone M (+E currency)", or "—" when no such entry exists or the event's record is unavailable. It SHALL show the run timing from the lifecycle and "Synced X ago" from the player-data manifest `syncedAt` (hidden while that read is pending, "Not synced yet" before the first sync). It SHALL NOT offer its own sync control. It SHALL carry the Inputs button (see `legendary-event-run-inputs`) and the Reward outlook (see `legendary-event-reward-projection`). When the chunk has no entry for the event it SHALL show a "no synced progress for this event yet" body, the run timing, the Inputs button and the outlook computed from zero.

Assumptions:

- Each event carries its own reward ladder in `rewards`; ladders may differ between events. `pointsMilestones` is ordered by `cumulativePoints` ascending.
- Tokens and regeneration come from the sync, never computed locally.

#### Scenario: Populated run status

- **GIVEN** Lysander's synced entry has `currentEventRun` 1, tokens `{ current: 3, max: 12, nextTokenInSeconds: 5400 }`, `currentPoints` 3410, `currentCurrency` 120, `currentClaimedChestIndex` 4, `currentShards` 125, and the first milestone above 3,410 in Lysander's `rewards.pointsMilestones` is `{ milestone: 14, cumulativePoints: 3500, engramPayout: 60 }`
- **WHEN** the section renders
- **AND** the chunk was observed at the current instant
- **THEN** it shows "Event 1 of 3", "3/12 tokens, next in 1 hr 30 min", "3,410 points", "120 currency", "4 chests claimed", "125 shards", and "90 points to milestone 14 (+60 currency)"

#### Scenario: Next-token countdown advances between syncs

- **GIVEN** the same entry, observed 2 hours before the current instant
- **WHEN** the section renders
- **THEN** it shows "3/12 tokens, next token ready"

#### Scenario: Event not in the synced chunk

- **GIVEN** the synced `lre-progress` array has no entry for `votanUthar`
- **WHEN** Uthar's run status renders
- **THEN** it shows the run timing, the "no synced progress for this event yet" body, the Inputs button and the outlook with a "No synced progress yet" note

#### Scenario: Last-synced age

- **GIVEN** the player-data manifest `syncedAt` is 25 minutes before now
- **WHEN** the section renders
- **THEN** it shows "Synced 25 minutes ago" and no sync button inside the section

#### Scenario: Ladder is per event

- **GIVEN** Uthar's ladder has 54 chests and Lysander's 60
- **WHEN** each event's run status renders
- **THEN** each card's milestone line and outlook read that event's own ladder
