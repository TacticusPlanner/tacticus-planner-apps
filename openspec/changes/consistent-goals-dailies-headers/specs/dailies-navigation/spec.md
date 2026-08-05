## ADDED Requirements

### Requirement: Raids tabs and project selector share one row

The Raids sub-tab bar (Today, Raids Plan) and the project selector SHALL render in the same row — the sub-tabs leading (left-aligned), the project selector trailing (right-aligned) — rather than in two stacked rows.

#### Scenario: Tabs and selector appear in one row

- **WHEN** the user opens the Raids tab (Today or Raids Plan)
- **THEN** the Today/Raids Plan sub-tabs and the project selector are both visible in the same row

### Requirement: Project selector compresses on mobile

Below the 768px mobile breakpoint, the project selector in the Raids tab bar row SHALL render as an icon-only trigger, retaining an accessible name for the full label. The Today/Raids Plan sub-tab labels SHALL continue to show their text at every breakpoint.

#### Scenario: Mobile project selector shows an icon without a text label

- **WHEN** the Raids tab bar is viewed below the 768px breakpoint
- **THEN** the project selector renders its icon only, without a visible text label, while remaining identifiable via its accessible name

#### Scenario: Sub-tab labels remain text on mobile

- **WHEN** the Raids tab bar is viewed below the 768px breakpoint
- **THEN** the Today and Raids Plan sub-tab labels are still shown as text
