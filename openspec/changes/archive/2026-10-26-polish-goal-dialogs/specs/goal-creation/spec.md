# Spec Delta

## MODIFIED Requirements

### Requirement: A blocked submission states its reason

The create-goal sheet SHALL show every reason the submit action is disabled at the same time, each inline under the control that causes it and inside that goal type's card. The reasons include incomplete configuration, a target already reached, and a slot conflict. A summary next to the submit action SHALL count the open problems. Activating a summary item SHALL scroll to its control and focus it. Each control with a problem SHALL be marked invalid, and SHALL reference its message, for assistive technology. An enabled Upgrade goal with no selected target SHALL be reported as requiring at least one target.

#### Scenario: Upgrade enabled with no target selected

- **WHEN** a user enables the Upgrade goal type and has selected no upgrade target
- **THEN** the Upgrade card shows a message stating that at least one upgrade target is required, the summary counts one problem, and the submit action is disabled

#### Scenario: Message clears once a target is selected

- **WHEN** the user then selects an upgrade target
- **THEN** the message is no longer shown and the summary no longer counts it

#### Scenario: Several problems at once

- **GIVEN** Incisus has an in-flight Rank goal ending at Gold III
- **WHEN** the user enables Rank with target Gold III and Upgrade with no material
- **THEN** the Rank card shows the slot conflict and the Upgrade card shows the missing-target message, both at the same time, and the summary states that 2 problems remain

#### Scenario: Summary moves focus

- **WHEN** the user activates the slot-conflict item in the summary
- **THEN** the form scrolls to the Rank card's target control and that control receives focus

#### Scenario: Assistive technology

- **WHEN** a control has a problem
- **THEN** it is exposed as invalid and its accessible description includes the message

### Requirement: Goal creation preselects a character and keeps a compact layout

When goal creation opens without a launch that carries a unit, the dialog SHALL preselect the first Character in the unit picker's list order (Mows skipped), once the catalog is available if it is still loading. A launch that carries a unit (prefill) SHALL keep that unit, and a unit the user has chosen SHALL never be replaced. After a "create another" submission clears the form, the same rule SHALL apply again (the first Character is preselected, the remembered projects and goal types are offered as before). With a unit preselected, the current-status section and the goal-type selector SHALL appear immediately. The creation form SHALL NOT show helper paragraphs for project membership or for "Create paused". On desktop the "Create paused" checkbox SHALL sit in the footer beside "Create another goal" on the left, and the footer's buttons SHALL be Close (outline) then the primary "Create goal" as the rightmost button. Below 768px the footer SHALL hold only Close and "Create goal" side by side in one row, with "Create goal" on the right. "Create paused" and "Create another goal" SHALL sit in the scrolling body directly above the "What will be created" review. The current-status section SHALL be collapsed to a one-line summary of the unit's rank, progression and level that expands on activation. The form SHALL follow the compact-layout requirement of `goal-edit-dialog`.

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

#### Scenario: Mobile footer layout

- **GIVEN** a viewport below 768px
- **WHEN** the creation sheet is open
- **THEN** the footer is one row with Close then Create goal, and "Create paused" and "Create another goal" appear in the body above the review

#### Scenario: Mobile status summary

- **GIVEN** a viewport below 768px and Incisus selected at Gold II, Legendary three red stars, level 38
- **WHEN** the sheet opens
- **THEN** the current status shows as one line with those three values, the goal-type selector is visible without scrolling at 390x780, and activating the summary expands the full status

## ADDED Requirements

### Requirement: Default targets skip reached and taken targets

When a goal type is enabled, its target SHALL default to the first step above the unit's current value that no in-flight goal of the same unit and type already holds. If every step above the current value is taken or none exists, the target SHALL default to the first step above the current value and the slot conflict SHALL be shown. This rule SHALL apply to Rank (rank plus additional target), Ascension and Ability (each track); an Ascension target SHALL never default to the current progression.

#### Scenario: Ascension defaults to the next step

