## Purpose

Makes Projects a Current-plan-first planning dashboard and makes the Character or Machine of War the user-controlled priority object within a project.

## MODIFIED Requirements

### Requirement: Projects has a list route and a single-project detail route

The system SHALL present the project dashboard at `/goals/projects` and an owned project's unit-grouped detail at `/goals/projects/{id}`. Opening or switching the viewed detail SHALL NOT change Current plan unless the user explicitly invokes “Make current.”

#### Scenario: Dashboard and detail remain addressable

- **WHEN** the user opens either project route
- **THEN** the requested dashboard or project detail renders at its stable URL

#### Scenario: Browsing does not change Current plan

- **GIVEN** project A is Current plan
- **WHEN** the user opens project B
- **THEN** project A remains Current plan

### Requirement: The list route shows every project without its goal table

The dashboard SHALL show Current plan first, other non-archived projects separately, and archived projects in a subdued section collapsed by default when non-archived projects exist. It SHALL explain that Current plan supplies the default context for Dailies and Insights, and SHALL NOT render a goal table.

#### Scenario: Current plan is immediately identifiable

- **GIVEN** one owned project is Current plan
- **WHEN** the dashboard renders
- **THEN** it appears first with a visible Current plan label and explanatory context

#### Scenario: Archived projects do not compete for focus

- **GIVEN** available and archived projects exist
- **WHEN** the dashboard initially renders
- **THEN** archived projects are grouped in a collapsed section

### Requirement: A project row navigates to its detail route

Activating a project card outside its controls SHALL navigate to its detail route. Card controls SHALL NOT navigate or implicitly change Current plan.

#### Scenario: Card opens detail

- **WHEN** the user activates a project card outside its controls
- **THEN** `/goals/projects/{id}` opens without changing Current plan

#### Scenario: Card action does not navigate

- **WHEN** the user invokes Make current or an overflow action
- **THEN** that action runs without also opening the card

### Requirement: Project lifecycle actions render as inline icons on each row

Project actions SHALL no longer render as an always-visible inline icon cluster. A non-current available project SHALL expose a labeled “Make current” action. Edit and Archive/Restore SHALL appear in an accessible overflow menu. Archive SHALL be unavailable with explanatory text for Current plan and the default project.

#### Scenario: Make another project current

- **GIVEN** project A is current and project B is available
- **WHEN** the user activates Make current on B
- **THEN** B becomes Current plan and moves to the prominent section without navigation

#### Scenario: Secondary actions are labeled

- **WHEN** a project action menu opens
- **THEN** applicable Edit and Archive or Restore actions appear with text labels

### Requirement: The detail route's current-project row matches the list route's row

The detail route SHALL replace the reused list row with a semantic project header containing back navigation, identity, description, Current plan state/action, summary metrics, a project switcher, and overflow management actions. Goal controls and unit-grouped content SHALL render below it.

#### Scenario: Current detail has no redundant action

- **WHEN** the Current plan detail opens
- **THEN** its header identifies Current plan and omits Make current

#### Scenario: Non-current detail can become current

- **WHEN** an available non-current detail opens
- **THEN** its header offers Make current

### Requirement: The detail route's project selector switches which project's detail route is shown

The project switcher SHALL be integrated into the detail header/navigation area. Changing it SHALL navigate to the selected project's route and SHALL NOT change Current plan.

#### Scenario: Switcher changes only viewed project

- **GIVEN** project A is Current plan and project B is viewed
- **WHEN** the user switches to project C
- **THEN** project C's route opens and A remains Current plan

### Requirement: The detail route shares Overview's goal filters

The detail route SHALL continue to offer status, Type, Sort, and Group controls for normal browsing. Those controls SHALL NOT affect stored unit priority. Unit reprioritization SHALL occur only in its dedicated mode.

#### Scenario: Browsing sort does not alter priority

- **WHEN** the user changes Sort or Group on project detail
- **THEN** the visible presentation changes but the stored unit order does not

### Requirement: No project exists yet

When no projects exist, the dashboard SHALL explain that projects group unit goals into alternative prioritized plans and provide a prominent labeled Create project action. It SHALL not render empty project sections or metrics.

