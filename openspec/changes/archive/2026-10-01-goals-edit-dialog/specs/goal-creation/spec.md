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

### Requirement: Goal creation preselects a character and keeps a compact layout

When goal creation opens without a launch that carries a unit, the dialog SHALL preselect the first Character in the unit picker's list order (Mows skipped), once the catalog is available if it is still loading. A launch that carries a unit (prefill) SHALL keep that unit, and a unit the user has chosen SHALL never be replaced. After a "create another" submission clears the form, the same rule SHALL apply again (the first Character is preselected, the remembered projects and goal types are offered as before). With a unit preselected, the current-status section and the goal-type selector SHALL appear immediately. The creation form SHALL NOT show helper paragraphs for project membership or for "Create paused"; the "Create paused" checkbox SHALL sit in the footer beside "Create another goal" on the left, and the footer's buttons SHALL be Close (outline) then the primary "Create goal" as the rightmost button. The form SHALL follow the compact-layout requirement of `goal-edit-dialog`.

#### Scenario: First character preselected

- **WHEN** creation opens with no prefill and the catalog lists characters
- **THEN** the first Character in the picker is selected and its status and goal types are shown

#### Scenario: Prefill wins

- **WHEN** creation opens with a prefilled unit
- **THEN** that unit is selected, not the first Character

#### Scenario: Create another

- **WHEN** the user submits with "create another" checked
- **THEN** the form resets and the first Character is preselected again

#### Scenario: Footer layout

- **WHEN** the desktop dialog is open
- **THEN** "Create paused" and "Create another goal" are at the footer's left, followed by Close, then Create goal at the far right
