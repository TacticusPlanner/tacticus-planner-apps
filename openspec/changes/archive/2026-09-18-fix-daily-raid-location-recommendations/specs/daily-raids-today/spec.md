## MODIFIED Requirements

### Requirement: Only the active campaign event is farmable

Standing campaign battles SHALL remain eligible for raid calculations. A battle belonging to an event campaign SHALL be eligible only when both:

1. its campaign group id equals `live-progress.activeCampaignEventId`, and
2. its node has been reached by the player, per `campaign-events-progress`: for a non-challenge node, its `nodeNumber` SHALL be at most one greater than that campaign-group-and-type's `completedBattleCount`; for a challenge node, its battle id SHALL appear in that campaign-group-and-type's `completedChallengeBattlesIds`.

When no campaign event is active, all event-campaign battles SHALL be excluded. When `campaign-events-progress` has no entry for a battle's campaign group and type, that battle's node-reached condition SHALL be treated as not met (excluded), since an entry only exists once the player has started that tier.

Assumptions this requirement depends on:

- An event campaign's non-challenge nodes are numbered sequentially starting at 1 within each `{campaignGroupId, type}` track, and `completedBattleCount` counts consecutively from that start — reaching node N requires having completed nodes 1..N-1.
- `campaign-events-progress` and `live-progress.battleAttempts` are independent signals: the former reliably distinguishes Standard from Extremis (unlike the latter, which is deliberately not used for this eligibility check — see "Today's raid schedule" and "Today shows real daily energy usage" for why).

#### Scenario: One campaign event is active

- **GIVEN** the catalog contains standing campaign battles and battles from multiple event campaigns
- **AND** live progress identifies one active campaign event
- **WHEN** Today calculates the schedule
- **THEN** it includes standing battles and battles from that active event only

#### Scenario: No campaign event is active

- **GIVEN** the catalog contains standing and event campaign battles
- **AND** live progress has no active campaign event id
- **WHEN** Today calculates the schedule
- **THEN** it excludes every event campaign battle while retaining standing battles

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

## ADDED Requirements

### Requirement: Farm node selection prefers energy efficiency, then value

When a resource needed by an in-scope goal has more than one eligible farm location, the schedule SHALL select the location(s) with the lowest energy cost per expected item (`energyCost / dropRate`). When two or more eligible locations tie exactly on energy cost per expected item, the schedule SHALL prefer the tied location with the higher expected gold reward (`expectedGold`, served by the game catalog). A location with no `expectedGold` (its battle awards no guaranteed gold) SHALL be treated as having the lowest possible value for this tie-break, ordering behind any tied location that does report a value.

Assumptions this requirement depends on:

- `expectedGold` is a property of the battle, not of the specific resource being farmed there — two different resources dropped by the same battle report the same `expectedGold`.
- This tie-break applies only among locations already tied on energy cost per expected item; it does not override the primary energy-efficiency selection.

#### Scenario: Two locations tie on efficiency, one pays more gold

- **GIVEN** a needed material's only two eligible farm locations are "Fall of Cadia Elite" node 13 (10 energy per raid, one guaranteed copy per raid, guaranteed gold 109-165, so `expectedGold` 137) and "Saim-Hann Mirror Elite" node 19 (10 energy per raid, one guaranteed copy per raid, guaranteed gold 123-180, so `expectedGold` 151.5)
- **WHEN** Today calculates the schedule
- **THEN** both locations compute the same energy cost per expected item (10 energy / 1 item = 10), so the tie-break applies, and the schedule selects "Saim-Hann Mirror Elite" node 19 (the higher `expectedGold`) rather than "Fall of Cadia Elite" node 13

#### Scenario: One location is strictly more efficient than another

- **GIVEN** a needed material's two eligible farm locations have different energy cost per expected item, and the less-efficient location has a higher `expectedGold`
- **WHEN** Today calculates the schedule
- **THEN** the schedule selects the strictly more energy-efficient location; the tie-break never overrides a genuine efficiency difference

#### Scenario: A tied location has no guaranteed gold

- **GIVEN** two locations tie on energy cost per expected item, and one of them has no guaranteed gold reward on its battle (`expectedGold` is null)
- **WHEN** Today calculates the schedule
- **THEN** the schedule selects the tied location that does report an `expectedGold` value over the one with none
