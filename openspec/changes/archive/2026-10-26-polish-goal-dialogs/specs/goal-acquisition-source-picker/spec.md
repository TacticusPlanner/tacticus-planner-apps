# Spec Delta

## ADDED Requirements

### Requirement: Nodes the catalog cannot resolve are not offered

The Campaigns group SHALL NOT list a shard-farm node whose campaign battle is missing from the catalog as a selectable option, and SHALL NOT show its raw identifier as a label. If such a node is part of a goal's saved selection, the Edit goal dialog SHALL keep it in the saved selection and show it as an unknown node that cannot be selected again.

#### Scenario: Unknown node next to a known one

- **GIVEN** Morvenn Vahl's shard-farm nodes are Adepta Sororitas Standard 22 and a node `ASE22` that is missing from the battle catalog
- **WHEN** the Campaigns group is expanded
- **THEN** only Adepta Sororitas Standard 22 is offered and the text "ASE22" is not shown

### Requirement: Shop availability reads "Every day" for all-week offers

A shop offer row whose availability, or rotating-slot weekdays, covers all seven days SHALL state "Every day" instead of listing each weekday.

#### Scenario: Rogue Trader offer

- **WHEN** a Rogue Trader shard offer is available Sunday through Saturday
- **THEN** its row reads "Available every day"

### Requirement: A Campaigns group with no node checked states the cheapest node is used

When the Campaigns group is selected and no individual node is checked, the group SHALL state that the cheapest node of the needed shard type will be used, matching the estimate behaviour of "The Campaigns group lists the unit's shard-farm nodes". This applies on desktop and mobile, in creation and in the Edit goal dialog.

#### Scenario: Imported Ascension goal

- **WHEN** the Edit goal dialog opens for Toth's Ascension goal with Campaigns selected and no node checked
- **THEN** the Campaigns group says the cheapest node will be used
