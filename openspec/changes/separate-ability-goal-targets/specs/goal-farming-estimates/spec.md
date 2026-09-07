## ADDED Requirements

### Requirement: A Machine-of-War Ability goal costs every advancing ability track

For a Machine-of-War Ability goal, the farming demand and resource-cost derivation SHALL
account for **every** ability track whose target is above its start, not only the first.
When both the primary and secondary tracks advance in one goal, the derived material needs,
farming stages, and any day-by-day estimate SHALL include the level transitions of both
tracks. A goal that advances only one track SHALL be unaffected by this requirement.

#### Scenario: Both tracks advance

- **GIVEN** a Machine-of-War Ability goal whose primary track runs from level 3 to level 6
  and whose secondary track runs from level 2 to level 5
- **WHEN** the goal's material needs and farming stages are derived
- **THEN** the result includes the badge and component needs for the primary 3→6
  transitions and for the secondary 2→5 transitions

#### Scenario: Only one track advances

- **GIVEN** a Machine-of-War Ability goal whose primary track runs from level 3 to level 6
  and whose secondary track starts and ends at level 2
- **WHEN** the goal's material needs are derived
- **THEN** the result covers only the primary 3→6 transitions, unchanged from prior
  behavior

#### Scenario: Estimate reflects both tracks

- **GIVEN** a Machine-of-War Ability goal advancing both tracks and a farming strategy that
  splits the range into stages
- **WHEN** the day-by-day completion estimate is computed
- **THEN** the estimate reflects the combined material demand of both tracks rather than a
  single track's demand
