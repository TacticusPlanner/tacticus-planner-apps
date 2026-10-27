## MODIFIED Requirements

### Requirement: The selected source set persists with the goal and is restored on edit

The user's selected source set — which groups are selected, which campaign nodes are checked,
and which shop offers are checked — SHALL be saved as part of the goal's farming configuration
and SHALL be restored when the goal is reopened for editing. A selection SHALL NOT be silently
dropped while the shop catalog or Onslaught progress data is still loading; a saved shop-offer
selection SHALL be retained even if its offer row is briefly unavailable during load.

#### Scenario: Round-trip through edit

- **WHEN** a user saves an Ascension goal with the Campaigns group (two nodes) and one Guild
  War Shop offer selected, then reopens the goal for editing
- **THEN** the same two campaign nodes and the same shop offer are shown as selected

#### Scenario: Selection retained during data load

- **WHEN** a goal with a saved shop-offer source is reopened and the shop catalog has not
  finished loading
- **THEN** the saved selection is preserved and reflected once the data is available, not
  reset to campaign-only

#### Scenario: Goal created before this control existed

- **WHEN** a goal whose farming config holds a single source choice and no group selection is opened for editing
- **THEN** its previous single source choice is presented as the equivalent group selection
  (campaign nodes and/or Onslaught) with no data loss

### Requirement: Default selection preserves campaign-only estimates

On a newly configured Unlock or Ascension goal, the control SHALL default to the Campaigns
group selected with the lowest-energy node(s) of each needed shard type pre-checked, and the
Onslaught and Shops groups unselected, so a goal the user does not further configure is estimated
from its lowest-energy campaign node(s) only.

#### Scenario: Fresh goal default

- **WHEN** a user enables an Unlock or Ascension goal and does not touch the acquisition-source
  control
- **THEN** the Campaigns group is selected with the default lowest-energy node(s) and the
  Onslaught and Shops groups are unselected

#### Scenario: No regression for campaign-only goals

- **WHEN** a goal's only selected source group is Campaigns
- **THEN** its shard need, energy, raid count, and completion date match the pre-change
  behavior for the same inputs