- **GIVEN** Incisus is Legendary with three red stars and has no Ascension goal
- **WHEN** the user enables Ascension
- **THEN** the target is Legendary with four red stars and no "already reached" message is shown

#### Scenario: Rank skips taken targets

- **GIVEN** Incisus is Gold II and has in-flight Rank goals ending at Gold III and Diamond I
- **WHEN** the user enables Rank
- **THEN** the target defaults to Diamond II and no slot conflict is shown

### Requirement: Target pickers mark targets that are already a goal

In the create sheet's target pickers, a target that an in-flight goal of the same unit and type already holds SHALL be shown as unavailable, with visible text saying it is already a goal, and SHALL NOT be selectable.

#### Scenario: Taken target in the Rank picker

- **GIVEN** Incisus has an in-flight Rank goal ending at Gold III
- **WHEN** the user opens the Rank target picker
- **THEN** Gold III is shown with the text "Already a goal" and cannot be selected

### Requirement: An existing Unlock goal disables Unlock

The Unlock goal type SHALL be disabled when the unit already has an in-flight Unlock goal. Its hint SHALL state that the unit already has an Unlock goal and SHALL offer to open that goal. Selecting Rank or another type that needs the unit unlocked SHALL then not suggest a new Unlock goal.

#### Scenario: Morvenn Vahl already has an Unlock goal

- **GIVEN** Morvenn Vahl is locked and has an in-flight Unlock goal
- **WHEN** the user selects Morvenn Vahl
- **THEN** Unlock is disabled, the hint says she already has an Unlock goal with an action that opens it, and enabling Rank does not offer to also create an Unlock goal

### Requirement: Goal-type hints name the unit kind

Goal-type hints and messages that refer to the unit SHALL use wording that matches the unit's kind: Character or Machine of War.

#### Scenario: Machine of War already owned

- **WHEN** the user selects an owned Machine of War such as the Exorcist
- **THEN** the disabled Unlock hint refers to a Machine of War, not a character

### Requirement: Upgrade quantities are validated inline and show the owned count

Each Upgrade material row SHALL show how many of that material the account owns beside the target quantity. A quantity that is empty, not a whole number, below 1 or above 10,000 SHALL NOT be clamped or replaced silently. It SHALL block submission with an inline message on that row. A quantity at or below the owned count SHALL show a non-blocking warning on that row that the target is already met.

#### Scenario: Cleared quantity

- **WHEN** the user clears the Holy Chaplet quantity
- **THEN** the field stays empty, that row shows the quantity error, and submission is blocked

#### Scenario: Target already met

- **GIVEN** the account owns 13 Holy Chaplets
- **WHEN** the user sets the Holy Chaplet quantity to 10
- **THEN** the row shows "own 13" and a warning that the target is already met, and submission is still allowed

### Requirement: The review lists each goal with its target

The "What will be created" review SHALL list each goal the submission would create, in the same order as the goal-type cards, with its start and target, for example "Rank: Gold II → Diamond II". Prerequisite goals SHALL be marked as prerequisites. While the form has a blocking problem, the project estimate SHALL state that the estimate appears once the problems are fixed instead of showing a loading state. The estimate SHALL be labelled as the time until the selected project is done.

#### Scenario: Two goals in the review

- **WHEN** the user enables Ascension (Legendary three red stars to four red stars) and Rank (Gold II to Diamond II) for Incisus
- **THEN** the review lists "Ascension: Legendary ★★★ → ★★★★" and "Rank: Gold II → Diamond II" in card order

#### Scenario: Invalid form

- **WHEN** the form has a blocking problem
- **THEN** each project's estimate line says the estimate appears once the problems are fixed, and no "calculating" text is shown

### Requirement: A newly enabled goal-type card is brought into view

When the user enables a goal type, the sheet SHALL scroll so that the new card's header is visible, unless it is already fully visible. It SHALL NOT move keyboard focus.

#### Scenario: Mobile enable

