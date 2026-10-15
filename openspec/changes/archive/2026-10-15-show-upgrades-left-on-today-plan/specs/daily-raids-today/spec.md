## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Today's raid schedule

**Reason**: Replaced by "Today's raid schedule shows what is left to farm", which keeps every rule of this requirement except how a listed node is labelled: planned raid counts and "Max raids" give way to "N upgrades left" below the daily cap and no label at the cap.

**Migration**: None; display-only. Real raid counts remain in Today's Attempts.
