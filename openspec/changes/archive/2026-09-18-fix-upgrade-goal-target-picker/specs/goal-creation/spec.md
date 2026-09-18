## ADDED Requirements

### Requirement: The Upgrade card offers farmable materials for the selected range

The create-goal sheet's Upgrade card SHALL offer, as selectable targets, the farmable base
materials required by the currently selected rank range — obtained by expanding every
crafted upgrade in that range through its recipe, recursively, until only non-craftable
materials remain. The offered set SHALL be deduplicated, and each entry SHALL carry the
total quantity that range requires, which SHALL prefill the target's quantity when it is
selected. A Machine of War SHALL be offered the same expansion over its ability recipes.

Whenever the Upgrade goal type can be enabled for the selected unit, the offered set SHALL
NOT be empty.

#### Scenario: A rank range whose upgrades are all crafted

- **GIVEN** a Character whose selected rank range requires only crafted upgrades
- **WHEN** the user enables the Upgrade goal type
- **THEN** the card offers the base materials those crafted upgrades decompose into, and
  the user can select one

#### Scenario: Quantity reflects the decomposed requirement

- **WHEN** the user selects an offered material
- **THEN** its target quantity prefills with the total number of that material the selected
  rank range requires, counting every crafted upgrade it is an ingredient of

#### Scenario: Changing the rank range changes the suggestions

- **WHEN** the user changes the Upgrade card's rank range
- **THEN** the offered materials and their required quantities are recalculated for the new
  range

### Requirement: A blocked submission states its reason

The create-goal sheet SHALL show a validation message whenever the submit action is
disabled because a goal type's own configuration is incomplete. An enabled Upgrade goal
with no selected target SHALL be reported as requiring at least one target.

#### Scenario: Upgrade enabled with no target selected

- **WHEN** a user enables the Upgrade goal type and has selected no upgrade target
- **THEN** the sheet shows a validation message stating that at least one upgrade target is
  required, and the submit action is disabled

#### Scenario: Message clears once a target is selected

- **WHEN** the user then selects an upgrade target
- **THEN** the validation message is no longer shown
