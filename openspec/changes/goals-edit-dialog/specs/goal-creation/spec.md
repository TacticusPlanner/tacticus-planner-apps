## ADDED Requirements

### Requirement: Goal creation opens as a dialog on desktop

At or above 768px, launching goal creation (from any entry point in `goal-creation-entry-points`) SHALL open the creation form in a centered dialog laid out per the space requirement of `goal-edit-dialog`; below 768px it SHALL open the existing bottom-anchored sheet. The form's fields, validation, "create another" option, prefill behavior and outside-click protection SHALL be unchanged in both presentations, and no in-progress input SHALL be lost by the presentation change.

#### Scenario: Desktop presentation

- **WHEN** the user activates Create Goal at or above 768px
- **THEN** a centered dialog opens with the same unit and goal-kind form as before

#### Scenario: Mobile presentation unchanged

- **WHEN** the user activates Create Goal below 768px
- **THEN** the bottom-anchored sheet opens as before

#### Scenario: Prefill and create another

- **WHEN** creation is launched with a prefilled unit and the user submits with "create another" checked
- **THEN** the dialog stays open and resets exactly as the sheet did
