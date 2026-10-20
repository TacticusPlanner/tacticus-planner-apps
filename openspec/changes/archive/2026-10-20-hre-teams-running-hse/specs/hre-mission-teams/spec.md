## ADDED Requirements

### Requirement: HRE teams take a running HSE into account

While a personal Home Screen Event runs and scores in a team's token mode, the HRE mission team SHALL rank the units that score for it first, after the mission's own rule and preferences, and the card SHALL say how many of its units also score for it.

#### Scenario: Psyker Boost during mission 15

- **GIVEN** mission 15 and a running Psyker Boost
- **THEN** the Arena team is led by the player's Psykers
- **AND** the card says how many of its units score for Psyker Boost

#### Scenario: No HSE running

- **GIVEN** no Home Screen Event runs, or a Global one
- **THEN** the teams are the strongest units allowed by the mission's rule, with no HSE note

### Requirement: Onslaught tracks follow a running HSE

An Onslaught or Salvage Run team not already kept to one alliance SHALL keep to the alliance with the most of the running HSE's scoring units, then the most units.

#### Scenario: More Chaos Psykers than Imperial ones

- **GIVEN** a running Psyker Boost, 6 Imperial units with 4 Psykers and 5 Chaos Psykers
- **THEN** the Onslaught pool keeps to Chaos
