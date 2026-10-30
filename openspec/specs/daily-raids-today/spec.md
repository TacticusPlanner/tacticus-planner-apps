# daily-raids-today Specification

## Purpose

Tells a player exactly what to raid today for one selected project's active goals — respecting their real energy budget, shared inventory, and per-battle attempt limits — plus what's just out of reach if they had more energy to spend.

## Requirements

### Requirement: Today uses an icon-led responsive schedule

Today SHALL show the relevant unit portrait for each goal group, icons for energy and raid-attempt statistics, and a goal-type icon for each goal's target: a Rank target SHALL show its goal-type icon paired with its rank icon, with no accompanying text; every other goal kind (Ability, Ascension, Unlock, Level, Upgrade) SHALL show its goal-type icon paired with its existing text label, matching the icon/text treatment used by the Create Goal sheet's goal-type picker. The icon treatment SHALL supplement accessible text rather than replace it, except for the Rank case where the icon pair is the accessible representation (with an accessible name available to assistive technology via the rank icon).

When a goal's only scheduled resource is that same unit's shards, Today SHALL combine the goal identity and shard schedule into one row instead of repeating the portrait and unit name in a separate goal header and resource card.

At or above the 768px breakpoint, Today's goal groups SHALL stack one below the other across the full width of their card, and each group's resource cards SHALL fill that width in as many 20rem columns as fit. A group SHALL NOT be confined to one column because it is the only group. Plan › Schedule keeps its own layout.

#### Scenario: Single shard schedule avoids duplicate identity

- **GIVEN** a goal whose only scheduled resource is the goal unit's shards
- **WHEN** Today renders that goal group
- **THEN** one combined row shows the unit portrait, unit name, target, raid total, and node details without a separate duplicate goal header or shard portrait

#### Scenario: Mobile schedule is compact

- **WHEN** Today is viewed below the 768px mobile breakpoint
- **THEN** goal headings, resource identity, raid totals, and node details are composed as dense rows that minimize vertical space while preserving every label and control

#### Scenario: Desktop schedule fills the page width

- **WHEN** Today is viewed at or above the 768px desktop breakpoint
- **THEN** each goal group's resource cards fill the Today's plan card's width in as many 20rem columns as fit, keeping each card compact rather than stretching a single card across the card

#### Scenario: One goal group fills the plan card

- **GIVEN** today's plan has a single goal group with 11 resource cards, and the Today's plan card is about 1165px wide (four tracks at 2560px)
- **WHEN** Today renders
- **THEN** the 11 cards are laid out in 3 columns, not stacked in one

#### Scenario: Plan › Schedule is unchanged

- **WHEN** the user opens Plan › Schedule
- **THEN** its goal groups and resource cards are laid out as before this change

#### Scenario: Rank goals show the goal-type icon paired with the rank icon

- **GIVEN** a goal group's target is a Rank goal
- **WHEN** Today renders that goal's header
- **THEN** it shows the Rank goal-type icon next to the target rank's icon, with no accompanying text, and exposes the rank as an accessible name

#### Scenario: Non-Rank goals show an icon with text

- **GIVEN** a goal group's target is any goal kind other than Rank
- **WHEN** Today renders that goal's header
- **THEN** it shows that goal kind's icon paired with its existing text label

### Requirement: Today's schedule scope

