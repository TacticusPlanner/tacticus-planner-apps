## MODIFIED Requirements

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
