## MODIFIED Requirements

### Requirement: Edit omits creation-only controls

It SHALL NOT show prerequisite suggestions, milestones, "Create paused" or "Create another goal".

#### Scenario: Creation-only controls absent

- **WHEN** the Edit goal dialog opens for a Rank goal
- **THEN** it shows no milestone, prerequisite, "Create paused" or "Create another goal" control

### Requirement: Each goal offers an Edit action that opens the Edit goal dialog

Wherever the Goals list renders (desktop table and mobile cards, with or without a project scope), each goal SHALL offer an Edit action that opens the Edit goal dialog for that goal. Activating the goal's name, its row, or its card SHALL NOT open any panel. The read-only goal detail (history, dependencies, blockers, estimate, farming guidance, progress, and its view/edit mode switch) SHALL NOT exist.

#### Scenario: Edit from the desktop table

- **GIVEN** the Goals list renders at or above 768px
- **WHEN** the user activates a row's Edit action
- **THEN** the Edit goal dialog opens for that goal

#### Scenario: Edit from a mobile card

- **GIVEN** the Goals list renders below 768px
- **WHEN** the user activates a card's Edit action
- **THEN** the Edit goal form opens for that goal in the bottom-anchored presentation

#### Scenario: Name or row does nothing

- **WHEN** the user activates a goal's name or clicks its row outside the row's controls
- **THEN** no dialog or panel opens

#### Scenario: Same action on Overview and Project Detail

- **WHEN** the user opens a project's detail route
- **THEN** its goals offer the same Edit action and dialog as Overview

### Requirement: Edit and create goal dialogs use the available space on desktop

On desktop (at or above 768px) the Edit goal dialog and the Create goal dialog SHALL be centered dialogs sized to the viewport (wide, up to a maximum width, with a maximum height that scrolls the body, never the header or the footer), laying their fields out in two columns at widths where two columns fit and one column otherwise. They SHALL be compact: dense label/field spacing and tight gaps and paddings, so that the Create form for a Rank or Ability character goal fits without scrolling at 1440x900 (ideally 1280x720) and the Edit form for a Rank goal fits at 1440x900. In the Create dialog the "Current status" section and the "Goal type" selector SHALL sit side by side in two columns (one column below the container breakpoint and on mobile). Neither dialog SHALL show explanatory helper paragraphs; supplementary hints SHALL be an accessible tooltip (`title` plus an accessible name) and validation and error messages SHALL stay visible. The header (title) and the footer SHALL stay visible while the body scrolls, and the footer SHALL end with the dismiss button (Close/Cancel, outline) followed by the primary button (Create goal/Save) as its rightmost button. Below 768px the presentation SHALL remain the existing bottom-anchored sheet with a single column.

#### Scenario: Wide desktop

- **GIVEN** a viewport of 1440x900
- **WHEN** either dialog opens for a goal kind with several fields
- **THEN** it renders centered with fields in two columns and needs no scrolling for a Rank goal's fields

#### Scenario: Short desktop viewport

- **GIVEN** a viewport of 1280x600
- **WHEN** a dialog's content is taller than the viewport
- **THEN** its body scrolls while its title and Save/Cancel remain visible

#### Scenario: Narrow desktop

- **GIVEN** a viewport just above 768px in which two columns do not fit
- **WHEN** either dialog opens
- **THEN** its fields render in a single column

#### Scenario: Mobile

- **GIVEN** a viewport below 768px
- **WHEN** either dialog opens
- **THEN** it is the bottom-anchored sheet with one column

#### Scenario: Compact Edit dialog

- **GIVEN** a viewport of 1440x900
- **WHEN** the Edit dialog opens for a Rank goal
- **THEN** target, priority, notes, projects and farming strategy fit without scrolling and no helper paragraph (projects description, activation note, priority hint, reached-target note) is visible

#### Scenario: Footer order

- **WHEN** either dialog is open on desktop
- **THEN** the dismiss button (outline) precedes the primary button, which is the rightmost
