# Spec Delta

## MODIFIED Requirements

### Requirement: Filters constrain Today, Bonus Raids and the HSE tab only

The applied filter SHALL constrain the node(s) the daily-raids engine schedules for Today and Bonus Raids, the candidate locations of the HSE tab's farm list and the locations listed in the HSE tab's two top-10 lists, and nothing else. Raids Plan / Schedule, Goals page estimates and dates, goal-creation previews and Insights SHALL be computed without the filter and SHALL be identical whether or not a filter is applied. The Home raids widget, which shows the Today list, SHALL reflect the same filtered Today.

For every material (upgrades and character shards alike) the engine SHALL first remove the eligible nodes that fail the filter, then choose the preferred nodes among the nodes that pass exactly as it does with no filter (least energy per item, with the same tie and value rules). A material whose cheapest node fails the filter SHALL therefore be scheduled on the cheapest node(s) that pass. A material none of whose nodes pass SHALL be reported on Today as filtered out, with a reason distinct from "no farm location", and offered a Reset action. The filter wins over a goal's pinned farm locations: pinned locations are filtered exactly like auto-picked ones, so a goal whose pinned locations all fail the filter is reported as filtered out. The filtered-out notice SHALL state, for such goals, that their pinned location is excluded by the Raids Filters and that the filter or the pin must change. With an empty filter, results are identical to current behavior. Today, Bonus Raids and the HSE tab's farm list therefore all treat the filter as a candidate rule (filter-then-pick).

#### Scenario: Filter removes the cheapest node

- **GIVEN** the least-energy node for a material fails the filter and another, pricier node passes
- **WHEN** Today is computed
- **THEN** the material is scheduled on the pricier node and is not reported as filtered out

#### Scenario: Custom locations by rarity

- **GIVEN** the filter allows campaign types Mirror and Standard but not Elite, and a Common material's cheapest node is an Elite node while a Mirror node also drops it
- **WHEN** Today is computed
- **THEN** the material is scheduled on the Mirror node

#### Scenario: No node passes

- **GIVEN** every eligible node for a material fails the filter
- **WHEN** Today is computed
- **THEN** the material is reported as filtered out with a Reset action

#### Scenario: Character shards behave the same as upgrades

- **GIVEN** the least-energy node for a character's shards fails the filter and another node passes
- **THEN** the shards are scheduled on the passing node

#### Scenario: A tied node passes

- **GIVEN** two nodes tie for least energy per item and only one passes the filter
- **THEN** the material is scheduled on the passing node

#### Scenario: Filter leaves the preferred node

- **GIVEN** the preferred node passes the filter
- **THEN** the schedule for that material is unchanged

#### Scenario: Plan and Goals ignore the filter

- **WHEN** a filter is applied
- **THEN** Plan > Schedule, Goals estimates and Insights are identical to the unfiltered result, while Today and Bonus Raids reflect the filter

#### Scenario: Pinned location fails the filter

- **GIVEN** a goal pins its farm location to a node that fails the filter
- **WHEN** Today is computed
- **THEN** the goal is reported as filtered out, not scheduled on the pinned node, and the notice says its pinned location is excluded by the Raids Filters and offers Reset

#### Scenario: Pinned location passes the filter

- **GIVEN** a goal pins its farm location to a node that passes the filter
- **THEN** Today schedules the goal on the pinned node as without a filter

#### Scenario: Filter cleared or pin changed

- **GIVEN** a goal is filtered out because of its pin
- **WHEN** the filter is reset or the pin is changed to a passing node
- **THEN** the goal is scheduled again

#### Scenario: HSE farm list is filter-then-pick

- **GIVEN** a filter is applied and the HSE tab shows a rule-bearing event
- **THEN** its farm list is chosen only among locations that pass the filter (and earn event points), evaluated with the material the location drops; a material is never reported as filtered out there and never moved to a node that fails the filter, and a filter that leaves no candidate shows the HSE empty state with a Reset action

#### Scenario: HSE top-10 lists honor the filter

- **GIVEN** a filter is applied and the HSE tab shows a rule-bearing event
- **THEN** both top-10 lists contain only locations that pass the filter (evaluated without a material, so the rarity criterion does not apply)
