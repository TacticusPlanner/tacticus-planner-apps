## Purpose

Provides localized names for specific game equipment and relic items wherever shop rewards display them, while preserving stable reward identity and safe fallbacks.

## ADDED Requirements

### Requirement: Specific equipment names use locale and stable ID

For a specific `I_*` or `R_*` reward whose ID exists in the equipment catalog, Dailies Shops and Library Shops SHALL display the name for the active locale when available. Changing locale SHALL update the displayed name without changing the reward ID, icon, quantity, cost, or eligibility.

#### Scenario: Localized item in both shops

- **WHEN** a known equipment ID is offered in either shop view and its active-locale name exists
- **THEN** that locale's equipment-piece name is displayed for the same reward

#### Scenario: Locale switch

- **WHEN** the user changes locale while viewing a specific equipment reward
- **THEN** its displayed name updates to the new locale without changing the underlying offer

### Requirement: Fallbacks and generic pools remain distinct

If a known equipment ID lacks an active-locale name, the application SHALL use the catalog English item name. If the ID is unknown to the catalog, it SHALL use a readable ID-derived label. A randomized equipment pool SHALL retain its generic pool label and SHALL NOT be represented as one particular item.

#### Scenario: Known item missing translation

- **WHEN** a known equipment item has no active-locale name
- **THEN** its catalog English name appears, not the raw ID

#### Scenario: Unknown item

- **WHEN** a specific equipment ID is absent from both locale names and the catalog
- **THEN** a readable ID-derived label appears without breaking the shop card

#### Scenario: Generic pool

- **WHEN** a reward represents an equipment pool rather than a specific item
- **THEN** its generic pool label remains in place