#### Scenario: Empty dashboard teaches projects

- **WHEN** a user with no projects opens the dashboard
- **THEN** explanatory copy and Create project are shown

## ADDED Requirements

### Requirement: Project cards communicate planning value

Every project card SHALL show color, name, description when present, and available goal/unit summary information. Current plan SHALL additionally show available reached, blocked, and estimate/progress information. Identity and actions SHALL remain usable while each summary independently loads or fails.

#### Scenario: Summary loads progressively

- **GIVEN** project identity has loaded and summary calculation has not
- **WHEN** the card renders
- **THEN** identity/actions render with a summary skeleton

#### Scenario: One summary fails

- **WHEN** one project's summary fails
- **THEN** only that card shows unavailable/retry state

### Requirement: Project goals are grouped by unit

Project detail SHALL group every Active/Paused Character or MoW goal by `(entityType, entityId)`. Each unit SHALL appear once and show its contained goals in automatic execution order.

#### Scenario: Several goals share one unit block

- **GIVEN** Ragnar has Rank, Ability, and Ascension goals in the project
- **WHEN** project detail renders
- **THEN** one Ragnar block contains all three goals

#### Scenario: Same unit has historical goals

- **GIVEN** the unit also has Completed or Archived goals
- **WHEN** the user selects the corresponding status filter
- **THEN** those goals remain discoverable without occupying the in-flight priority block

### Requirement: Users prioritize units rather than goals

Project detail SHALL provide a dedicated Reprioritize units action for projects with at least two in-flight unit blocks. The mode SHALL let the user drag whole unit blocks, save once, or cancel. Normal goal rows SHALL not render move-up/down priority controls or numeric priority inputs.

#### Scenario: Moving a unit moves all its goals

- **GIVEN** Ragnar has multiple in-flight goals
- **WHEN** the user drags Ragnar below Aun'shi and saves
- **THEN** every Ragnar goal follows every Aun'shi goal in the canonical project order

#### Scenario: Cancel discards local order

- **WHEN** the user reorders units and cancels
- **THEN** stored priority remains unchanged

#### Scenario: Reordering is unavailable with fewer than two units

- **GIVEN** zero or one in-flight unit block exists
- **WHEN** project detail renders
- **THEN** Reprioritize units is unavailable or omitted

### Requirement: Goal order inside a unit is automatic

Within a unit block, prerequisite dependencies SHALL precede dependent goals. Unrelated existing goals SHALL preserve relative order; a new goal SHALL follow its prerequisites and otherwise append to the block. The user SHALL not manually reorder goals inside a unit.

#### Scenario: Dependency precedes target

- **GIVEN** a Rank goal depends on an Ascension goal for the same unit
- **WHEN** canonical order is produced
- **THEN** Ascension precedes Rank regardless of their prior numeric values

#### Scenario: New unrelated goal joins its unit

- **GIVEN** a unit already has goals in a project
- **WHEN** a new unrelated goal type is added
- **THEN** it appends inside that unit block without changing the unit's position

### Requirement: Unit order drives priority-sensitive calculations

The ordered project-goal list consumed by Dailies, Raids Plan, Insights, and farming estimates SHALL be the same flattened unit order shown by project detail. No consumer SHALL independently sort it into a different execution order.

#### Scenario: Shared inventory follows unit order

- **GIVEN** two units need the same resource and available inventory covers only the first unit
- **WHEN** the plan is calculated
- **THEN** inventory is applied to the higher-priority unit's goals first

### Requirement: Project management is deliberately responsive

At or above 768px, project cards SHALL use a comparison-friendly grid and reprioritization SHALL use a focused dialog/Sheet. Below 768px, cards and headers SHALL stack, primary actions SHALL remain labeled and touch-sized, and reprioritization SHALL use a full-height touch-friendly Sheet.

#### Scenario: Mobile unit drag surface

- **WHEN** reprioritization opens below 768px
- **THEN** each unit has a clearly labeled, touch-sized drag handle and the full list remains scrollable
