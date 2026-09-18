# daily-raids-today Specification

## Purpose

Tells a player exactly what to raid today for one selected project's active goals — respecting their real energy budget, shared inventory, and per-battle attempt limits — plus what's just out of reach if they had more energy to spend.

## Requirements

### Requirement: Today uses an icon-led responsive schedule

Today SHALL show the relevant unit portrait for each goal group, icons for energy and raid-attempt statistics, and a goal-type icon for each goal's target: a Rank target SHALL show its goal-type icon paired with its rank icon, with no accompanying text; every other goal kind (Ability, Ascension, Unlock, Level, Upgrade) SHALL show its goal-type icon paired with its existing text label, matching the icon/text treatment used by the Create Goal sheet's goal-type picker. The icon treatment SHALL supplement accessible text rather than replace it, except for the Rank case where the icon pair is the accessible representation (with an accessible name available to assistive technology via the rank icon).

When a goal's only scheduled resource is that same unit's shards, Today SHALL combine the goal identity and shard schedule into one row instead of repeating the portrait and unit name in a separate goal header and resource card.

#### Scenario: Single shard schedule avoids duplicate identity

- **GIVEN** a goal whose only scheduled resource is the goal unit's shards
- **WHEN** Today renders that goal group
- **THEN** one combined row shows the unit portrait, unit name, target, raid total, and node details without a separate duplicate goal header or shard portrait

#### Scenario: Mobile schedule is compact

- **WHEN** Today is viewed below the 768px mobile breakpoint
- **THEN** goal headings, resource identity, raid totals, and node details are composed as dense rows that minimize vertical space while preserving every label and control

#### Scenario: Desktop schedule fills the page width

- **WHEN** Today is viewed at or above the 768px desktop breakpoint
- **THEN** goal groups auto-fill the available content width with as many readable columns as fit, keeping their resource cards compact rather than stretching a single card across the page

#### Scenario: Rank goals show the goal-type icon paired with the rank icon

- **GIVEN** a goal group's target is a Rank goal
- **WHEN** Today renders that goal's header
- **THEN** it shows the Rank goal-type icon next to the target rank's icon, with no accompanying text, and exposes the rank as an accessible name

#### Scenario: Non-Rank goals show an icon with text

- **GIVEN** a goal group's target is any goal kind other than Rank
- **WHEN** Today renders that goal's header
- **THEN** it shows that goal kind's icon paired with its existing text label

### Requirement: Today has its own project selector

Today SHALL provide a project selector independent of any other page's project selection. Selecting a project SHALL recompute the schedule for that project alone. The selector SHALL default to the player's Active project (the project marked as their active plan) when one exists, falling back to the player's Default project (a project every account always has exactly one of, and which cannot be deleted) when no project is currently marked Active.

#### Scenario: Default selection is the Active project

- **GIVEN** the player has a project marked as their Active project
- **WHEN** Today loads with no prior selection made this session
- **THEN** Today's project selector defaults to that Active project and shows its schedule without requiring the user to pick one

#### Scenario: Falls back to the Default project when there is no Active project

- **GIVEN** no project is currently marked as the player's Active project
- **WHEN** Today loads with no prior selection made this session
- **THEN** Today's project selector defaults to the player's Default project and shows its schedule without requiring the user to pick one

#### Scenario: Switching the selected project

- **WHEN** the user selects a different project in Today's project selector
- **THEN** the schedule, Bonus Raids section, and empty states are all recomputed for the newly-selected project only

#### Scenario: Project list fails to load

- **GIVEN** the player's project-list request fails
- **WHEN** Today loads
- **THEN** Today shows the load error with an action that retries the failed project-list request, and does not present the failure as an empty project list

#### Scenario: Project list loads without projects

- **GIVEN** the player's project-list request succeeds with no projects
- **WHEN** Today loads
- **THEN** Today shows an empty state prompting the user to create or select a project, and no schedule or Bonus Raids section is shown

### Requirement: Today's schedule scope

Today SHALL compute its schedule from only the selected project's goals whose status is `Active`, in their configured priority order. Goals with status `Paused`, `Completed`, or `Archived` SHALL be excluded.

#### Scenario: Only Active goals contribute

- **GIVEN** a project with a mix of Active, Paused, Completed, and Archived goals, where only the Active goals have unmet farmable upgrade needs
- **WHEN** Today loads
- **THEN** the schedule reflects only the Active goals' needs

#### Scenario: Paused goals do not contribute

- **GIVEN** a project with a Paused goal that has an unmet farmable upgrade need
- **WHEN** Today loads
- **THEN** that Paused goal's need is excluded from the schedule, inventory allocation, and Bonus Raids entirely, as if the goal did not exist

### Requirement: Today's raid schedule

