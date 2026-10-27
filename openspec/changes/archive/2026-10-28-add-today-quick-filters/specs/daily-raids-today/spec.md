# Spec Delta

## ADDED Requirements

### Requirement: Today quick filters

Today SHALL show a quick-filter chip row, captioned "Quick filters", next to the Raids Filters trigger, with two chips: **Fewer raids** and **Bottlenecks**. Either, both or neither MAY be on. Each chip SHALL carry a tooltip explaining what it does, and while a chip is on Today SHALL show one line under the row stating what it changes. The state SHALL live in the URL (`quick` search parameter, a comma-separated list; unknown values are ignored) so reload and shared links restore it, and it SHALL NOT be stored anywhere else, so leaving Today without the parameter shows the defaults.

The chips SHALL change only Today's plan and Bonus Raids (including the raids-left list after the daily energy limit). Plan > Schedule, Goals estimates and dates, Insights, the HSE and HRE tabs and the Home raids widget SHALL be computed as if both chips were off. The chips combine with the applied Raids Filters.

**Fewer raids**: after the preferred nodes are chosen (least energy per item among nodes that pass the Raids Filters), only the node(s) with the highest energy cost per battle SHALL be kept. Tied nodes left after that keep the expected-gold ordering. A goal's pinned farm locations SHALL be used as chosen.

**Bottlenecks**: Today SHALL ignore goal priority when spending energy. Inventory SHALL still be allocated to goals in priority order, and shop and Onslaught supply SHALL still be applied per goal in priority order. The remaining need of every in-scope goal, summed per resource across all of the goal's stages, SHALL form one pool, and the day's energy SHALL be spent on that pool longest-to-finish resource first (then greatest energy cost), with each node's daily attempt cap shared as usual. A resource SHALL be farmed at the nodes chosen for the highest-priority goal that needs it. Each raid entry SHALL be credited to the highest-priority goal still needing that resource, so Today keeps its per-goal grouping; goal groups SHALL stay in goal-priority order. This overrides "Today and Bonus Raids prioritize long-running resources" and goal-by-goal spending while the chip is on.

#### Scenario: Chips off

- **GIVEN** the URL has no `quick` parameter
- **WHEN** Today loads
- **THEN** the schedule is identical to the schedule without this requirement

#### Scenario: Fewer raids picks the costlier tied node

- **GIVEN** a material's two cheapest nodes tie on energy per item, one at 6 energy per battle and one at 12
- **WHEN** Fewer raids is on
- **THEN** Today raids only the 12-energy node for that material, and the note under the row explains that tied locations with more energy per battle are used to save raids

#### Scenario: Bottlenecks farms a lower-priority goal's slow material first

- **GIVEN** goal A (priority 1) needs a material that finishes in 2 days and goal B (priority 2) needs a Legendary material that takes 9 days, and the day's energy covers only one of them
- **WHEN** Bottlenecks is on
- **THEN** Today raids goal B's Legendary material, listed under goal B's group, and the note under the row says Plan and Goals dates still follow goal priority

#### Scenario: Bottlenecks combines all stages

- **GIVEN** a rank goal over several ranks whose later stage needs a slow material
- **WHEN** Bottlenecks is on
- **THEN** that later-stage material is part of the pool and can be raided today

#### Scenario: Both chips on

- **WHEN** Fewer raids and Bottlenecks are both on
- **THEN** the pooled schedule uses the Fewer raids node choice

#### Scenario: Other surfaces ignore the chips

- **GIVEN** a chip is on
- **THEN** Plan > Schedule, Goals, Insights, the HSE and HRE tabs and the Home raids widget are unchanged

#### Scenario: State in the URL

- **WHEN** the player turns on Bottlenecks
- **THEN** the URL gains `quick=bottlenecks`; reloading keeps the chip on, and opening Today from the navigation shows both chips off