- **GIVEN** a viewport below 768px with the goal-type selector at the top of the visible body
- **WHEN** the user enables Rank
- **THEN** the body scrolls until the Rank card's header is visible, and focus stays on the Rank checkbox

### Requirement: Every preview section states what it has

Each preview section in a goal-type card SHALL show exactly one of these states:

- loading;
- failed;
- not applicable, with the reason;
- its content.

It SHALL NOT render as an empty box.

#### Scenario: Machine of War Ability resources

- **WHEN** the user enables Ability for the Exorcist and its resource preview has nothing to list
- **THEN** the "Resources needed" section states why, for example that no upgrades are needed for the selected levels, rather than showing an empty box

### Requirement: The desktop create dialog does not move as goal types change

At 768px and wider, the create dialog SHALL open at a fixed height, the smaller of its maximum height and the viewport height less its margins. It SHALL NOT change height or position when goal types are enabled or disabled, or when previews load; extra content SHALL scroll inside the dialog.

#### Scenario: First goal type does not move the dialog

- **GIVEN** the desktop create dialog is open for Incisus with no goal type enabled
- **WHEN** the user enables Rank
- **THEN** the dialog's top edge and height stay the same

### Requirement: The desktop create dialog keeps status and review in view

At 768px and wider, the create dialog body SHALL have a scrolling main column, holding the goal-type selector and then the enabled goal cards, and a side column that stays in view while the main column scrolls, holding the current status and the "What will be created" review. With no goal type enabled, the main column SHALL show an empty state asking the user to choose a goal type.

#### Scenario: Review stays visible

- **GIVEN** Ascension, Ability, Upgrade and Rank are enabled
- **WHEN** the user scrolls the main column to the Rank card
- **THEN** the current status and the review stay in view in the side column

#### Scenario: Nothing chosen yet

- **WHEN** the dialog opens with no goal type enabled
- **THEN** the main column shows the empty state below the selector

### Requirement: Goal cards collapse to a one-line summary

On desktop and mobile, at most one goal card SHALL be expanded. Enabling a goal type, or activating a collapsed card's header, SHALL expand that card and collapse the others. A collapsed card SHALL show one line with its goal type's icon and name, its start → target, and its number of blocking problems when it has any.

#### Scenario: Enabling a second type

- **GIVEN** the Rank card is expanded
- **WHEN** the user enables Ascension
- **THEN** the Ascension card is expanded, and Rank collapses to "Rank · Gold II → Diamond II"

#### Scenario: Collapsed card shows its problem count

- **WHEN** the Upgrade card is collapsed and has no material
- **THEN** its summary line shows one problem

### Requirement: Goal card headers set cards apart and open on problems

Each goal card SHALL start with a header row, visually set off from its fields, that names its goal type, so adjacent cards are told apart while expanded. Following a problem from the issue summary SHALL expand that problem's card before moving focus to its field.

#### Scenario: Problem on a collapsed card

- **GIVEN** the Upgrade card is collapsed and has no material
- **WHEN** the user follows its problem from the issue summary
- **THEN** the Upgrade card expands and focus moves to its material picker

### Requirement: Creation sets notes and priority

The create dialog SHALL let the user enter optional notes for each goal being created, within the same length limit as edit, and choose where the new goals sit in the global priority order. The priority choice SHALL default to the end of the order, which is today's behaviour. The created goals SHALL be saved with their notes and placed at the chosen position in the same request that creates them, keeping the order they have in the composer.

#### Scenario: Notes on one goal

- **WHEN** the user creates Rank and Ascension goals for Incisus with the note "For Guild Raid" on the Rank goal only
- **THEN** the Rank goal has that note and the Ascension goal has none

#### Scenario: Priority at the top

- **GIVEN** the user has 12 in-flight goals
- **WHEN** they create two goals with priority set to the top
- **THEN** the new goals hold positions 1 and 2 in composer order, and the earlier goals move down by two

#### Scenario: Default priority

- **WHEN** the user creates a goal without changing priority
- **THEN** it is placed after every existing in-flight goal