Today SHALL compute its schedule from all account goals whose status is `Active` (or, when a project is selected, that project's Active goals), each once in canonical global priority order. Paused, Completed, and Archived goals SHALL be excluded.

#### Scenario: Only Active goals contribute

- **GIVEN** Active goals in two projects and Paused/terminal goals alongside them
- **WHEN** Today loads
- **THEN** it schedules both Active goals in global order and excludes the others

#### Scenario: Paused goals do not contribute

- **GIVEN** a Paused goal with unmet farmable need
- **WHEN** Today loads
- **THEN** its need is absent from schedule, inventory allocation, and Bonus Raids

### Requirement: Today and Bonus Raids prioritize long-running resources

Within each goal group, Today and Bonus Raids SHALL order resources by the estimated time investment required to finish that resource: longest estimated completion time first, then greatest estimated energy cost. Configured goal priority SHALL remain the primary ordering between goal groups. Resources tied on both estimates SHALL use a stable deterministic ordering.

#### Scenario: A longer resource precedes a faster one in the same goal

- **GIVEN** two resources scheduled for the same goal and one has a longer estimated completion time than the other
- **WHEN** Today renders the goal group
- **THEN** the longer-running resource is shown first

#### Scenario: Energy breaks equal-time resource ties

- **GIVEN** two resources scheduled for the same goal with equal estimated completion times and different estimated energy costs
- **WHEN** Today renders the goal group
- **THEN** the resource with the greater estimated energy cost is shown first

#### Scenario: Bonus Raids retain urgency ordering within goal groups

- **GIVEN** two Bonus Raids resources belong to the same goal and have different urgency estimates
- **WHEN** Today renders the Bonus Raids group
- **THEN** they use the same time-investment ordering as the main schedule

#### Scenario: Goal priority remains the primary group ordering

- **GIVEN** a lower-priority goal has a resource that takes longer than a resource for a higher-priority goal
- **WHEN** Today renders the schedule or Bonus Raids
- **THEN** the higher-priority goal group remains before the lower-priority goal group

### Requirement: Schedule entries show which goal they farm for

Today's raid schedule and Bonus Raids SHALL group their entries by the goal(s) they are being farmed for, with a separator per goal identifying that goal's unit and target (e.g. which character or MoW, and which rank, ability, ascension, or upgrade target it's working toward). An upgrade or shard farmed for more than one goal within the same list SHALL appear once under each contributing goal's group, not merged into a single ungrouped entry.

#### Scenario: Schedule grouped by goal

- **GIVEN** the day's raid schedule includes raids toward two or more different goals
- **WHEN** Today loads
- **THEN** the schedule is organized into per-goal groups, each separated and labeled with that goal's unit and target, rather than shown as one flat list

#### Scenario: The same upgrade needed by two goals appears under each

- **GIVEN** two different in-scope goals each receive at least one real-schedule raid for the same upgrade
- **WHEN** Today loads
- **THEN** that upgrade appears once under each goal's group, each instance showing only the raids attributable to that goal

#### Scenario: Bonus Raids grouped the same way

- **GIVEN** Bonus Raids includes entries for two or more different goals
- **WHEN** Today loads
- **THEN** Bonus Raids is grouped by goal the same way the main schedule is, in the same goal-priority order

### Requirement: Bonus Raids

Today SHALL show a Bonus raids card: upgrades or shards that receive zero raids under the real daily energy budget but would receive at least one raid if energy were unlimited. The card's header SHALL say that these raids apply if energy is left. While the daily energy limit is not spent, an upgrade or shard that already receives at least one raid in the real schedule SHALL NOT appear in Bonus Raids; once it is spent, the rule below applies instead. Bonus Raids SHALL be ordered by the same goal-priority order the main schedule uses. Below the limit, when no entry qualifies, the Bonus raids card SHALL NOT be rendered.

Below the limit, Bonus Raids SHALL initially display only the top 3 qualifying entries in that order. When more entries qualify than are shown, Today SHALL show a "Show N more" control beneath the visible entries, where N is the number the next activation reveals: 5, or fewer when fewer are left. Each activation reveals the next N entries in place (still in the same order, still grouped by goal per the grouping requirement above). Once more than the top 3 are shown, a "Show less" control SHALL return to the top 3. Below the limit the card SHALL also show a "Full schedule" link to Plan › Schedule. How many entries are shown SHALL NOT be stored in the URL, and SHALL return to the top 3 whenever the project, the quick filters or Raids Filters change.

Once the real energy spent today (from the player's synced attempts, the same figure Today's energy tile shows) reaches or exceeds the daily energy limit (`planningSettings.dailyEnergy`), Bonus Raids SHALL be the only raids list on Today: the Today's plan card SHALL NOT be shown, and the Bonus raids card SHALL take its place in the dashboard (the same tracks, the same card grid inside goal groups), with a short caption as the first line of its body stating that the daily energy limit has been reached. Bonus Raids SHALL then list every raid still open today rather than only the upgrades and shards the real schedule left unraided: today's schedule recomputed with unlimited energy and with each node's raids capped at the player's real attempts left today, so an upgrade or shard the real schedule already raided keeps its remaining farming, in goal-priority order ahead of lower-priority goals. A node whose real attempts-left data is unavailable keeps its full daily attempt cap. For such a capped node, the attempts left stand in for its daily attempt cap when the row decides whether to show "N upgrades left" (Today's raid schedule shows what is left to farm). The Bonus Raids entries keep the same goal grouping, goal-priority order and exhausted-node exclusion described above, and SHALL all be shown, with no top-3 truncation, no "Show N more" or "Show less" control and no Full schedule link. When the limit is reached and no Bonus Raids entry remains, the Bonus raids card SHALL still be shown, with a caption stating that the limit is reached and no bonus raids are left. Below the limit, Today's plan and Bonus Raids render unchanged, except that when Today's plan has no entries but Bonus Raids do, the Bonus raids card SHALL take the plan's place (top 3 with "Show N more" and the Full schedule link, no limit caption) instead of sitting beside an empty plan card. When no synced attempt data is available the energy spent is 0, so Today renders unchanged; a daily energy limit of 0 or less is treated as no limit. The Raids Plan tab is unaffected.

Assumptions:

- Energy spent today is the account-wide real spend from synced attempts at standing campaign nodes (Today's "Today shows real daily energy usage" requirement); it is not capped at the limit.
- The daily energy limit is `planningSettings.dailyEnergy` (default 288 when unset).
- Below the limit, Bonus Raids are computed from an unlimited energy budget at each node's full daily attempt cap. Once the limit is reached they are the raids left today: an unlimited energy budget with each node capped at the player's real attempts left (`live-progress.battleAttempts[].attemptsLeft`, standing and event-campaign nodes alike).
- A node's daily attempt cap is shared by every goal and material raided there, in goal-priority order; the real attempts left lower that shared cap.
- Upgrades already farmed today are counted through the synced inventory, so each goal's remaining need already reflects them.

#### Scenario: A zero-raid upgrade appears as a bonus raid

- **GIVEN** an upgrade has an in-scope goal need but the real energy budget is exhausted before any raid against it is planned, while an unlimited budget would raid it at least once
- **WHEN** Today loads
- **THEN** that upgrade appears in Bonus Raids, listing the node(s) and raid count an unlimited budget would have used

#### Scenario: A partially-raided upgrade is excluded from Bonus Raids

- **GIVEN** an upgrade receives at least one raid in the real schedule but not enough to fully clear its need, and the daily energy limit is not yet spent
- **WHEN** Today loads
- **THEN** that upgrade does not appear in Bonus Raids, even though additional energy would raid it further

#### Scenario: Bonus Raids ordering

- **GIVEN** two or more upgrades qualify for Bonus Raids, belonging to goals of different priority
- **WHEN** Today loads
- **THEN** Bonus Raids lists them in the same goal-priority order as the main schedule, not by any other ranking

#### Scenario: Bonus Raids truncated to top 3 with a Show more control

- **GIVEN** 12 entries qualify for Bonus Raids and the energy limit is not spent
- **WHEN** Today loads
- **THEN** only the first 3 entries (in goal-priority order) are shown, followed by a "Show 5 more" control and a "Full schedule" link, and the remaining entries are not rendered until that control is activated

#### Scenario: Show more reveals 5 at a time

- **GIVEN** Bonus Raids is showing the top 3 of 12 entries
- **WHEN** the user activates "Show 5 more"
- **THEN** entries 4–8 are revealed in place, in the same goal-priority order, still grouped by goal, the control reads "Show 4 more", and a "Show less" control appears
- **AND WHEN** the user activates "Show 4 more"
- **THEN** all 12 entries are shown, there is no "Show N more" control, and "Show less" remains
- **AND WHEN** the user activates "Show less"
- **THEN** only the first 3 entries are shown again

#### Scenario: Full schedule opens Plan › Schedule

- **GIVEN** the energy limit is not spent and Bonus Raids has entries
- **WHEN** the user activates "Full schedule"
- **THEN** Plan › Schedule opens

#### Scenario: 3 or fewer entries need no truncation

- **GIVEN** 3 or fewer entries qualify for Bonus Raids
- **WHEN** Today loads
- **THEN** all qualifying entries are shown and no "Show N more" control is displayed

#### Scenario: No bonus raids available

- **GIVEN** the energy limit is not spent and no upgrade or shard qualifies for Bonus Raids (every farmable need is either fully covered by the real schedule or would still receive zero raids even with unlimited energy)
- **WHEN** Today loads
- **THEN** no Bonus raids card is rendered, and the next card in its stack moves up

#### Scenario: Bonus Raids become the only list once the energy limit is spent

- **GIVEN** the daily energy limit is 288 and the player's synced attempts today have spent 288 energy, and Bonus Raids has entries at nodes with attempts left
- **WHEN** Today loads
- **THEN** the Today's plan card is not shown, and the Bonus raids card takes its place as the only raids list, captioned that the daily energy limit has been reached

#### Scenario: Bonus Raids keep the top-3 truncation after the limit is spent

- **GIVEN** the energy limit is spent and 6 Bonus Raids entries have a node that is not exhausted
- **WHEN** Today loads
- **THEN** the top-3 truncation no longer applies: Bonus Raids shows all 6 entries in goal-priority order, with no "Show N more" control and no Full schedule link

#### Scenario: Below the energy limit nothing changes

- **GIVEN** the daily energy limit is 288 and the player's synced attempts today have spent 287 energy
- **WHEN** Today loads
- **THEN** Today's plan and Bonus Raids are both shown as before, with no limit-reached caption

#### Scenario: Empty plan below the limit

- **GIVEN** the energy limit is not spent, Today's plan shows no node (it has no entries, or every plan node has no real attempts left), and 4 entries qualify for Bonus Raids
- **WHEN** Today loads
- **THEN** the Today's plan card is not shown, and the Bonus raids card takes its place with the top 3 entries, a "Show 1 more" control, the Full schedule link and no limit-reached caption

#### Scenario: No synced attempts leave Today unchanged

- **GIVEN** no synced attempt data is available for today
- **WHEN** Today loads
- **THEN** the energy spent is 0, and Today's plan and Bonus Raids are shown as before

#### Scenario: Limit spent with no bonus raids left

- **GIVEN** the energy limit is spent and no Bonus Raids entry remains
- **WHEN** Today loads
- **THEN** the Today's plan card is not shown, and the Bonus raids card in its place says the daily energy limit is reached and no bonus raids are left

#### Scenario: Worked example, the top goal keeps its farming after the limit

- **GIVEN** the daily energy limit is 30 and the player's synced attempts today have spent 30 energy (3 raids at node B1, 10 energy each, daily cap 5, so 2 attempts are left)
- **AND** the top-priority goal (Snappa, Rank D1) still needs 8 of upgrade U1, dropped at B1 (1 per raid), and the second goal (Patermine, Rank B1) needs 2 of upgrade U2, dropped at node B2 (10 energy, cap 5, 1 per raid, no attempts used)
- **WHEN** Today loads
- **THEN** the real schedule at 30 energy would raid B1 3 times for U1 (30 energy), so the below-limit Bonus Raids would list only U2
- **AND** because the limit is spent, Bonus Raids instead list the raids left today: Snappa first with U1 at B1 for min(5 cap, 2 left) = 2 raids (8 − 2 = 6 still needed afterwards), then Patermine with U2 at B2 for min(5 cap, ⌈2 ÷ 1⌉ = 2) = 2 raids, 40 energy in all
- **AND** B1 shows no "N upgrades left" label, since its 2 planned raids reach its 2 attempts left

#### Scenario: A partly-raided upgrade stays in Bonus Raids after the limit

- **GIVEN** the energy limit is spent, and an upgrade received at least one raid in the real schedule but its node still has real attempts left today
- **WHEN** Today loads
- **THEN** that upgrade appears in Bonus Raids under its goal, at that node

#### Scenario: Raids left today respect the real attempts left

- **GIVEN** the energy limit is spent and a node with a daily cap of 5 has 2 real attempts left today
- **WHEN** Today loads
- **THEN** Bonus Raids plan at most 2 raids there across all goals, and a node with no real attempts left gets none

### Requirement: Campaign locations use the Character Lookup presentation

Today, Bonus Raids, and Today's Attempts SHALL render each battle as the primary element of its row: the campaign icon, the campaign's display name, and the node's difficulty-and-number label, ordered ahead of the resource or material it farms — which renders as a secondary caption. Raw battle ids SHALL only be used as a fallback when catalog presentation metadata is unavailable. When a resource is scheduled at more than one location, each location SHALL render as its own row at the same visual weight as a single location would, rather than a compact list of chips. The Raids Plan tab is unaffected by this requirement and continues to render locations as compact chips secondary to the resource.

The campaign name and the difficulty-and-number label SHALL be split across two lines:

1. The first line SHALL carry the campaign's display name together with its mirror qualifier, but no difficulty: a mirror track is a campaign of its own, so "Indomitus" and "Indomitus Mirror" SHALL read differently at a glance, while the Standard and Elite tiers of one track share a first line.
2. The second line SHALL carry the node's difficulty word, followed by the node number: "Standard 22", "Elite 40", "Standard 12" (on an "Indomitus Mirror" row), "Elite 40" (on a "Saim-Hann Mirror" row), "Extremis 3". A challenge node SHALL additionally carry a "B" suffix on its node number ("Extremis 12B"), matching the suffix the Raids Plan chips already show.

The second line SHALL NOT be a generic battle-number label that omits the difficulty: the tier must be recoverable from the two lines together, because a node number alone does not identify a battle.

Assumptions this requirement depends on:

- A storyline campaign group's tier is fully described by its difficulty (Standard/Elite) plus whether it is a mirror track; an event campaign group's tier is fully described by its Standard/Extremis difficulty plus its separate challenge flag.
- Both lines are localized game-data display text, resolved from catalog ids through the `campaigns` namespace rather than stored as display strings.

#### Scenario: A scheduled node has campaign presentation metadata

- **GIVEN** a scheduled battle resolves to catalog campaign metadata
- **WHEN** Today renders the battle
- **THEN** its row shows the campaign icon, the campaign name on the first line and the difficulty-and-node label on the second, ordered ahead of the resource it farms, with the resource name and progress rendered as a secondary caption

#### Scenario: A storyline elite node splits its difficulty onto the node line

- **GIVEN** a scheduled battle is node 40 of the Fall of Cadia Elite campaign
- **WHEN** Today renders the battle
- **THEN** its first line reads "Fall of Cadia" and its second line reads "Elite 40"

#### Scenario: A mirror track reads as its own campaign on the first line

- **GIVEN** Today's schedule includes node 22 of Indomitus Standard and node 12 of the Indomitus mirror track
- **WHEN** Today renders both
- **THEN** their first lines read "Indomitus" and "Indomitus Mirror", and their second lines read "Standard 22" and "Standard 12" respectively

#### Scenario: A mirror elite node keeps both qualifiers

- **GIVEN** a scheduled battle is node 40 of the Saim-Hann elite mirror campaign
- **WHEN** Today renders the battle
- **THEN** its first line reads "Saim-Hann Mirror" and its second line reads "Elite 40", retaining both the mirror and the elite qualifier

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

### Requirement: Only the active campaign event is farmable

Standing campaign battles SHALL be eligible for raid calculations only once the player has reached them: a battle's `battleIndex` (the zero-based index `campaign-progress` payloads are keyed against for that battle's `{campaignGroupId, type}` track — distinct from the display-only `nodeNumber`) SHALL be strictly less than that track's `highestCompletedBattleIndex`, per the `campaign-progress` chunk. That synced value is the highest index in the Tacticus API's `battles[]` list, which runs up to and including the frontier battle — the one not yet beaten with 3 medals, which therefore cannot be raided (the API carries no medal data; this matches V1's `nodeNumber <= battles.length - 1`). A track with no `campaign-progress` entry yet SHALL be treated as not reached (no battle eligible). Unlike event campaigns, `campaign-progress` carries no separate completed-challenge-ids list, so a standing challenge battle SHALL be gated by the same `battleIndex` comparison as every other battle in its track, not treated as reachable in any order. An unreached standing battle SHALL be excluded from raid calculations the same way an unreached event-campaign battle already is: it SHALL NOT be scheduled a real raid, and a resource whose only farm location is such a battle SHALL have no farmable location today — the same outcome, not a distinct status or fallback presentation.

A battle belonging to an event campaign SHALL be eligible only when both:

1. its campaign group id equals `live-progress.activeCampaignEventId`, and
2. its node has been reached by the player, per that campaign-group-and-type's **effective event progress**: for a non-challenge node, its `nodeNumber` SHALL be at most one greater than the effective completed battle count; for a challenge node, its battle id SHALL appear in the effective completed challenge ids.

Effective event progress SHALL be resolved per `{campaignGroupId, type}`, separately for the completed battle count and the completed challenge ids, as the player's saved campaign-event manual override value when it is not null, else the `campaign-events-progress` synced value, else no progress. This is the same resolution the Campaign Events progress page displays (see `campaign-event-progress-editing`).

When no campaign event is active, all event-campaign battles SHALL be excluded. When a battle's campaign group and type has neither a synced `campaign-events-progress` entry nor a manual override value, that battle's node-reached condition SHALL be treated as not met (excluded), since a synced entry only exists once the player has started that tier. The same holds for each value on its own: a non-challenge node SHALL be treated as not reached when the track has neither a synced completed battle count nor a manual one, even if a manual challenge value exists for that track. Today SHALL wait for the saved overrides to load before calculating, and SHALL show its existing error state if they fail to load, the same way it treats saved Onslaught progress.

Assumptions this requirement depends on:

- An event campaign's non-challenge nodes are numbered sequentially starting at 1 within each `{campaignGroupId, type}` track, and `completedBattleCount` counts consecutively from that start — reaching node N requires having completed nodes 1..N-1. A manual override's `completedBattleCount` is interpreted the same way.
- A standing campaign's `battleIndex` is assigned sequentially starting at 0 within each `{campaignGroupId, type}` track (covering both challenge and non-challenge battles), and `highestCompletedBattleIndex` counts consecutively from that start the same way `campaign-progress` already reports to the Progress page.
- `campaign-events-progress` and `live-progress.battleAttempts` are independent signals: the former reliably distinguishes Standard from Extremis (unlike the latter, which is deliberately not used for this eligibility check — see "Today's raid schedule shows what is left to farm" and "Today shows real daily energy usage" for why). The same independence holds between `campaign-progress` and `live-progress.battleAttempts` for standing campaigns — this eligibility check SHALL NOT be used as the signal for whether a real synced attempt exists at a battle; "Today's Attempts section" and "Today shows real daily energy usage" are governed only by `live-progress.battleAttempts`, independent of whether this requirement currently judges that battle reached.
- A manual override is the player's own statement of progress and is trusted over synced data even when it is lower than the synced value (for example after a sync that is known to be stale).

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
- **AND** there is no manual override value for that track's completed battle count
- **AND** the catalog's only farm location for a needed material is node 12 of the Extremis track (`AME12`)
- **WHEN** Today calculates the schedule
- **THEN** `AME12` is excluded from eligible battles, and that material has no farmable location today (it does not appear in the schedule or Bonus Raids as farmable at `AME12`)

#### Scenario: A reached Standard node in the same active event remains eligible

- **GIVEN** the active campaign event is "Adeptus Mechanicus" (`eventCampaign1`)
- **AND** `campaign-events-progress` for `{eventCampaign1, Standard}` shows `completedBattleCount: 15`
- **AND** there is no manual override value for that track's completed battle count
- **AND** a needed material's farm location is node 12 of the Standard track (`AMS12`)
- **WHEN** Today calculates the schedule
- **THEN** `AMS12` remains eligible, since `12 <= 15 + 1`

#### Scenario: A manual override makes a node without synced data eligible

- **GIVEN** the active campaign event is "Adeptus Mechanicus" (`eventCampaign1`)
- **AND** `campaign-events-progress` has no entry for `{eventCampaign1, Extremis}`
- **AND** the player's saved override for `{eventCampaign1, Extremis}` has `completedBattleCount: 11`
- **AND** the catalog's only farm location for a needed material is node 12 of the Extremis track (`AME12`)
- **WHEN** Today calculates the schedule
- **THEN** `AME12` is eligible, since `12 <= 11 + 1`

#### Scenario: A manual override lower than synced progress wins

- **GIVEN** the active campaign event is "Adeptus Mechanicus" (`eventCampaign1`)
- **AND** `campaign-events-progress` for `{eventCampaign1, Standard}` shows `completedBattleCount: 15`
- **AND** the player's saved override for `{eventCampaign1, Standard}` has `completedBattleCount: 5`
- **AND** a needed material's only farm location is node 12 of the Standard track (`AMS12`)
- **WHEN** Today calculates the schedule
- **THEN** `AMS12` is excluded, since `12 > 5 + 1`

#### Scenario: Challenge override and synced count resolve independently

- **GIVEN** the active campaign event is "Adeptus Mechanicus" (`eventCampaign1`)
- **AND** `campaign-events-progress` for `{eventCampaign1, Standard}` shows `completedBattleCount: 15` and `completedChallengeBattlesIds: []`
- **AND** the player's saved override for that track has `completedBattleCount: null` and `completedChallengeBattlesIds: ["AMS7B"]`
- **WHEN** Today calculates the schedule
- **THEN** non-challenge nodes use the synced count 15 and challenge node `AMS7B` is eligible

#### Scenario: A challenge-only override does not make regular nodes reachable

- **GIVEN** the active campaign event is "Adeptus Mechanicus" (`eventCampaign1`)
- **AND** `campaign-events-progress` has no entry for `{eventCampaign1, Extremis}`
- **AND** the player's saved override for that track has `completedBattleCount: null` and `completedChallengeBattlesIds: ["AME3B"]`
- **WHEN** Today calculates the schedule
- **THEN** challenge node `AME3B` is eligible and no regular Extremis node is, not even node 1

#### Scenario: Overrides fail to load

- **GIVEN** the saved campaign-event overrides request fails
- **WHEN** Today loads
- **THEN** Today shows its existing error state rather than calculating a schedule from synced data alone

#### Scenario: A goal-pinned farm location that hasn't been reached is excluded the same way

- **GIVEN** a goal's configuration pins a specific event-campaign node as its farm location (via `farmingLocationIds`)
- **AND** that node has not been reached per the effective event progress, exactly as in the "unreached Extremis node" scenario above
- **WHEN** Today calculates the schedule
- **THEN** that node is excluded from eligible battles regardless of being explicitly pinned, and the goal shows no farmable candidates for that resource today — the same outcome as an auto-selected unreached location, not a special case or a different failure mode

#### Scenario: An unreached standing node is excluded from raid calculations

- **GIVEN** `campaign-progress` for `{campaign1, Standard}` shows `highestCompletedBattleIndex: 10`
- **AND** the catalog's only farm location for a needed material is the Standard track's battle at `battleIndex: 13`
- **WHEN** Today calculates the schedule
- **THEN** that battle is excluded from eligible battles, since `13 >= 10`, and that material has no farmable location today

#### Scenario: The frontier standing node is excluded

- **GIVEN** `campaign-progress` for `{campaign1, Standard}` shows `highestCompletedBattleIndex: 10`
- **AND** a needed material's only farm location is the Standard track's battle at `battleIndex: 10`
- **WHEN** Today calculates the schedule
- **THEN** that battle is excluded from eligible battles, since it is the frontier battle and may not have 3 medals yet

#### Scenario: A cleared standing node remains eligible

- **GIVEN** `campaign-progress` for `{campaign1, Standard}` shows `highestCompletedBattleIndex: 10`
- **AND** a needed material's farm location is the Standard track's battle at `battleIndex: 9`
- **WHEN** Today calculates the schedule
- **THEN** that battle remains eligible, since `9 < 10`

#### Scenario: A standing track with no progress entry has no battle eligible

- **GIVEN** `campaign-progress` has no entry for `{campaign2, Elite}`
- **AND** the Elite track's battle at `battleIndex: 0` and its battle at `battleIndex: 1` both farm a needed material
- **WHEN** Today calculates the schedule
- **THEN** neither battle is eligible

#### Scenario: A real synced attempt at an unreached standing battle still counts toward Today's Attempts and real energy usage

- **GIVEN** `campaign-progress` for `{campaign3, Standard}` shows `highestCompletedBattleIndex: 4` (battle at `battleIndex: 9` is therefore excluded from raid calculations)
- **AND** `live-progress.battleAttempts` nonetheless records `attemptsUsed: 2` at `{campaign3, Standard, battleIndex: 9}` today
- **WHEN** Today computes Today's Attempts and real daily energy usage
- **THEN** that attempt still appears in Today's Attempts with `attemptsUsed: 2`, and its energy is still included in the real energy-used total — this requirement's eligibility judgment does not suppress a real synced attempt record

### Requirement: Farm node selection prefers energy efficiency, then value

When a resource needed by an in-scope goal has more than one eligible farm location, the schedule SHALL use every location whose energy cost per expected item (`energyCost / dropRate`, rounded to two decimals as V1 does) ties the lowest such value among the eligible locations, and no others. All tied locations SHALL remain available for raiding on the same day, each limited by its own daily attempt cap. Among the tied locations, the schedule SHALL raid the location with the higher expected gold reward (`expectedGold`, served by the game catalog) first, so that its daily attempts are used before the next tied location's. A location with no `expectedGold` (its battle awards no guaranteed gold) SHALL be treated as having the lowest possible value for this ordering, so it is raided after any tied location that does report a value, but it SHALL still be used. Locations equal on both efficiency and `expectedGold` SHALL keep their existing order. This selection SHALL NOT apply when the goal restricts its own farm locations, where the restricted set is used as chosen.

Assumptions this requirement depends on:

- `expectedGold` is a property of the battle, not of the specific resource being farmed there — two different resources dropped by the same battle report the same `expectedGold`.
- The gold ordering applies only among locations already tied on rounded energy cost per expected item; it never excludes a tied location and never overrides the primary energy-efficiency selection.
- A location's actual expected items per raid are its unrounded drop rate; rounding is used only to decide whether locations tie.

#### Scenario: Two locations tie on efficiency, one pays more gold

- **GIVEN** a needed material's only two eligible farm locations are "Fall of Cadia Elite" node 13 (10 energy per raid, one guaranteed copy per raid, guaranteed gold 109-165, so `expectedGold` 137) and "Saim-Hann Mirror Elite" node 19 (10 energy per raid, one guaranteed copy per raid, guaranteed gold 123-180, so `expectedGold` 151.5), each with a daily cap of 6 raids
- **WHEN** Today calculates the schedule
- **THEN** both locations compute the same energy cost per expected item (10), so both are used
- **AND** "Saim-Hann Mirror Elite" node 19 (the higher `expectedGold`) is raided first, and "Fall of Cadia Elite" node 13 is raided after it once node 19's cap is used or the material's need is met

#### Scenario: A second tied node adds daily capacity

- **GIVEN** a material needs 10 items, each of two tied nodes yields about 0.43 items per raid at 10 energy per raid with a daily cap of 6 raids, and the day has enough energy for both
- **WHEN** the day is scheduled
- **THEN** the material is raided at both nodes for up to 6 raids each, farming about 5.2 items that day rather than about 2.6

#### Scenario: Near-equal efficiency counts as a tie

- **GIVEN** two eligible locations whose energy cost per expected item is 33.331 and 33.334
- **WHEN** Today calculates the schedule
- **THEN** both round to 33.33, so they tie and both are used

#### Scenario: One location is strictly more efficient than another

- **GIVEN** a needed material's two eligible farm locations differ in energy cost per expected item after rounding to two decimals, and the less-efficient location has a higher `expectedGold`
- **WHEN** Today calculates the schedule
- **THEN** only the strictly more energy-efficient location is used; the gold ordering never overrides a genuine efficiency difference

#### Scenario: A tied location has no guaranteed gold

- **GIVEN** two locations tie on energy cost per expected item, and one of them has no guaranteed gold reward on its battle (`expectedGold` is null)
- **WHEN** Today calculates the schedule
- **THEN** both locations are used, and the location that reports an `expectedGold` value is raided before the one with none

#### Scenario: A goal's own farm locations are left as chosen

- **GIVEN** a goal restricts its farm locations to specific battles
- **WHEN** the schedule is calculated
- **THEN** the restricted locations are used as chosen, and no efficiency tie rule adds or removes any of them

### Requirement: Today's Attempts section

Today SHALL show a "Today's attempts" card (see "Today lays out its sections as a dashboard"), listing every campaign node — standing (standard/mirror/elite/eliteMirror) or event-campaign — the player has actually raided today — real synced attempts (`live-progress.battleAttempts[].attemptsUsed > 0`), account-wide, not scoped to the current project's schedule or Bonus Raids. Each listed location SHALL show its real numeric raid count today (`attemptsUsed`), including when its real synced attempts remaining are zero. An event-campaign attempt record is matched to its battle by campaign group, `type` (Standard/Extremis), and battle index, distinguishing the two tiers rather than excluding them.

Each location SHALL be one compact row: the material icon, the campaign icon, the campaign name and node label on one line that wraps rather than truncates, and the attempts used ("6 attempts") at the end of the row. The material's name SHALL be part of the row's accessible name. The card's header SHALL show the number of rows and the total attempts used ("5 nodes · 29").

#### Scenario: An attempted location appears in Today's Attempts

- **GIVEN** the player has real synced attempts today at a standing-campaign node
- **WHEN** Today loads
- **THEN** that location appears in the Today's attempts card as one row showing its real raid count today

#### Scenario: An attempted event-campaign location appears in Today's Attempts

- **GIVEN** the player has real synced attempts today at an event-campaign node (for example, 6 raids at a node in the "Adepta Sororitas" event campaign's Standard tier)
- **WHEN** Today loads
- **THEN** that location appears in the Today's attempts card showing its real raid count today, the same as a standing-campaign location would

#### Scenario: An exhausted location shows a numeric actual count

- **GIVEN** a location listed in Today's Attempts has zero real attempts left today and a positive real number of attempts used
- **WHEN** Today loads
- **THEN** that location's entry shows the numeric attempts-used value and not "Max raids"

#### Scenario: Today's Attempts includes locations unrelated to the current project

- **GIVEN** the player has real synced attempts today at a standing-campaign node with no relevance to the current project's schedule or Bonus Raids
- **WHEN** Today loads
- **THEN** that location still appears in Today's Attempts

#### Scenario: Header totals

- **GIVEN** the player has raided 5 nodes today, with 6, 6, 10, 5 and 2 attempts
- **WHEN** Today loads
- **THEN** the Today's attempts header shows 5 nodes and 6 + 6 + 10 + 5 + 2 = 29 attempts

#### Scenario: No attempts recorded yet today

- **GIVEN** the player has no real synced attempts recorded yet today
- **WHEN** Today loads
- **THEN** the Today's attempts card shows an explicit empty state, not a blank or hidden card

### Requirement: Today shows real daily energy usage

Today SHALL show, in its Daily energy used glance tile, the energy actually spent today against the player's configured daily energy (`planningSettings.dailyEnergy`): a progress bar and the value "used / daily" (for example "396 / 938"). The energy used is computed from the player's real synced attempt counts (not the plan's simulated schedule) across every campaign node on the account — standing or event-campaign, including nodes unrelated to the currently selected project — each priced at that node's energy cost. The energy used SHALL NOT be capped at the daily energy. The bar fills to at most 100%, and its accessible value text SHALL state the uncapped percentage of the daily energy used. When the daily energy is 0 (no limit), the value SHALL be the energy used alone, with no bar and no percentage. Once the daily energy limit is reached, the tile SHALL switch to its over-limit state (see "Today shows glance tiles").

An event-campaign attempt's energy cost is included using the same per-node pricing as a standing-campaign attempt, resolved to the correct tier (Standard vs Extremis) via the attempt record's `type`.

#### Scenario: Usage reflects real attempts across the whole account

- **GIVEN** the player has real synced attempts recorded today at standing-campaign nodes outside the current project's schedule
- **WHEN** Today loads
- **THEN** the energy-usage indicator includes those attempts' energy cost in its total, not only attempts at nodes within this project's schedule

#### Scenario: Event-campaign attempts are included in the total, priced the same as standing attempts

- **GIVEN** the player has real synced attempts recorded today at an event campaign's nodes
- **WHEN** Today loads
- **THEN** the energy-usage indicator's total includes those event-campaign attempts' energy cost, priced the same way a standing-campaign attempt's cost is

#### Scenario: Usage can exceed the daily energy budget

- **GIVEN** the player's real total energy cost from today's synced attempts exceeds their configured daily energy setting
- **WHEN** Today loads
- **THEN** the energy-usage indicator shows the energy used above the daily energy (for example "663 / 638"), uncapped, its accessible value text states the percentage above 100%, and the tile is in its over-limit state

#### Scenario: No real usage yet today

- **GIVEN** the player has no recorded real attempts yet today
- **WHEN** Today loads
- **THEN** the energy-usage indicator shows 0 of the daily energy (for example "0 / 288") with an empty bar

#### Scenario: No daily energy limit

- **GIVEN** the player's daily energy is 0 (no limit) and they have spent 400 energy today
- **WHEN** Today loads
- **THEN** the energy-usage value reads "400", with no "/ 0" and no progress bar

#### Scenario: Real usage data is part of Today's readiness gate

- **GIVEN** the player's real synced attempt data has not yet loaded
- **WHEN** Today would otherwise render
- **THEN** Today defers rendering the energy-usage indicator until that data is available, consistent with how Today already gates rendering on its other required data sources

### Requirement: Today states the detected campaign event and its remaining time

Today SHALL show a campaign-event status reporting the campaign event it has detected as active and, only when the active calendar occurrence is confirmed, how long remains until that event ends. The status SHALL be a glance tile labelled "Campaign event" whose value is the detected event — its campaign icon, its name, and its end-time status. The value SHALL wrap rather than truncate.

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
- **WHEN** Today renders the Campaign event tile
- **THEN** the detected event's campaign icon renders beside its name

#### Scenario: On a narrow page the status is the last row of the glance card

- **GIVEN** Today's content is narrower than 42rem
- **WHEN** Today renders its glance tiles
- **THEN** the Campaign event is the last row of the single glance card, after Daily energy used in reading order, with its value aligned to the end like the other rows

#### Scenario: On a wide page the status is the last tile

- **GIVEN** Today's content is at least 42rem wide
- **WHEN** Today renders its glance tiles
- **THEN** the Campaign event tile is the last tile in the glance row, at the same size as the other tiles; there is no separate header block

#### Scenario: A long event status wraps

- **GIVEN** the German UI and a detected event whose status does not fit on one line of its tile
- **WHEN** Today renders the Campaign event tile
- **THEN** the status wraps onto further lines and is shown in full

#### Scenario: The status line is part of Today's guided tour

- **GIVEN** a user starts Today's guided tour on either a mobile or a desktop viewport
- **WHEN** the tour reaches the campaign-event status
- **THEN** it highlights the Campaign event tile with its own step explaining what the detected campaign event governs and why an unconfirmed end has no countdown

### Requirement: Today's project selector defaults to all goals

Today SHALL provide its own project selector that defaults to all goals; it is not shared with Schedule (see `daily-raids-plan` "Schedule owns its project selection"). With no project selected Today SHALL NOT derive its scope from Default; the scope with and without a selection is defined by "Today's schedule scope". The selection SHALL NOT be persisted across a full page reload. A failed goal load SHALL show retry; a successful empty set SHALL show a no-active-goals state.

#### Scenario: Default selection is all goals

- **GIVEN** Active goals in several projects
- **WHEN** Today loads with no prior selection made this session
- **THEN** the selector shows all goals and Today shows the global schedule, including every project's Active goals

#### Scenario: Selecting a project narrows the schedule

- **WHEN** the user selects a project in Today's project selector
- **THEN** the schedule, Bonus Raids section and empty states are recomputed for that project's Active goals only, in global order

#### Scenario: Returning to all goals

- **GIVEN** a project is selected
- **WHEN** the user selects all goals
- **THEN** Today shows the account-wide schedule again

#### Scenario: Project list fails to load

- **GIVEN** project-list loading fails while global goals load successfully
- **WHEN** Today loads
- **THEN** Today renders the global schedule and does not misreport project-list failure as a schedule failure

#### Scenario: Project list loads without projects

- **GIVEN** no projects are available but global goals load successfully
- **WHEN** Today loads
- **THEN** Today derives its state from the global Active goals, not from project count

### Requirement: Today is not event-optimised

Today (the Raids tab) SHALL build its schedule without any Home Screen Event scoring: its schedule is event-agnostic (see `daily-raids-home-screen-event` "Event points affect only the HSE tab's farm list"), and Today SHALL NOT show an event status line, upcoming-event notice, event-points figure or event switch. Event-point optimisation lives only on the HSE tab (`daily-raids-home-screen-event`).

#### Scenario: Active event does not change Today

- **GIVEN** Machine Hunt is active
- **THEN** no event UI is shown on Today

### Requirement: Today requires a populated Onslaught rewards dataset and tolerates a missing reward row

Today SHALL treat the catalog's Onslaught rewards dataset as loaded only when it contains at least one row; an empty dataset (for example during a first sync or a sync that has not reached that dataset yet) SHALL keep Today in its loading state, consistent with how Today already gates rendering on its other required data sources. Once loaded, a reward row missing for a specific sector and tier SHALL NOT prevent Today from rendering: the affected goal's Onslaught contribution SHALL be treated as zero and the rest of the schedule SHALL render.

#### Scenario: Empty rewards dataset keeps Today loading

- **GIVEN** the catalog's Onslaught rewards dataset is present but contains no rows
- **WHEN** Today would otherwise render
- **THEN** Today defers rendering until the dataset has rows

#### Scenario: Missing row for the player's sector and tier

- **GIVEN** the Onslaught rewards dataset has rows but none for the sector and tier of a goal's alliance progress
- **WHEN** Today renders
- **THEN** Today renders its schedule with that goal contributing no Onslaught shards, and no error is raised to the user

### Requirement: Today includes Upgrade goals

Today's schedule and Bonus Raids SHALL include farming for Active Upgrade goals in the selected
project scope, ordered by global priority like any other goal. Each entry SHALL identify the goal
it farms for (see "Schedule entries show which goal they farm for"), and the goal's target label
SHALL describe the upgrade quantity.

#### Scenario: Upgrade goal is scheduled

- **GIVEN** an Active Upgrade goal for `upgArmC002` × 5 with 0 owned, in the selected project
- **WHEN** Today is shown
- **THEN** a farming entry for `upgArmC002` appears, attributed to that goal

#### Scenario: Fully stocked goal is absent

- **GIVEN** the player already owns 5 `upgArmC002`
- **WHEN** Today is shown
- **THEN** no entry for that goal appears

### Requirement: Today's raid schedule shows what is left to farm

Given a project with in-scope goals that have farmable upgrade or shard needs, Today SHALL show one card per upgrade or shard that the day's energy budget can raid, each listing the battle node(s) to raid, for today only (not a multi-day plan).

A node whose real synced attempts today have reached zero remaining (`live-progress.battleAttempts[].attemptsLeft === 0`, matched by campaign group, type, and battle index — standing or event-campaign alike) SHALL be excluded from its resource card's location listing; it appears only in the account-wide "Today's Attempts" section instead (see that requirement). This exclusion is based on the player's real synced attempts, not the simulated plan's own per-node attempt allocation: a node SHALL be excluded even if the simulated plan never scheduled a raid there today, and a node the simulated plan would otherwise treat as fully allocated SHALL remain listed until the player's real attempts there are actually exhausted. A node whose real attempts-left data is unavailable SHALL be treated as not exhausted rather than guessed at. The same treatment applies to node listings in Bonus Raids.

A node that remains listed (real attempts not exhausted) SHALL NOT show a raid count, since drops are random and a planned count is only an estimate. When its planned raids stop below its daily attempt cap and the expected drops of a full day of attempts at that node (daily attempt cap × drop rate) cover what the goal still needs when it reaches that node, it SHALL instead show that need, rounded up, as "N upgrades left" (or "N shards left" for a shard resource), so the player knows they can stop early. A node whose planned raids reach its daily attempt cap, or whose full day of attempts would not be expected to drop what is still needed (for example when the plan stops below the cap only because the day's energy runs out), SHALL show no count or label at all: the player raids it out. A node without a daily attempt cap always shows the label. Real raid counts appear only in Today's Attempts.

The schedule SHALL respect, in this order of application:

1. Priority-ordered shared inventory consumption: when two or more in-scope goals need the same upgrade, existing inventory is applied to the higher-priority goal's need first, and a lower-priority goal only draws against what remains.
2. Per-battle daily-attempt caps: raids planned against a single battle node SHALL NOT exceed that node's daily attempt cap, shared across every upgrade farmable from that node.
3. The user's configured daily energy (`planningSettings.dailyEnergy`, default 288 when unset) as the total energy budget for the day.

#### Scenario: Schedule respects the daily energy budget

- **GIVEN** a project whose in-scope goals' total farmable need would cost more energy than `planningSettings.dailyEnergy` to fully clear
- **WHEN** Today loads
- **THEN** the schedule includes only as many raids as the daily energy budget affords, in the same priority order the engine allocates energy

#### Scenario: Shared inventory splits by goal priority

- **GIVEN** two in-scope goals in the same project need the same upgrade, existing inventory covers only part of the combined need, and the higher-priority goal's need is fully covered by that inventory
- **WHEN** Today loads
- **THEN** the schedule plans raids for only the lower-priority goal's uncovered remainder of that upgrade, not the combined need

#### Scenario: A battle node's daily cap limits raids

- **GIVEN** an upgrade's cheapest farmable node has a daily attempt cap lower than what the energy budget could otherwise afford
- **WHEN** Today loads
- **THEN** the schedule never plans more raids at that node than its daily attempt cap allows, for that day

#### Scenario: A battle node's daily cap is shared across goals

- **GIVEN** two different in-scope goals both need raids at the same battle node on the same day, and their combined want for that node would exceed its daily attempt cap
- **WHEN** Today loads
- **THEN** the combined raids planned at that node across both goals never exceed its daily attempt cap, even though each goal is otherwise within its own energy allowance

#### Scenario: No farmable need

- **GIVEN** a project with no in-scope goals, or in-scope goals with no unmet farmable upgrade or shard needs
- **WHEN** Today loads
- **THEN** Today shows an explicit empty message stating there is nothing to raid today, not a blank list

#### Scenario: A node with zero real attempts left is excluded from the schedule

- **GIVEN** a node's real synced attempts today have reached zero remaining
- **WHEN** Today loads
- **THEN** that node is excluded from its resource card's location listing, and appears only in Today's Attempts

#### Scenario: An event-campaign node with zero real attempts left is excluded the same as a standing node

- **GIVEN** an event-campaign node's real synced attempts today (matched by its campaign group, type, and battle index) have reached zero remaining
- **WHEN** Today loads
- **THEN** that node is excluded from its resource card's location listing the same way a standing-campaign node at zero remaining attempts would be, and appears only in Today's Attempts

#### Scenario: A node with real attempts remaining stays listed

- **GIVEN** a node with a positive number of real synced attempts left today
- **WHEN** Today loads
- **THEN** that node's listing remains in the resource card

#### Scenario: A node planned up to its daily cap shows no label

- **GIVEN** a node remains listed (its real attempts are not exhausted) and its planned raid count equals its daily attempt cap
- **WHEN** Today loads
- **THEN** that node's listing shows no raid count and no "upgrades left" label

#### Scenario: The simulated plan's own allocation does not by itself exclude a node

- **GIVEN** two different in-scope goals each raid the same battle node on the same day, and their combined _simulated_ raid count at that node equals its daily attempt cap, but the player's real synced attempts at that node are not yet exhausted
- **WHEN** Today loads
- **THEN** that node remains listed in both goals' resource cards — the simulated plan reaching a node's cap does not by itself exclude it

#### Scenario: An entry's every location has zero real attempts left

- **GIVEN** an upgrade or shard's every farmable location today (across Today's schedule and Bonus Raids) has zero real attempts left
- **WHEN** Today loads
- **THEN** that upgrade/shard's card is omitted from Today's schedule (or Bonus Raids) for the day, and its locations are represented only via Today's Attempts if the player actually attempted them there

#### Scenario: A node planned below its daily cap shows the upgrades left

- **GIVEN** a goal still needs 3 of an upgrade when the plan reaches a node, the plan raids that node fewer times than its daily attempt cap, a full day of attempts there is expected to drop at least 3, and the node's real synced attempts today have not reached zero remaining
- **WHEN** Today loads
- **THEN** that node's listing shows "3 upgrades left" and no raid count

#### Scenario: A node whose full day of attempts cannot cover the need shows no label

- **GIVEN** a goal still needs 15 of an upgrade when the plan reaches a node with a daily attempt cap of 10 and an expected 0.6 drops per raid, and the plan raids it below the cap because the day's energy runs out
- **WHEN** Today loads
- **THEN** that node's listing shows no raid count and no "upgrades left" label

#### Scenario: Upgrades left count what earlier nodes are expected to drop

- **GIVEN** a goal needs 6 of an upgrade, the plan raids its first node up to that node's daily cap with an expected 4 drops, and then raids a second node below its cap whose full day of attempts is expected to drop at least 2
- **WHEN** Today loads
- **THEN** the first node shows no label and the second node shows "2 upgrades left"

#### Scenario: A shard resource says shards left

- **GIVEN** a goal still needs 7 shards of a unit when the plan reaches a node, planned below that node's daily cap, and a full day of attempts there is expected to drop at least 7 shards
- **WHEN** Today loads
- **THEN** that node's listing shows "7 shards left"

### Requirement: Schedule location labels are shown in full

Campaign names and node labels in Today's schedule rows, and in the shared location row reused by the Home raids widget, SHALL be rendered in full in every supported locale (en, de, es, fr) at every supported viewport width. When a label does not fit on one line it SHALL wrap rather than be cut off with an ellipsis.

#### Scenario: Long localized campaign name on mobile

- **WHEN** the app language is de or fr and a schedule row's campaign name is wider than the label column below 768px
- **THEN** the full campaign name is visible, wrapped onto additional lines, and the row's icons and raid-count badge remain aligned

#### Scenario: English labels are unchanged

- **WHEN** the app language is en and every label fits on one line
- **THEN** rows render on a single line exactly as before

### Requirement: Today quick filters

Today SHALL show a quick-filter chip row, captioned "Quick filters", next to the Raids Filters trigger, with two chips: **Fewer raids** and **Combine goals**. Either, both or neither MAY be on. Each chip SHALL carry a tooltip explaining what it does, and while a chip is on Today SHALL show one line under the row stating what it changes. The state SHALL live in the URL (`quick` search parameter, a comma-separated list; unknown values are ignored; the earlier value `bottlenecks` SHALL be read as `combineGoals`) so reload and shared links restore it, and it SHALL NOT be stored anywhere else, so leaving Today without the parameter shows the defaults.

The chips SHALL change only Today's plan and Bonus Raids (including the raids-left list after the daily energy limit). Plan > Schedule, Goals estimates and dates, Insights, the HSE and HRE tabs and the Home raids widget SHALL be computed as if both chips were off. The chips combine with the applied Raids Filters.

**Fewer raids**: after the preferred nodes are chosen (least energy per item among nodes that pass the Raids Filters), only the node(s) with the highest energy cost per battle SHALL be kept. Tied nodes left after that keep the expected-gold ordering. A goal's pinned farm locations SHALL be used as chosen.

**Combine goals** (in the spirit of V1's "By total materials" farm order): Today SHALL plan raids as if every in-scope goal (all goals, or the selected project's goals) were one goal, ignoring goal priority when spending energy. Inventory SHALL still be allocated to goals in priority order, and shop and Onslaught supply SHALL still be applied per goal in priority order. The remaining need of every in-scope goal, summed per resource across all of the goal's stages, SHALL form one pool, and the day's energy SHALL be spent on that pool longest-to-finish resource first (then greatest energy cost), with each node's daily attempt cap shared as usual. A resource SHALL be farmed at the nodes chosen for the highest-priority goal that needs it. Each raid entry SHALL be credited to the highest-priority goal still needing that resource (for goal totals). Today's plan and Bonus Raids SHALL then be shown as one combined list with no goal headers, ordered by each resource's pooled urgency: the energy to clear the resource's whole pooled need at the nodes it is farmed at, most first (the order Insights ranks its bottlenecks in), then the days to finish it, longest first. Bonus Raids' top-entries cut SHALL be taken from that order. Each resource card SHALL show the have/need over every in-scope goal. This overrides "Today and Bonus Raids prioritize long-running resources" and goal-by-goal spending while the chip is on.

#### Scenario: Chips off

- **GIVEN** the URL has no `quick` parameter
- **WHEN** Today loads
- **THEN** the schedule is identical to the schedule without this requirement

#### Scenario: Fewer raids picks the costlier tied node

- **GIVEN** a material's two cheapest nodes tie on energy per item, one at 6 energy per battle and one at 12
- **WHEN** Fewer raids is on
- **THEN** Today raids only the 12-energy node for that material, and the note under the row explains that tied locations with more energy per battle are used to save raids

#### Scenario: Combine goals farms a lower-priority goal's slow material first

- **GIVEN** goal A (priority 1) needs a material that finishes in 2 days and goal B (priority 2) needs a Legendary material that takes 9 days, and the day's energy covers only one of them
- **WHEN** Combine goals is on
- **THEN** Today raids goal B's Legendary material, listed first in one combined list with no goal headers, and the note under the row says Plan and Goals dates still follow goal priority

#### Scenario: Combine goals pools all stages

- **GIVEN** a rank goal over several ranks whose later stage needs a slow material
- **WHEN** Combine goals is on
- **THEN** that later-stage material is part of the pool and can be raided today

#### Scenario: Both chips on

- **WHEN** Fewer raids and Combine goals are both on
- **THEN** the pooled schedule uses the Fewer raids node choice

#### Scenario: Other surfaces ignore the chips

- **GIVEN** a chip is on
- **THEN** Plan > Schedule, Goals, Insights, the HSE and HRE tabs and the Home raids widget are unchanged

#### Scenario: State in the URL

- **WHEN** the player turns on Combine goals
- **THEN** the URL gains `quick=combineGoals`; reloading keeps the chip on, and opening Today from the navigation shows both chips off

### Requirement: Today lists today's Onslaught runs

The Raids tab SHALL show an "Onslaught" card in the dashboard (see "Today lays out its sections as a dashboard"), listing one row per unit that today's plan spends Onslaught tokens on, with its expected runs and shards, in goal-priority order. The runs SHALL come from the same plan run as Today's raids, so tokens are shared across goals in priority order exactly as Plan > Schedule's day 1 shows them. The card header SHALL show the whole tokens to spend today: the sum of the rows' expected runs, rounded up. The Onslaught glance tile SHALL show the same whole-token total. When no goal needs an Onslaught run today, neither the card nor the tile SHALL be shown. Raids Filters SHALL NOT affect it.

Assumptions:

- One Onslaught run costs one token, and the plan spends at most the catalog's Onslaught runs per day.
- Expected runs are fractional because shard drops per run are an expectation, not a guarantee.

Worked example: goal g1 (priority 1, Bellator) is planned 1.2 runs for 6 expected shards and goal g2 (priority 2, Aleph-Null) 0.5 runs for 2 expected shards. The rows are Bellator "≈1.2 runs · 6 shards", then Aleph-Null "≈0.5 runs · 2 shards", and the header and the tile show 1.2 + 0.5 = 1.7, rounded up to 2 tokens.

#### Scenario: Runs are listed in goal priority

- **GIVEN** today's plan spends Onslaught tokens on two goals' units
- **WHEN** the user opens Raids
- **THEN** the Onslaught card lists the higher-priority goal's unit first, each row with its expected runs and shards

#### Scenario: Nothing to run

- **GIVEN** no goal needs an Onslaught run today
- **THEN** the Raids tab has no Onslaught card and no Onslaught tile

#### Scenario: Tour step

- **WHEN** the user runs the Today tour with the Onslaught card shown
- **THEN** a localized step explains the card, on desktop and mobile

### Requirement: Today lays out its sections as a dashboard

On Dailies › Raids, Today SHALL show, from top to bottom: one controls row, a row of glance tiles (see "Today shows glance tiles"), and a grid of cards: Today's plan, Bonus raids, Shop recommendations, Onslaught and Today's attempts. Each card SHALL be a named region with its own level-2 heading.

The controls row SHALL hold the "Quick filters" caption and its two chips, then the project selector, the Raids Filters trigger and the Planning settings trigger, in that order. When the row is too narrow it SHALL wrap, chips first, without hiding or truncating any control. While a quick filter is on, its one-line note SHALL appear on its own line directly below the row.

The card grid SHALL size its tracks from the width of the page content, not the viewport, so an open or collapsed section menu is accounted for:

- at least 84rem: four equal tracks. Today's plan spans tracks 1–2, the third track stacks Bonus raids then Shop recommendations, and the fourth stacks Onslaught then Today's attempts;
- at least 42rem: two tracks. Today's plan spans both, and the two stacks form the second row side by side in the same pairs;
- below 42rem: one track, with every card stacked.

Cards SHALL keep their own height. A card that sits under another in a stack SHALL start directly below it, and a card that is not rendered SHALL let the next card in its stack move up. The reading and keyboard focus order SHALL be Today's plan, Bonus raids, Shop recommendations, Onslaught, Today's attempts at every track count, and it SHALL match the visual order.

On this page only, the content width cap SHALL be 150rem (2400px) instead of the app's default 100rem (1600px).

Assumptions:

- One resource card needs 20rem to stay readable, so no track is narrower than 20rem except in the one-track layout on a phone.
- The 768px desktop/mobile breakpoint is the app's existing `useIsMobile()` split. Below it this change renders the same cards in the one-track layout; a dedicated mobile form is a separate change.

#### Scenario: Four tracks on a wide monitor

- **GIVEN** a 2560px-wide window with the section menu open
- **WHEN** the user opens Dailies › Raids
- **THEN** the content is at most 2400px wide, Today's plan spans the first two of four tracks, Bonus raids sits above Shop recommendations in the third, and Onslaught sits above Today's attempts in the fourth

#### Scenario: Two tracks on a narrow desktop

- **GIVEN** the page content is between 42rem and 84rem wide (for example a 1024px window with the section menu open)
- **WHEN** Today renders
- **THEN** Today's plan spans the full width, and below it the Bonus raids / Shop recommendations stack and the Onslaught / Today's attempts stack sit side by side

#### Scenario: One track on a phone

- **GIVEN** a 390px-wide viewport
- **WHEN** Today renders
- **THEN** the cards stack in the order Today's plan, Bonus raids, Shop recommendations, Onslaught, Today's attempts, with no horizontal scroll

#### Scenario: Focus order follows the cards

- **WHEN** a keyboard user tabs through Today at any width
- **THEN** focus moves through Today's plan, then Bonus raids, then Shop recommendations, then Onslaught, then Today's attempts

#### Scenario: Missing cards close up

- **GIVEN** there are no Bonus raids entries below the energy limit and no goal needs an Onslaught run today
- **WHEN** Today renders with four tracks
- **THEN** Shop recommendations is at the top of the third track and Today's attempts is at the top of the fourth, with no empty space reserved above them

#### Scenario: Wider cap applies to Raids only

- **WHEN** the user opens Dailies › HSE on the same 2560px window
- **THEN** its content is still capped at 1600px

#### Scenario: Controls wrap without truncation

- **GIVEN** the German UI and a page content width too narrow for the controls on one line
- **WHEN** Today renders
- **THEN** the controls wrap onto a second line, the chips first, and every label is shown in full

#### Scenario: Quick filter note under the row

- **WHEN** the player turns on Combine goals
- **THEN** its one-line note appears directly below the controls row

#### Scenario: Tour steps point at the cards

- **WHEN** a user runs the Today tour on desktop or mobile
- **THEN** the schedule step highlights the Today's plan area (Bonus raids in its place at the energy limit), the energy step highlights the Daily energy used tile, the campaign event step highlights the Campaign event tile, and the Today's attempts and Onslaught steps highlight their cards
- **AND** the navigation step highlights the section menu on desktop (its reopen toggle when collapsed) and the section tabs on mobile
- **AND** a step whose card is left out today (Onslaught, or the shop offer groups when nothing is worth buying) is dropped from the tour rather than left without a target

### Requirement: Today shows glance tiles

Today SHALL show its glance tiles above the card grid, as a labelled region ("Today at a glance"). Each tile SHALL show a short label and its value, and tiles SHALL be static text, not controls. In order:

1. **Daily energy used**: a progress bar and "used / daily" energy from "Today shows real daily energy usage". Once the daily energy limit is reached (the same test Bonus raids uses), the label SHALL read "Energy limit reached" and the bar and tile border SHALL switch to a distinct over-limit colour.
2. **Onslaught**: today's whole tokens to spend, from "Today lists today's Onslaught runs". It SHALL be hidden when no goal needs an Onslaught run today.
3. **Campaign event**: the status from "Today states the detected campaign event and its remaining time".

There SHALL be no tile for the plan's energy and raid totals: without the daily energy beside them they say nothing on their own.

The layout SHALL follow the width of Today's content (a container query), not the viewport:

- From 42rem: each tile is a card of its own with its label above its value. Tiles SHALL take at least 12rem each and wrap onto further rows when there is not room for all of them on one.
- Below 42rem (one dashboard track, as on a phone): the tiles SHALL fold into one card, one row per tile with its label at the start and its value at the end, rows split by dividers, so Today's plan starts as high as possible.

Tile values SHALL wrap rather than truncate. Tiles 1–2 SHALL render only once Today's raid data is ready. The Campaign event tile SHALL render regardless.

Worked example: daily energy 638, real spend today 663 energy, and two Onslaught runs planned at 1.2 and 0.5 runs. Tile 1 reads "Energy limit reached" with "663 / 638" and a full bar in the over-limit colour (663 ÷ 638 = 103.9%, so the bar's value text says 104%). Tile 2 shows 1.2 + 0.5 = 1.7, rounded up to "2 tokens". Below the limit, at a real spend of 410 energy, tile 1 reads "Daily energy used" with "410 / 638" and a bar 64% full; tile 2 still shows "2 tokens".

#### Scenario: Tiles in order

- **GIVEN** a goal needs an Onslaught run
- **WHEN** Today renders
- **THEN** the tiles read Daily energy used, Onslaught, Campaign event, in that order

#### Scenario: Over the limit

- **GIVEN** today's real energy spend has reached the daily energy limit
- **WHEN** Today renders
- **THEN** the first tile is labelled "Energy limit reached" with a full bar in the over-limit colour, and the Onslaught tile still follows it

#### Scenario: One dense card on a narrow page

- **GIVEN** Today's content is narrower than 42rem
- **WHEN** Today renders its glance tiles
- **THEN** they form one card of label / value rows split by dividers, not separate tiles

#### Scenario: Raids still loading

- **GIVEN** Today's raid data is still loading
- **WHEN** Today renders
- **THEN** only the Campaign event tile is shown
