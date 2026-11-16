## ADDED Requirements

### Requirement: A Reached goal deletes without confirmation

Deleting a goal whose computed attainment is Reached SHALL act at once, without the confirmation dialog, whether it is started from the goal card's Delete button or from the row menu on either platform. Deleting a goal that is not Reached SHALL keep its confirmation. The removal otherwise behaves as any deletion does (immediate removal, restore on failure, no success toast). Bulk delete keeps its own single confirmation.

#### Scenario: Deleting a Reached goal from its card

- **GIVEN** a Reached goal's card
- **WHEN** the user activates the card's Delete button
- **THEN** the goal is removed at once and no confirmation dialog is shown

#### Scenario: Deleting a Reached goal from the row menu

- **GIVEN** a Reached goal's row or card
- **WHEN** the user picks Delete from its "…" menu
- **THEN** the goal is removed at once and no confirmation dialog is shown

#### Scenario: An unreached goal still confirms

- **GIVEN** an Active goal that is not Reached
- **WHEN** the user picks Delete from its "…" menu
- **THEN** the confirmation dialog opens and nothing is deleted until the user confirms
