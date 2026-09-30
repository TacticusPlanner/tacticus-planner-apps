## REMOVED Requirements

### Requirement: Goals controls share one row on desktop

**Reason**: The Goals page gains a persistent bulk-actions row (Azure-style: Create first, then the selection actions), which does not fit beside the filters in one row at common desktop widths. Replaced by an explicit two-row layout.
**Migration**: See "Goals controls form an actions row and a filters row on desktop". Tests asserting a single control row assert the two rows and their order instead.

## ADDED Requirements

### Requirement: Goals controls form an actions row and a filters row on desktop

At or above the 768px desktop breakpoint, Goals SHALL render, directly beneath the project scope chip row, first an actions row and then a filters row, and no other row of controls. The actions row SHALL contain, in order from the left: the contextual Create Goal action, then the bulk actions Pause, Resume, Add to project and Delete (`goal-bulk-actions`: disabled with an empty selection, labelled with the selected count otherwise), and at the far right the Planning Settings control. The filters row SHALL contain, in order: the status filter, the Type and Group filters, and the order info affordance. The bulk actions SHALL remain present, disabled, when nothing is selected rather than appearing only on selection, so the row does not change shape as the selection changes. Neither row SHALL wrap at or above 1024px with every control present.

#### Scenario: Desktop Goals renders two control rows

- **WHEN** Goals is viewed at or above the 768px breakpoint
- **THEN** an actions row holding Create Goal, Pause, Resume, Add to project, Delete and Planning Settings appears immediately below the scope chip row, a filters row holding the status filter, Type/Group filters and order info affordance appears immediately below it, and no further control row renders

#### Scenario: The actions row keeps its shape with nothing selected

- **GIVEN** no goal is selected
- **WHEN** the actions row renders
- **THEN** Pause, Resume, Add to project and Delete are present and disabled, occupying the same positions they occupy with a selection

## MODIFIED Requirements

### Requirement: Goals controls compress on mobile

Below the 768px mobile breakpoint, Goals SHALL render the project scope chip row first, then keep the status filter (with its reached-indicator) in its own row. The Type/Group filters, the reorder-mode toggle (shown only when reordering is available), the select-mode toggle (`goal-bulk-actions`, shown whenever at least one row is visible), the order info affordance, the contextual Create Goal action, and the Planning Settings control SHALL render as icon-only triggers in a third row, each retaining an accessible name for its full label. The bulk actions themselves SHALL NOT render in this row; they live in the select-mode bottom bar. When the controls do not fit one line (for example at 360px, and with the density control from `add-goals-overview-density-option`), the row SHALL wrap onto a further line rather than clip, scroll horizontally, or hide a control.

#### Scenario: Mobile Overview keeps the status filter on its own row

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the scope chip row renders first, the status filter renders in its own row beneath it, and the Type/Group filters, reorder and select toggles, order info affordance, contextual Create Goal action, and Planning Settings control render in a row beneath that

#### Scenario: Mobile filter and settings controls show icons without text labels

- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the Type/Group filters, the select-mode toggle, the contextual Create Goal action, and the Planning Settings control render their icon only, without visible text labels, while each remains identifiable via its accessible name

#### Scenario: The mobile reorder toggle is a control-row icon

- **GIVEN** at least two Active or Paused goals are visible and the status filter allows reordering
- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** an icon-only reorder-mode toggle with an accessible name appears in the same control row, and it is absent when reordering is unavailable

#### Scenario: A crowded mobile control row wraps

- **WHEN** Goals is viewed at 360px with every control present
- **THEN** the controls wrap onto a further line and none is clipped, hidden, or reachable only by horizontal scrolling
