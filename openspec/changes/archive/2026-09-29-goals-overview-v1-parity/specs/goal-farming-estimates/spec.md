## ADDED Requirements

### Requirement: Campaign farming considers only unlocked nodes

When the estimator chooses campaign nodes to farm a material, it SHALL consider only nodes the player has already unlocked, judged from the player's synced campaign progress, as V1 does. A node the player has not unlocked SHALL NOT be selected, priced, or used to compute energy or completion dates, even when it would be the cheapest node in the catalog. This applies to every consumer of the shared estimate (Goals, Today, Raids Plan, blockers, Insights). A material with no unlocked node available SHALL be treated as having no farm location (the existing blocked-goal behavior), not as farmable at a locked node. A goal that restricts its own farm locations SHALL still be limited to those locations, further limited to the unlocked ones.

#### Scenario: A cheaper locked node is ignored

- **GIVEN** a material is cheapest at a node the player has not unlocked and next cheapest at an unlocked node
- **WHEN** the plan estimate is computed
- **THEN** the material is farmed at the unlocked node, and its energy is priced at that node

#### Scenario: No unlocked node

- **GIVEN** every node that drops a needed material is locked for the player
- **WHEN** the goal's estimate is computed
- **THEN** the goal is reported as blocked for lack of a farm location, and no energy is attributed to a locked node

#### Scenario: Consumers agree

- **GIVEN** a locked node would be cheapest for a material
- **WHEN** Goals, Today and Raids Plan each show energy for a goal using that material
- **THEN** all three use the same unlocked-node choice
