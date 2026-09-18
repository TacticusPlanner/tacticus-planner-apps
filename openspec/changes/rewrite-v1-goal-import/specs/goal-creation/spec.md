## MODIFIED Requirements

### Requirement: An above-cap ability target auto-suggests Ascension and Level prerequisites

When a chosen ability target exceeds what the unit's current progression permits, the
create-goal sheet SHALL auto-suggest the same prerequisite goals it suggests for a
too-high Rank target:

- an Ascension prerequisite that raises the unit into the lowest rarity tier whose ability
  cap covers the higher of the two chosen targets, unless an Ascension goal covering that
  tier is already included; and
- a Level prerequisite that raises the character to the character level implied by the
  higher of the two chosen ability targets, unless a Level goal covering that level is
  already included.

Accepting a suggestion SHALL prepend the corresponding goal to the combined set with the
correct dependency ordering. The Ability goal SHALL additionally **declare a dependency
on** the Ascension goal whose suggestion its target drove, not merely be ordered after it;
the declared dependency is what establishes that the ability target becomes reachable, and
without it the target is refused as exceeding the unit's cap. This applies to Character
goals; Machine-of-War Ability goals SHALL auto-suggest Ascension only (a MoW has no Level
goal), and SHALL declare the same dependency.

#### Scenario: Target above the current rarity cap

- **GIVEN** an Epic unit whose ability cap is 35 and whose current character level is 30
- **WHEN** the user sets an ability target of 42
- **THEN** the sheet offers an Ascension suggestion into the Legendary tier and a Level
  suggestion to level 42

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
- **THEN** no Ascension or Level prerequisite is suggested on account of the ability target

#### Scenario: Machine of War above-cap target

- **WHEN** a Machine-of-War Ability goal's target exceeds its current rarity ability cap
- **THEN** an Ascension prerequisite is suggested and no Level prerequisite is suggested
