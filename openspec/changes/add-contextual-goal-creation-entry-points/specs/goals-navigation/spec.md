## MODIFIED Requirements

### Requirement: Overview's controls share one row on desktop

At or above the 768px desktop breakpoint, Overview SHALL render the status filter, the Type/Sort/Group filters, the project-membership filter, the contextual Create Goal action, and the Planning Settings control in a single row.

#### Scenario: Desktop Overview renders one control row

- **WHEN** Overview is viewed at or above the 768px breakpoint
- **THEN** the status filter, Type/Sort/Group filters, project-membership filter, contextual Create Goal action, and Planning Settings control all appear in the same row, with no other row of controls above or below it

### Requirement: Overview's controls compress on mobile

Below the 768px mobile breakpoint, Overview SHALL keep the status filter (with its reached-indicator) in its own row. The Type/Sort/Group filters, the project-membership filter, the contextual Create Goal action, and the Planning Settings control SHALL render as icon-only triggers, each retaining an accessible name for its full label.

#### Scenario: Mobile Overview keeps the status filter on its own row

- **WHEN** Overview is viewed below the 768px breakpoint
- **THEN** the status filter renders in a row separate from the Type/Sort/Group filters, the project-membership filter, the contextual Create Goal action, and the Planning Settings control

#### Scenario: Mobile filter and settings controls show icons without text labels

- **WHEN** Overview is viewed below the 768px breakpoint
- **THEN** the Type/Sort/Group filters, the project-membership filter, the contextual Create Goal action, and the Planning Settings control render their icon only, without visible text labels, while each remains identifiable via its accessible name
