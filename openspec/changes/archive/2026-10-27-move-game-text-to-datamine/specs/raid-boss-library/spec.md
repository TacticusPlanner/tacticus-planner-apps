## MODIFIED Requirements

### Requirement: The detail view renders ability and trait rules-text scaled to the step

For each ability shown in the detail's ability panel, the view SHALL render the ability's description text with its embedded variable and constant tokens resolved to the values for the currently selected progression step (the step's ability level indexes the per-level variable arrays). Changing the progression step SHALL update the rendered numbers without navigation. Stat and damage-type tokens in the text SHALL be presented distinctly from the surrounding prose (as V1 styles them), but a plain-text rendering that still substitutes the values is acceptable.

Traits SHALL render their rules-text the same way where the catalog resolves one; a trait id that resolves to a name but no text SHALL continue to show the name only. An ability id that resolves to no description SHALL show its name only, with no empty text block.

The description strings are game data resolved from the ability/trait id, generated from the pinned data-mines commit in English, German, Spanish and French, like the `raidBossAbilities` / `raidBossTraits` names; a language without the game's text for an id falls back to English. The served `raid-bosses` dataset carries ids only.

#### Scenario: Ability text scales with the step

- **WHEN** the user selects a higher progression step for an entity whose ability description contains a level-scaled variable
- **THEN** the rendered ability text shows the value for that step's ability level, and reverts when a lower step is selected

#### Scenario: Ability with no description

- **WHEN** a shown ability id resolves to a name but no description text
- **THEN** only the ability name is shown, with no empty description area

#### Scenario: Trait text when resolved

- **WHEN** a trait id resolves to both a name and rules-text
- **THEN** the trait shows its name and the rules-text; a trait that resolves to a name only shows just the name

#### Scenario: Rules text follows the language

- **WHEN** the user views a raid boss with the app in German
- **THEN** its ability and trait names and rules-text are the game's German text, with the same resolved values as in English
