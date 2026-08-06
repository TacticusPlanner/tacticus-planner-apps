## MODIFIED Requirements

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

### Requirement: Today's raid schedule

Given a project with in-scope goals that have farmable upgrade or shard needs, Today SHALL show one card per upgrade or shard that the day's energy budget can raid, each listing the battle node(s) to raid and the number of raids at each node, for today only (not a multi-day plan).

A node whose real synced attempts today have reached zero remaining (`live-progress.battleAttempts[].attemptsLeft === 0` for a standing — standard/mirror/elite/eliteMirror — campaign node) SHALL be excluded from its resource card's location listing; it appears only in the account-wide "Today's Attempts" section instead (see that requirement). This exclusion is based on the player's real synced attempts, not the simulated plan's own per-node attempt allocation: a node SHALL be excluded even if the simulated plan never scheduled a raid there today, and a node the simulated plan would otherwise treat as fully allocated SHALL remain listed until the player's real attempts there are actually exhausted. A node whose real attempts-left data is unavailable (for example an event-campaign node — see "Today shows real daily energy usage") SHALL be treated as not exhausted rather than guessed at. The same treatment applies to node listings in Bonus Raids.

A node that remains listed (real attempts not exhausted) SHALL show its planned raid count, except that a node whose planned raid count itself equals its daily attempt cap SHALL show "Max raids" instead of a numeric count.

If every location for a scheduled upgrade or shard becomes excluded this way, that upgrade/shard's card SHALL be omitted from the schedule (or Bonus Raids) for that day — its need at available locations is exhausted for today — and it remains visible only via Today's Attempts, if the player actually attempted it there.

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

### Requirement: Campaign locations use the Character Lookup presentation

Today and Bonus Raids SHALL render each scheduled battle as the primary element of its resource card: the campaign icon, the full campaign/tier name (e.g. "Indomitus Elite"), and the battle/node number, ordered ahead of the resource or material it farms — which renders as a secondary caption. Raw battle ids SHALL only be used as a fallback when catalog presentation metadata is unavailable. When a resource is scheduled at more than one location, each location SHALL render as its own row at the same visual weight as a single location would, rather than a compact list of chips. The Raids Plan tab is unaffected by this requirement and continues to render locations as compact chips secondary to the resource.

#### Scenario: A scheduled node has campaign presentation metadata

- **GIVEN** a scheduled battle resolves to catalog campaign metadata
- **WHEN** Today renders the battle
- **THEN** its row shows the campaign icon, the full campaign/tier name, and the battle number, ordered ahead of the resource it farms, with the resource name and progress rendered as a secondary caption

#### Scenario: A resource farmed at multiple locations shows one row per location

- **GIVEN** a resource is scheduled to be farmed at more than one location today
- **WHEN** Today renders that resource's card
- **THEN** each location renders as its own full-weight row rather than a compact chip, and the resource's name/progress caption appears once for the card

## ADDED Requirements

### Requirement: Today's Attempts section

Today SHALL show a "Today's Attempts" section after the Bonus Raids section, listing every standing (standard/mirror/elite/eliteMirror) campaign node the player has actually raided today — real synced attempts (`live-progress.battleAttempts[].attemptsUsed > 0`), account-wide, not scoped to the current project's schedule or Bonus Raids. Each listed location SHALL show its real raid count today, or "Max raids" once its real synced attempts have reached zero remaining (`attemptsLeft === 0`). Event-campaign nodes SHALL be excluded from this section for the same reason they're excluded from the real energy-usage total (see "Today shows real daily energy usage"): their `battleIndex` is ambiguous between Standard/Extremis tiers in the currently-stored data.

#### Scenario: An attempted location appears in Today's Attempts

- **GIVEN** the player has real synced attempts today at a standing-campaign node
- **WHEN** Today loads
- **THEN** that location appears in the Today's Attempts section, listed after Bonus Raids, showing its real raid count today

#### Scenario: An exhausted location shows Max raids in Today's Attempts

- **GIVEN** a location listed in Today's Attempts has zero real attempts left today
- **WHEN** Today loads
- **THEN** that location's entry shows "Max raids" instead of a numeric raid count

#### Scenario: Today's Attempts includes locations unrelated to the current project

- **GIVEN** the player has real synced attempts today at a standing-campaign node with no relevance to the current project's schedule or Bonus Raids
- **WHEN** Today loads
- **THEN** that location still appears in Today's Attempts

#### Scenario: No attempts recorded yet today

- **GIVEN** the player has no real synced attempts recorded yet today
- **WHEN** Today loads
- **THEN** Today shows an explicit empty state for the Today's Attempts section, not a blank or hidden section

### Requirement: Today shows real daily energy usage

Today SHALL show a progress indicator next to its title reflecting the percentage of the player's configured daily energy (`planningSettings.dailyEnergy`) actually spent today, computed from the player's real synced attempt counts (not the plan's simulated schedule) across every standing (standard/mirror/elite/eliteMirror) campaign node on the account — including nodes unrelated to the currently selected project — each priced at that node's energy cost. This percentage SHALL NOT be capped at 100%.

Event-campaign attempts SHALL be excluded from this total: the real synced attempt data does not retain which difficulty tier (Standard vs Extremis) an event attempt belongs to, so an event campaign's attempt counts cannot be reliably priced. This is a known, deliberate undercount for event-campaign activity, not an attempt to represent event energy usage as zero-cost.

#### Scenario: Usage reflects real attempts across the whole account

- **GIVEN** the player has real synced attempts recorded today at standing-campaign nodes outside the current project's schedule
- **WHEN** Today loads
- **THEN** the energy-usage indicator includes those attempts' energy cost in its total, not only attempts at nodes within this project's schedule

#### Scenario: Event-campaign attempts are excluded from the total

- **GIVEN** the player has real synced attempts recorded today at an event campaign's nodes
- **WHEN** Today loads
- **THEN** the energy-usage indicator's total does not include those event-campaign attempts' energy cost

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
