## MODIFIED Requirements

### Requirement: Goals controls share one row on desktop

At or above the 768px desktop breakpoint, Goals SHALL render the status filter, the Type/Group filters, the project-membership filter, the density toggle, the contextual Create Goal action, and the Planning Settings control in a single row.

#### Scenario: Desktop Goals renders one control row

- **WHEN** Goals is viewed at or above the 768px breakpoint
- **THEN** the status filter, Type/Group filters, project-membership filter, density toggle, contextual Create Goal action, and Planning Settings control all appear in the same row, with no other row of controls above or below it

### Requirement: Goals controls compress on mobile

Below the 768px mobile breakpoint, Goals SHALL keep the status filter (with its reached-indicator) in its own row. The Type/Group filters, the project-membership filter, the density toggle, the contextual Create Goal action, and the Planning Settings control SHALL render as icon-only triggers, each retaining an accessible name for its full label. When the icon-only triggers no longer fit on one line at the narrowest supported width, the row SHALL wrap onto a further line rather than clip or scroll a control out of reach.

#### Scenario: Mobile Goals keeps the status filter on its own row

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the status filter renders in a row separate from the Type/Group filters, the project-membership filter, the density toggle, the contextual Create Goal action, and the Planning Settings control

#### Scenario: Mobile filter and settings controls show icons without text labels

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the Type/Group filters, the project-membership filter, the density toggle, the contextual Create Goal action, and the Planning Settings control render their icon only, without visible text labels, while each remains identifiable via its accessible name

#### Scenario: Controls remain reachable at the narrowest width

- **GIVEN** Goals is viewed at 360px wide with the mobile reorder toggle also shown
- **WHEN** the control rows render
- **THEN** every control is fully visible and operable, wrapping onto a further row if necessary
