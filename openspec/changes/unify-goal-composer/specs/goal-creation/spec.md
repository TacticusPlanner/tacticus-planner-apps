# Spec Delta

## MODIFIED Requirements

### Requirement: Goal creation preselects a character and keeps a compact layout

When goal creation opens without a launch that carries a unit, the dialog SHALL preselect the first Character in the unit picker's list order (Mows skipped), once the catalog is available if it is still loading. A launch that carries a unit (prefill) SHALL keep that unit, and a unit the user has chosen SHALL never be replaced. After a "create another" submission clears the form, the same rule SHALL apply again (the first Character is preselected, the remembered projects and goal types are offered as before). With a unit preselected, the current-status section and the goal-type selector SHALL appear immediately. The creation form SHALL NOT show helper paragraphs for project membership or for "Create paused". On desktop the "Create paused" checkbox SHALL sit in the footer beside "Create another goal" on the left, and the footer's buttons SHALL be Close (outline) then the primary "Create goal" as the rightmost button. Below 768px creation SHALL follow the mobile step flow requirement. The form SHALL follow the compact-layout requirement of `goal-edit-dialog`.

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

## ADDED Requirements

### Requirement: Mobile creation is a three-step flow

Below 768px, the create sheet SHALL show one step at a time, with a step indicator naming all three steps and marking the current one:

1. **Unit:** the unit picker and full current status.
2. **Goals:** a one-line status summary, the goal-type selector, goal cards and prerequisite suggestions.
3. **Review:** projects, priority, "Create paused", "Create another goal", and "What will be created" with its estimate.

#### Scenario: Plain launch

- **GIVEN** a viewport below 768px
- **WHEN** the user opens creation from the Goals page's Create Goal action
- **THEN** the Unit step is shown and the indicator marks step 1 of 3

#### Scenario: Desktop unchanged

- **GIVEN** a viewport of 768px or wider
- **WHEN** creation opens
- **THEN** it shows the single two-pane dialog with no step indicator

### Requirement: Mobile step navigation keeps values

On mobile the footer SHALL hold one row: Back (Close on the first step) on the left, and Next on the right, or "Create goal" on Review. Creation SHALL start at Unit, or at Goals when launched with a unit. Moving between steps SHALL keep every entered value.

#### Scenario: Launch with a unit

- **GIVEN** a viewport below 768px
- **WHEN** creation is launched for Incisus from a Legendary Event leaderboard row
- **THEN** the Goals step is shown, and Back returns to the Unit step

#### Scenario: Values survive Back

- **GIVEN** the user enabled Rank with target Diamond II and moved to Review
- **WHEN** they press Back
- **THEN** the Goals step shows Rank with target Diamond II

### Requirement: A mobile step with problems cannot be left forward

On the mobile Goals step, Next SHALL be unavailable while no goal type is enabled or any enabled goal has a blocking problem. The issue summary SHALL list those problems beside Next, and following one SHALL expand its card and focus its field. Back SHALL always be available.

#### Scenario: Upgrade without material

- **GIVEN** the Goals step with Upgrade enabled and no material chosen
- **THEN** Next is unavailable and the issue summary lists the missing material
- **WHEN** the user chooses a material
- **THEN** Next becomes available

#### Scenario: No goal type

- **WHEN** the Goals step has no goal type enabled
- **THEN** Next is unavailable and the empty state says to choose a goal type
