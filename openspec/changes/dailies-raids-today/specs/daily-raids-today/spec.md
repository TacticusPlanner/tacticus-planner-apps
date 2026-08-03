## Purpose

Tells a player exactly what to raid today for one selected project's active goals — respecting their real energy budget, shared inventory, and per-battle attempt limits — plus what's just out of reach if they had more energy to spend.

## ADDED Requirements

### Requirement: Today uses an icon-led responsive schedule

Today SHALL show the relevant unit portrait for each goal group, the material or shard art for each resource, and icons for energy and raid-attempt statistics. The icon treatment SHALL supplement accessible text rather than replace it.

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

#### Scenario: No project available to default to

- **GIVEN** the player's project list fails to load, or otherwise contains no projects at all
- **THEN** Today shows an empty state prompting the user to select a project, and no schedule or Bonus Raids section is shown

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

Each node's listed raid count SHALL indicate whether that node is at its daily attempt cap (fully raided — no further raids possible there today regardless of remaining energy) versus below its cap (raids stopped for a different reason: need was fully covered, or the energy budget ran out). This is a per-node, per-day determination based on that node's combined raids across every contributing goal that day — not each entry's own raid count in isolation — consistent with the daily cap itself being shared across goals. The same indicator applies to node listings in Bonus Raids.

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

#### Scenario: A node at its daily cap is marked fully raided

- **GIVEN** a node's planned raid count equals its daily attempt cap
- **WHEN** Today loads
- **THEN** that node's listing is marked as fully raided (capped) today

#### Scenario: A node below its daily cap shows a plain count

- **GIVEN** a node's planned raid count is below its daily attempt cap (raids stopped because need was covered or the energy budget ran out, not because the node was capped)
- **WHEN** Today loads
- **THEN** that node's listing shows its raid count with no fully-raided indicator

#### Scenario: Fully raided combines raids across goals

- **GIVEN** two different in-scope goals each raid the same battle node on the same day, and their combined raids at that node equal its daily attempt cap, while neither goal's individual entry alone reaches the cap
- **WHEN** Today loads
- **THEN** that node is marked fully raided under both goals' entries, based on the combined total, not either entry's own count alone

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

Today and Bonus Raids SHALL render each scheduled battle using the shared Character Lookup location-chip presentation: campaign icon, localized short campaign and tier code, node number, and the planned raid count. Raw battle ids SHALL only be used as a fallback when catalog presentation metadata is unavailable.

#### Scenario: A scheduled node has campaign presentation metadata

- **GIVEN** a scheduled battle resolves to catalog campaign metadata
- **WHEN** Today renders the battle
- **THEN** its chip shows the same campaign icon and localized compact location label used by the Character Lookup table, followed by the planned raid count

### Requirement: Only the active campaign event is farmable

Standing campaign battles SHALL remain eligible for raid calculations. A battle belonging to an event campaign SHALL be eligible only when its campaign group id equals `live-progress.activeCampaignEventId`. When no campaign event is active, all event-campaign battles SHALL be excluded.

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
