# Spec Delta

## ADDED Requirements

### Requirement: Edit presents a goal the same way creation does

For a goal of a given kind, the Edit goal dialog SHALL show its target, sources or farming strategy, Mythic materials, notes and estimate with the same controls, labels, validation messages, empty states and preview states as the create dialog uses for that kind.

#### Scenario: Same target-reached message

- **GIVEN** Toth's Ascension goal started at Epic two red stars
- **WHEN** the user selects a target at or below that start, in edit or in creation
- **THEN** both dialogs show the same message under the target control

#### Scenario: Same Upgrade quantity message

- **WHEN** the user clears an Upgrade material's quantity, in edit or in creation
- **THEN** both dialogs show the same message on that material's row

### Requirement: Edit omits creation-only controls

The Edit goal dialog SHALL show the unit and goal type read-only. It SHALL NOT show prerequisite suggestions, milestones, "Create paused" or "Create another goal".

#### Scenario: Creation-only controls absent

- **WHEN** the Edit goal dialog opens for a Rank goal
- **THEN** it shows no milestone, prerequisite, "Create paused" or "Create another goal" control
