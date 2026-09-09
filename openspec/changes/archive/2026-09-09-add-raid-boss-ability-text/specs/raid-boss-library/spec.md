## MODIFIED Requirements

### Requirement: The detail view shows weapons, abilities, and traits resolved from ids

The detail view SHALL render the entity's weapons as attack-profile rows (hits, damage profile, and range for ranged weapons), and its abilities and traits resolved from their ids to names. Abilities SHALL be grouped by kind — Active, Passive, Relic — each group shown only when it has an entry. An id that resolves to no player-facing game name SHALL be omitted, matching V1: the internal `GuildBossRunAway` ability and the `Boss` / `Hero` pseudo-traits do not appear. The progression stepper SHALL also show the selected step's base rarity and star level.

Each shown ability and trait SHALL also render its rules-text when the catalog resolves one, per the **detail view renders ability and trait rules-text scaled to the step** requirement.

#### Scenario: Ranged and melee weapons

- **WHEN** the entity has a ranged weapon and a melee weapon
- **THEN** the ranged weapon's row shows its range and the melee weapon's row does not

#### Scenario: Abilities are grouped and internal ids hidden

- **WHEN** an entity's ability ids include `GuildBossRunAway` alongside real abilities
- **THEN** the abilities are shown under Active / Passive / Relic headings and `GuildBossRunAway` is not rendered

#### Scenario: Prime names resolve from the character roster

- **WHEN** a prime's unit-set id maps to a playable character (e.g. `GuildBoss4MiniBoss1OrksBigMek`)
- **THEN** the list and detail show that character's name ("Gibbascrapz"), falling back to the id-keyed i18n name for primes that are not playable characters

## ADDED Requirements

### Requirement: The detail view renders ability and trait rules-text scaled to the step

For each ability shown in the detail's ability panel, the view SHALL render the ability's description text with its embedded variable and constant tokens resolved to the values for the currently selected progression step (the step's ability level indexes the per-level variable arrays). Changing the progression step SHALL update the rendered numbers without navigation. Stat and damage-type tokens in the text SHALL be presented distinctly from the surrounding prose (as V1 styles them), but a plain-text rendering that still substitutes the values is acceptable.

Traits SHALL render their rules-text the same way where the catalog resolves one; a trait id that resolves to a name but no text SHALL continue to show the name only. An ability id that resolves to no description SHALL show its name only, with no empty text block.

The description strings are game data resolved from the ability/trait id (English only, consistent with the existing `raidBossAbilities` / `raidBossTraits` namespaces); the served `raid-bosses` dataset carries ids only.

#### Scenario: Ability text scales with the step

- **WHEN** the user selects a higher progression step for an entity whose ability description contains a level-scaled variable
- **THEN** the rendered ability text shows the value for that step's ability level, and reverts when a lower step is selected

#### Scenario: Ability with no description

- **WHEN** a shown ability id resolves to a name but no description text
- **THEN** only the ability name is shown, with no empty description area

#### Scenario: Trait text when resolved

- **WHEN** a trait id resolves to both a name and rules-text
- **THEN** the trait shows its name and the rules-text; a trait that resolves to a name only shows just the name
