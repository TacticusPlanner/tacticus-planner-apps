# Spec Delta

## ADDED Requirements

### Requirement: Target options start above the goal's start

In the Create and Edit goal dialogs, a target picker SHALL offer only targets above the goal's start, for Rank, Ascension and each Ability track. It SHALL NOT offer a "None" or empty target. When a stored target is itself at or below the start, for example after an import, that stored value SHALL stay listed so the picker never opens blank. It SHALL then show the existing below-range message.

#### Scenario: Ascension edit

- **WHEN** the Edit goal dialog opens for Toth's Ascension goal that started at Epic two red stars
- **THEN** the target picker lists only progressions above Epic two red stars and no "None" option

#### Scenario: Ascension create

- **GIVEN** Incisus is Legendary with three red stars
- **WHEN** the user opens the Ascension target picker in the create sheet
- **THEN** the first option is Legendary four red stars

### Requirement: An Upgrade quantity error names its row

In the Edit goal dialog, an invalid Upgrade quantity SHALL show its message on the row of that material and mark that field invalid for assistive technology. It SHALL NOT show only one message for the whole list.

#### Scenario: One cleared quantity among two materials

- **WHEN** the owner clears the Lavish Helmet Crest quantity and leaves Psyk-Conductive Material at 1
- **THEN** only the Lavish Helmet Crest row shows the quantity message and is marked invalid, and Save is unavailable

### Requirement: The Edit goal dialog can add and remove Upgrade materials

For an Upgrade goal, the Edit goal dialog SHALL let the owner add materials with the same material picker as creation and remove any material row, as long as at least one material remains. Saving SHALL submit the whole material list as the Upgrade target. Removing the last material SHALL NOT be possible; the remove control on a single remaining row SHALL be unavailable.

#### Scenario: Add a material

- **GIVEN** Shiron's Upgrade goal targets Lavish Helmet Crest ×1
- **WHEN** the owner adds Psyk-Conductive Material ×2 and saves
- **THEN** the goal targets both materials

#### Scenario: Remove a material

- **GIVEN** an Upgrade goal with two materials
- **WHEN** the owner removes one and saves
- **THEN** the goal targets only the remaining material

#### Scenario: Last material

- **WHEN** an Upgrade goal has one material in the dialog
- **THEN** that row's remove control is unavailable
