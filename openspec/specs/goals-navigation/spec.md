# goals-navigation Specification

## Purpose

Defines the Goals section's shared header/toolbar behavior — where Planning Settings lives, the shared status filter control, and how the project selector is presented — so Overview, Projects, and Insights read as one consistent surface instead of three independently-built header layouts.

## Requirements

### Requirement: Planning Settings is an Overview-only control

The Goals section SHALL render its Planning Settings entry point only on the Overview subpage. Projects and Insights SHALL NOT render a Planning Settings entry point of their own.

#### Scenario: Planning Settings visible on Overview

- **WHEN** the user opens Goals Overview
- **THEN** a Planning Settings control is visible and opens the planning settings dialog

#### Scenario: Planning Settings absent from Projects and Insights

- **WHEN** the user opens Goals Projects or Goals Insights
- **THEN** no Planning Settings control is rendered on that page

### Requirement: Shared status filter control

Overview and a project's detail route SHALL each present the same status filter — Unfulfilled, Reached, Archived — as a single select control defaulting to Unfulfilled, rather than three separate tab buttons. Each option SHALL show its count of matching goals.

#### Scenario: Status filter defaults to Unfulfilled

- **WHEN** the user opens Overview or a project's detail route
- **THEN** the status filter shows "Unfulfilled" as the selected value and the goal list reflects only unfulfilled goals

#### Scenario: Selecting a status filters the goal list

- **WHEN** the user selects "Reached" or "Archived" from the status filter
- **THEN** the goal list updates to show only goals in that status, and the control retains the selected value

### Requirement: Reached-goal indicator on the status filter

When there is at least one goal in the Reached status and the status filter's current selection is not "Reached", the status filter's trigger SHALL show a visual indicator that Reached goals exist. The indicator SHALL NOT be shown while "Reached" is the current selection, or when there are no goals in the Reached status.

#### Scenario: Indicator appears when Reached goals exist and are not being viewed

- **GIVEN** at least one goal has reached status and the status filter is currently set to "Unfulfilled" or "Archived"
- **WHEN** the page renders
- **THEN** the status filter's trigger shows the reached-goal indicator

#### Scenario: Indicator hidden while viewing Reached

- **GIVEN** at least one goal has reached status
- **WHEN** the status filter is set to "Reached"
- **THEN** the status filter's trigger does not show the indicator

#### Scenario: Indicator hidden when there are no reached goals

- **GIVEN** no goals currently have reached status
- **WHEN** the page renders with the status filter set to any value other than "Reached"
- **THEN** the status filter's trigger does not show the indicator

### Requirement: Overview's controls share one row on desktop

At or above the 768px desktop breakpoint, Overview SHALL render the status filter, the Type/Sort/Group filters, and the Planning Settings control in a single row.

#### Scenario: Desktop Overview renders one control row

- **WHEN** Overview is viewed at or above the 768px breakpoint
- **THEN** the status filter, Type/Sort/Group filters, and Planning Settings control all appear in the same row, with no other row of controls above or below it

### Requirement: Overview's controls compress on mobile

Below the 768px mobile breakpoint, Overview SHALL keep the status filter (with its reached-indicator) in its own row. The Type/Sort/Group filters and the Planning Settings control SHALL render as icon-only triggers, each retaining an accessible name for its full label.

#### Scenario: Mobile Overview keeps the status filter on its own row

- **WHEN** Overview is viewed below the 768px breakpoint
- **THEN** the status filter renders in a row separate from the Type/Sort/Group filters and Planning Settings control

#### Scenario: Mobile filter and settings controls show icons without text labels

- **WHEN** Overview is viewed below the 768px breakpoint
- **THEN** the Type/Sort/Group filters and the Planning Settings control render their icon only, without visible text labels, while each remains identifiable via its accessible name

### Requirement: Consistent project selector

Every Goals or Dailies subpage that includes a project selector SHALL use the shared project-selector component and SHALL identify the project whose `isActivePlan` value is true as the **Current plan**. It SHALL NOT label that relationship merely “Active.” Project color, Current plan, and default-project markers SHALL be presented consistently everywhere the selector appears.

#### Scenario: Insights uses Current plan terminology

- **WHEN** the user opens Goals Insights
- **THEN** its shared project selector identifies the persisted current project with the “Current plan” marker

#### Scenario: Insights uses the shared project selector

- **WHEN** the user opens Goals Insights
- **THEN** its project selector uses the shared presentation, including project color and default/Current plan markers

#### Scenario: Goal lifecycle remains Active

- **WHEN** a goal with lifecycle status `Active` is shown near a Current plan marker
- **THEN** the goal status remains labeled “Active” and the selected project is labeled “Current plan,” making the two concepts distinguishable

### Requirement: Project selector position

On any subpage that renders both a tab or status control and a project selector, the project selector SHALL be trailing (right-aligned) in the same row as that tab or status control. On a subpage with a project selector and no tab or status control, the project selector SHALL be right-aligned alone.

#### Scenario: Project selector shares a row with tabs where both exist

- **WHEN** a subpage renders both a tab/status row and a project selector
- **THEN** the project selector appears trailing in that same row, not in a separate row

#### Scenario: Project selector stands alone when there is nothing to pair it with

- **WHEN** a subpage renders a project selector but no tab or status control (Goals Insights)
- **THEN** the project selector is right-aligned in its own row

### Requirement: Current plan supplies the implicit project selection

Project-aware Dailies and Insights views SHALL initially select the Current plan when one is available and SHALL fall back to the default project only when no Current plan is available. Route navigation to a project detail SHALL NOT update this persisted preference.

#### Scenario: Dailies defaults to Current plan

- **GIVEN** one project is the Current plan and another is the default project
- **WHEN** the user opens Dailies without a local project selection
- **THEN** Dailies selects the Current plan

#### Scenario: Default project is the fallback

- **GIVEN** no available project is marked Current plan and a default project exists
- **WHEN** a project-aware view needs an implicit selection
- **THEN** it selects the default project

#### Scenario: Browsing a project does not change implicit selection

- **GIVEN** project A is the Current plan
- **WHEN** the user navigates to project B's detail and later opens Dailies
- **THEN** Dailies still defaults to project A unless the user explicitly made another project current