Given a project with in-scope goals that have farmable upgrade or shard needs, Today SHALL show one card per upgrade or shard that the day's energy budget can raid, each listing the battle node(s) to raid and the number of raids at each node, for today only (not a multi-day plan).

A node whose real synced attempts today have reached zero remaining (`live-progress.battleAttempts[].attemptsLeft === 0`, matched by campaign group, type, and battle index — standing or event-campaign alike) SHALL be excluded from its resource card's location listing; it appears only in the account-wide "Today's Attempts" section instead (see that requirement). This exclusion is based on the player's real synced attempts, not the simulated plan's own per-node attempt allocation: a node SHALL be excluded even if the simulated plan never scheduled a raid there today, and a node the simulated plan would otherwise treat as fully allocated SHALL remain listed until the player's real attempts there are actually exhausted. A node whose real attempts-left data is unavailable SHALL be treated as not exhausted rather than guessed at. The same treatment applies to node listings in Bonus Raids.

A node that remains listed (real attempts not exhausted) SHALL show its planned raid count, except that a node whose planned raid count itself equals its daily attempt cap SHALL show "Max raids" instead of a numeric count.

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
- **THEN** the schedule's raid count for that upgrade reflects only the lower-priority goal's uncovered remainder, not the combined need

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

#### Scenario: A node with real attempts remaining shows a plain count

- **GIVEN** a node's real synced attempts today have not reached zero remaining
- **WHEN** Today loads
- **THEN** that node's listing remains in the resource card, showing its planned raid count

#### Scenario: A node's planned raid count equaling its daily cap shows Max raids

- **GIVEN** a node remains listed (its real attempts are not exhausted) and its planned raid count equals its daily attempt cap
- **WHEN** Today loads
- **THEN** that node's listing shows "Max raids" instead of a numeric raid count

#### Scenario: The simulated plan's own allocation does not by itself exclude a node

- **GIVEN** two different in-scope goals each raid the same battle node on the same day, and their combined _simulated_ raid count at that node equals its daily attempt cap, but the player's real synced attempts at that node are not yet exhausted
- **WHEN** Today loads
- **THEN** that node remains listed in both goals' resource cards, showing its planned raid count — the simulated plan reaching a node's cap does not by itself exclude it

#### Scenario: An entry's every location has zero real attempts left

- **GIVEN** an upgrade or shard's every farmable location today (across Today's schedule and Bonus Raids) has zero real attempts left
- **WHEN** Today loads
- **THEN** that upgrade/shard's card is omitted from Today's schedule (or Bonus Raids) for the day, and its locations are represented only via Today's Attempts if the player actually attempted them there

#### Scenario: A node at its daily cap is marked fully raided

- **GIVEN** a node's planned raid count equals its daily attempt cap and its real synced attempts today have not reached zero remaining
- **WHEN** Today loads
- **THEN** that node's listing shows "Max raids" instead of a numeric raid count, replacing the previous in-place "fully raided" indicator now that this determination is attempts-based (see the real-attempts scenarios above)

#### Scenario: A node below its daily cap shows a plain count

- **GIVEN** a node's planned raid count is below its daily attempt cap, and its real synced attempts today have not reached zero remaining
- **WHEN** Today loads
- **THEN** that node's listing shows its planned raid count with no Max-raids indicator

#### Scenario: Fully raided combines raids across goals

- **GIVEN** two different in-scope goals each raid the same battle node on the same day, their combined _planned_ raid count at that node equals its daily attempt cap while neither goal's individual entry alone reaches it, and the node's real synced attempts today have not reached zero remaining
- **WHEN** Today loads
- **THEN** that node's listing under both goals' entries shows "Max raids", based on the combined planned total rather than either entry's own count alone

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

Below a visible separator, Today SHALL show a Bonus Raids section: upgrades or shards that receive zero raids under the real daily energy budget but would receive at least one raid if energy were unlimited. An upgrade or shard that already receives at least one raid in the real schedule SHALL NOT appear in Bonus Raids. Bonus Raids SHALL be ordered by the same goal-priority order the main schedule uses.

Bonus Raids SHALL initially display only the top 3 qualifying entries in that order. When more than 3 entries qualify, Today SHALL show a "Show more" control beneath the visible entries; activating it reveals the remaining entries (still in the same order, still grouped by goal per the grouping requirement above).

#### Scenario: A zero-raid upgrade appears as a bonus raid

- **GIVEN** an upgrade has an in-scope goal need but the real energy budget is exhausted before any raid against it is planned, while an unlimited budget would raid it at least once
- **WHEN** Today loads
- **THEN** that upgrade appears in Bonus Raids, listing the node(s) and raid count an unlimited budget would have used

