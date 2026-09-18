## MODIFIED Requirements

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
