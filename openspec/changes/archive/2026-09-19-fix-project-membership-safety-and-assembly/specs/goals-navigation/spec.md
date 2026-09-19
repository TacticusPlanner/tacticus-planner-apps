## MODIFIED Requirements

### Requirement: Overview's controls share one row on desktop

At or above the 768px desktop breakpoint, Overview SHALL render the status filter, the Type/Sort/Group filters, the project-membership filter, and the Planning Settings control in a single row.

#### Scenario: Desktop Overview renders one control row

- **WHEN** Overview is viewed at or above the 768px breakpoint
- **THEN** the status filter, Type/Sort/Group filters, project-membership filter, and Planning Settings control all appear in the same row, with no other row of controls above or below it

### Requirement: Overview's controls compress on mobile

Below the 768px mobile breakpoint, Overview SHALL keep the status filter (with its reached-indicator) in its own row. The Type/Sort/Group filters, the project-membership filter, and the Planning Settings control SHALL render as icon-only triggers, each retaining an accessible name for its full label.

#### Scenario: Mobile Overview keeps the status filter on its own row

- **WHEN** Overview is viewed below the 768px breakpoint
- **THEN** the status filter renders in a row separate from the Type/Sort/Group filters, the project-membership filter, and the Planning Settings control

#### Scenario: Mobile filter and settings controls show icons without text labels

- **WHEN** Overview is viewed below the 768px breakpoint
- **THEN** the Type/Sort/Group filters, the project-membership filter, and the Planning Settings control render their icon only, without visible text labels, while each remains identifiable via its accessible name

## ADDED Requirements

### Requirement: Overview's project filter is independent of the persisted project selection

Overview's project-membership filter SHALL NOT read from or write to the persisted project selection that project-aware Dailies and Insights views use. Changing it SHALL NOT change Current plan, and SHALL NOT change which project any calculating view operates on.

#### Scenario: Overview filtering leaves Dailies untouched

- **GIVEN** a project is selected in Dailies
- **WHEN** the user filters Overview by a different project
- **THEN** Dailies continues to operate on its own previously selected project

#### Scenario: Overview filtering does not change Current plan

- **GIVEN** project A is Current plan
- **WHEN** the user filters Overview by project B
- **THEN** project A remains Current plan

### Requirement: Overview's project filter is not a project selector

Overview's project-membership filter SHALL NOT be treated as a project selector for the purposes of the "Consistent project selector" and "Project selector position" requirements: it chooses no project for any view to operate on, and only narrows a displayed list. It SHALL therefore render within the Type/Sort/Group filter group rather than trailing in the status-control row, and SHALL NOT be required to present Current plan or default-project markers.

#### Scenario: The filter sits with the other filters

- **WHEN** Overview renders its controls at either breakpoint
- **THEN** the project-membership filter renders within the Type/Sort/Group filter group and not in the status filter's own row

#### Scenario: No selector markers are required

- **WHEN** the project-membership filter lists projects
- **THEN** it may list them without Current plan or default-project markers without violating the consistent-project-selector requirement