#### Scenario: A partially-raided upgrade is excluded from Bonus Raids

- **GIVEN** an upgrade receives at least one raid in the real schedule but not enough to fully clear its need
- **WHEN** Today loads
- **THEN** that upgrade does not appear in Bonus Raids, even though additional energy would raid it further

#### Scenario: Bonus Raids ordering

- **GIVEN** two or more upgrades qualify for Bonus Raids, belonging to goals of different priority
- **WHEN** Today loads
- **THEN** Bonus Raids lists them in the same goal-priority order as the main schedule, not by any other ranking

#### Scenario: Bonus Raids truncated to top 3 with a Show more control

- **GIVEN** more than 3 entries qualify for Bonus Raids
- **WHEN** Today loads
- **THEN** only the first 3 entries (in goal-priority order) are shown, followed by a "Show more" control, and the remaining entries are not rendered until that control is activated

#### Scenario: Show more reveals the rest

- **GIVEN** Bonus Raids is showing its truncated top-3 view with a "Show more" control
- **WHEN** the user activates "Show more"
- **THEN** the remaining qualifying entries are revealed in place, in the same goal-priority order, still grouped by goal

#### Scenario: 3 or fewer entries need no truncation

- **GIVEN** 3 or fewer entries qualify for Bonus Raids
- **WHEN** Today loads
- **THEN** all qualifying entries are shown and no "Show more" control is displayed

#### Scenario: No bonus raids available

- **GIVEN** no upgrade or shard qualifies for Bonus Raids (every farmable need is either fully covered by the real schedule or would still receive zero raids even with unlimited energy)
- **WHEN** Today loads
- **THEN** Today shows an explicit empty state for the Bonus Raids section, not a blank section

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

### Requirement: Today's Attempts section

Today SHALL show a "Today's Attempts" section after the Bonus Raids section, listing every campaign node — standing (standard/mirror/elite/eliteMirror) or event-campaign — the player has actually raided today — real synced attempts (`live-progress.battleAttempts[].attemptsUsed > 0`), account-wide, not scoped to the current project's schedule or Bonus Raids. Each listed location SHALL show its real numeric raid count today (`attemptsUsed`), including when its real synced attempts remaining are zero. An event-campaign attempt record is matched to its battle by campaign group, `type` (Standard/Extremis), and battle index, distinguishing the two tiers rather than excluding them.

#### Scenario: An attempted location appears in Today's Attempts

- **GIVEN** the player has real synced attempts today at a standing-campaign node
- **WHEN** Today loads
- **THEN** that location appears in the Today's Attempts section, listed after Bonus Raids, showing its real raid count today

#### Scenario: An attempted event-campaign location appears in Today's Attempts

- **GIVEN** the player has real synced attempts today at an event-campaign node (for example, 6 raids at a node in the "Adepta Sororitas" event campaign's Standard tier)
- **WHEN** Today loads
- **THEN** that location appears in the Today's Attempts section showing its real raid count today, the same as a standing-campaign location would

#### Scenario: An exhausted location shows a numeric actual count

- **GIVEN** a location listed in Today's Attempts has zero real attempts left today and a positive real number of attempts used
- **WHEN** Today loads
- **THEN** that location's entry shows the numeric attempts-used value and not "Max raids"

#### Scenario: Today's Attempts includes locations unrelated to the current project

- **GIVEN** the player has real synced attempts today at a standing-campaign node with no relevance to the current project's schedule or Bonus Raids
- **WHEN** Today loads
- **THEN** that location still appears in Today's Attempts

#### Scenario: No attempts recorded yet today

- **GIVEN** the player has no real synced attempts recorded yet today
- **WHEN** Today loads
- **THEN** Today shows an explicit empty state for the Today's Attempts section, not a blank or hidden section

### Requirement: Today shows real daily energy usage

Today SHALL show a progress indicator next to its title reflecting the percentage of the player's configured daily energy (`planningSettings.dailyEnergy`) actually spent today, computed from the player's real synced attempt counts (not the plan's simulated schedule) across every campaign node on the account — standing or event-campaign, including nodes unrelated to the currently selected project — each priced at that node's energy cost. This percentage SHALL NOT be capped at 100%.

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
- **THEN** the energy-usage indicator shows a percentage above 100%, uncapped

#### Scenario: No real usage yet today

- **GIVEN** the player has no recorded real attempts yet today
- **WHEN** Today loads
- **THEN** the energy-usage indicator shows 0%

#### Scenario: Real usage data is part of Today's readiness gate

- **GIVEN** the player's real synced attempt data has not yet loaded
- **WHEN** Today would otherwise render
- **THEN** Today defers rendering (including the energy-usage indicator) until that data is available, consistent with how Today already gates rendering on its other required data sources

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
