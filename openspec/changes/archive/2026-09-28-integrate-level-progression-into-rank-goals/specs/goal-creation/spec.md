## REMOVED Requirements

### Requirement: An above-cap ability target auto-suggests Ascension and Level prerequisites

**Reason**: The client no longer has Level goals, so an above-cap ability target can no longer suggest a Level prerequisite. The level an ability target implies is shown on the Ability goal itself (see `rank-level-progression`), and the Ascension suggestion continues under the renamed requirement below.

**Migration**: Use "An above-cap ability target auto-suggests an Ascension prerequisite and shows its required level".

## ADDED Requirements

### Requirement: An above-cap ability target auto-suggests an Ascension prerequisite and shows its required level

When a chosen ability target exceeds what the unit's current progression permits, the
create-goal sheet SHALL auto-suggest the same Ascension prerequisite it suggests for a
too-high Rank target: an Ascension prerequisite that raises the unit into the lowest rarity
tier whose ability cap covers the higher of the two chosen targets, unless an Ascension goal
covering that tier is already included. It SHALL NOT suggest a Level prerequisite. Instead, for a
Character, when the level implied by the higher of the two chosen ability targets exceeds the
character's current level, the Ability card SHALL show that required level as ordinary progress
on the Ability goal (see `rank-level-progression`'s "A Rank or Ability goal shows the level it
needs").

Accepting the Ascension suggestion SHALL prepend the Ascension goal to the combined set with the
correct dependency ordering. The Ability goal SHALL additionally **declare a dependency
on** the Ascension goal whose suggestion its target drove, not merely be ordered after it;
the declared dependency is what establishes that the ability target becomes reachable, and
without it the target is refused as exceeding the unit's cap. This applies to Character
goals and to Machine-of-War Ability goals alike; a Machine of War has no character level, so
its Ability goal shows no required-level note, and both declare the same dependency.

#### Scenario: Target above the current rarity cap

- **GIVEN** an Epic unit whose ability cap is 35 and whose current character level is 30
- **WHEN** the user sets an ability target of 42
- **THEN** the sheet offers an Ascension suggestion into the Legendary tier and no Level suggestion

#### Scenario: The Ability card shows the required level

- **GIVEN** a Character whose current level is 30 and whose chosen ability target implies level 42
- **WHEN** the user sets that ability target
- **THEN** the Ability card shows the required level 42 and the current level as a `create-goal-level-requirement` note on the Ability goal, and no Level prerequisite is suggested or added

#### Scenario: The ability goal depends on the suggested Ascension

- **GIVEN** an ability target above the unit's current ability cap
- **WHEN** the suggested Ascension prerequisite is accepted and the combined set is submitted
- **THEN** the Ability goal declares a dependency on that Ascension goal
- **AND** the submission is accepted rather than refused for exceeding the unit's cap

#### Scenario: Machine-of-War ability goal declares the same dependency

- **GIVEN** a Machine-of-War Ability goal whose target exceeds its current rarity ability cap
- **WHEN** the suggested Ascension prerequisite is accepted and the combined set is submitted
- **THEN** the Ability goal declares a dependency on that Ascension goal

#### Scenario: Ascension already included

- **WHEN** the user has already enabled an Ascension goal that reaches the tier whose cap
  covers the ability target
- **THEN** no additional Ascension suggestion is shown for the ability target

#### Scenario: Target within the current cap

- **GIVEN** a Legendary unit whose ability cap is 50 and whose current character level is 50
- **WHEN** the user sets an ability target of 45
- **THEN** no Ascension prerequisite is suggested on account of the ability target and no required-level note is shown

#### Scenario: Machine of War above-cap target

- **WHEN** a Machine-of-War Ability goal's target exceeds its current rarity ability cap
- **THEN** an Ascension prerequisite is suggested and no Level prerequisite is suggested
