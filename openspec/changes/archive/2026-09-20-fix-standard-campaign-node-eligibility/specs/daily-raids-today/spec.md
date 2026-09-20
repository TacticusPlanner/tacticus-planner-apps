## MODIFIED Requirements

### Requirement: Only the active campaign event is farmable

Standing campaign battles SHALL be eligible for raid calculations only once the player has reached them: a battle's `battleIndex` (the zero-based index `campaign-progress` payloads are keyed against for that battle's `{campaignGroupId, type}` track — distinct from the display-only `nodeNumber`) SHALL be at most one greater than that track's `highestCompletedBattleIndex`, per the `campaign-progress` chunk. A track with no `campaign-progress` entry yet SHALL be treated as not reached (only `battleIndex` 0 eligible). Unlike event campaigns, `campaign-progress` carries no separate completed-challenge-ids list, so a standing challenge battle SHALL be gated by the same `battleIndex` comparison as every other battle in its track, not treated as reachable in any order. An unreached standing battle SHALL be excluded from raid calculations the same way an unreached event-campaign battle already is: it SHALL NOT be scheduled a real raid, and a resource whose only farm location is such a battle SHALL have no farmable location today — the same outcome, not a distinct status or fallback presentation.

A battle belonging to an event campaign SHALL be eligible only when both:

1. its campaign group id equals `live-progress.activeCampaignEventId`, and
2. its node has been reached by the player, per `campaign-events-progress`: for a non-challenge node, its `nodeNumber` SHALL be at most one greater than that campaign-group-and-type's `completedBattleCount`; for a challenge node, its battle id SHALL appear in that campaign-group-and-type's `completedChallengeBattlesIds`.

When no campaign event is active, all event-campaign battles SHALL be excluded. When `campaign-events-progress` has no entry for a battle's campaign group and type, that battle's node-reached condition SHALL be treated as not met (excluded), since an entry only exists once the player has started that tier.

Assumptions this requirement depends on:

- An event campaign's non-challenge nodes are numbered sequentially starting at 1 within each `{campaignGroupId, type}` track, and `completedBattleCount` counts consecutively from that start — reaching node N requires having completed nodes 1..N-1.
- A standing campaign's `battleIndex` is assigned sequentially starting at 0 within each `{campaignGroupId, type}` track (covering both challenge and non-challenge battles), and `highestCompletedBattleIndex` counts consecutively from that start the same way `campaign-progress` already reports to the Progress page.
- `campaign-events-progress` and `live-progress.battleAttempts` are independent signals: the former reliably distinguishes Standard from Extremis (unlike the latter, which is deliberately not used for this eligibility check — see "Today's raid schedule" and "Today shows real daily energy usage" for why). The same independence holds between `campaign-progress` and `live-progress.battleAttempts` for standing campaigns — this eligibility check SHALL NOT be used as the signal for whether a real synced attempt exists at a battle; "Today's Attempts section" and "Today shows real daily energy usage" are governed only by `live-progress.battleAttempts`, independent of whether this requirement currently judges that battle reached.

#### Scenario: One campaign event is active

- **GIVEN** the catalog contains standing campaign battles and battles from multiple event campaigns
- **AND** live progress identifies one active campaign event
- **WHEN** Today calculates the schedule
- **THEN** it includes reached standing battles and battles from that active event only

#### Scenario: No campaign event is active

- **GIVEN** the catalog contains standing and event campaign battles
- **AND** live progress has no active campaign event id
- **WHEN** Today calculates the schedule
- **THEN** it excludes every event campaign battle while retaining reached standing battles

#### Scenario: An unreached Extremis node is excluded even though its event is active

- **GIVEN** the active campaign event is "Adeptus Mechanicus" (`eventCampaign1`)
- **AND** `campaign-events-progress` for `{eventCampaign1, Extremis}` shows `completedBattleCount: 0` (or no entry at all)
- **AND** the catalog's only farm location for a needed material is node 12 of the Extremis track (`AME12`)
- **WHEN** Today calculates the schedule
- **THEN** `AME12` is excluded from eligible battles, and that material has no farmable location today (it does not appear in the schedule or Bonus Raids as farmable at `AME12`)

#### Scenario: A reached Standard node in the same active event remains eligible

- **GIVEN** the active campaign event is "Adeptus Mechanicus" (`eventCampaign1`)
- **AND** `campaign-events-progress` for `{eventCampaign1, Standard}` shows `completedBattleCount: 15`
- **AND** a needed material's farm location is node 12 of the Standard track (`AMS12`)
- **WHEN** Today calculates the schedule
- **THEN** `AMS12` remains eligible, since `12 <= 15 + 1`

#### Scenario: A goal-pinned farm location that hasn't been reached is excluded the same way

- **GIVEN** a goal's configuration pins a specific event-campaign node as its farm location (via `farmingLocationIds`)
- **AND** that node has not been reached per `campaign-events-progress`, exactly as in the "unreached Extremis node" scenario above
- **WHEN** Today calculates the schedule
- **THEN** that node is excluded from eligible battles regardless of being explicitly pinned, and the goal shows no farmable candidates for that resource today — the same outcome as an auto-selected unreached location, not a special case or a different failure mode

#### Scenario: An unreached standing node is excluded from raid calculations

- **GIVEN** `campaign-progress` for `{campaign1, Standard}` shows `highestCompletedBattleIndex: 10`
- **AND** the catalog's only farm location for a needed material is the Standard track's battle at `battleIndex: 13`
- **WHEN** Today calculates the schedule
- **THEN** that battle is excluded from eligible battles, since `13 > 10 + 1`, and that material has no farmable location today

#### Scenario: A reached standing node remains eligible

- **GIVEN** `campaign-progress` for `{campaign1, Standard}` shows `highestCompletedBattleIndex: 10`
- **AND** a needed material's farm location is the Standard track's battle at `battleIndex: 11`
- **WHEN** Today calculates the schedule
- **THEN** that battle remains eligible, since `11 <= 10 + 1`

#### Scenario: A standing track with no progress entry has only its first battle eligible

- **GIVEN** `campaign-progress` has no entry for `{campaign2, Elite}`
- **AND** the Elite track's battle at `battleIndex: 0` and its battle at `battleIndex: 1` both farm a needed material
- **WHEN** Today calculates the schedule
- **THEN** only the `battleIndex: 0` battle is eligible

#### Scenario: A real synced attempt at an unreached standing battle still counts toward Today's Attempts and real energy usage

- **GIVEN** `campaign-progress` for `{campaign3, Standard}` shows `highestCompletedBattleIndex: 4` (battle at `battleIndex: 9` is therefore excluded from raid calculations)
- **AND** `live-progress.battleAttempts` nonetheless records `attemptsUsed: 2` at `{campaign3, Standard, battleIndex: 9}` today
- **WHEN** Today computes Today's Attempts and real daily energy usage
- **THEN** that attempt still appears in Today's Attempts with `attemptsUsed: 2`, and its energy is still included in the real energy-used total — this requirement's eligibility judgment does not suppress a real synced attempt record
