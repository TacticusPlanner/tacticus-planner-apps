## MODIFIED Requirements

### Requirement: Acquisition sources are chosen from a multi-select group tree

The Unlock and Ascension goal cards SHALL present shard acquisition sources as a multi-select
tree of top-level groups — Campaigns, Onslaught, Shops — replacing any single-select source
control. The user SHALL be able to select any combination of the offered groups at the same
time. The control SHALL appear in both the goal-creation dialog or sheet and the Edit goal dialog or sheet
with the same groups and semantics.

#### Scenario: Multiple groups selected together

- **WHEN** a user selects both the Campaigns group and the Shops group for one goal
- **THEN** both contribute to the goal and neither selection clears the other

#### Scenario: Same control on create and edit

- **WHEN** a user opens the Edit goal dialog for an existing Unlock or Ascension goal
- **THEN** the acquisition-source control offers the same groups and reflects the goal's saved
  selection

#### Scenario: Replaces the single-select source control

- **WHEN** the acquisition-source control renders for an Ascension goal
- **THEN** there is no single-select "Campaign / Onslaught / Both" dropdown and the source
  choice is made entirely through the group tree
