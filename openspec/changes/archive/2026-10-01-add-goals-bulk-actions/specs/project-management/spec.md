## MODIFIED Requirements

### Requirement: No bulk pause/resume on Projects

No surface SHALL provide a control that pauses or resumes every goal in a project at once by virtue of its membership — not the Projects page, its row menus, nor the Goals page scoped to a project. Pausing or resuming SHALL be available only per goal from that goal's own row menu, or over an explicit selection of goals the user has checked (`goal-bulk-actions`); a project scope on the Goals page narrows what can be selected but never acts on the project as a whole.

#### Scenario: No project-wide pause/resume control is present

- **WHEN** the user opens the Projects page, any project row's overflow menu, or the Goals page scoped to a project
- **THEN** no "Pause all" or "Resume all" control is rendered

#### Scenario: Selection-based bulk pause is allowed inside a scope

- **GIVEN** the Goals page is scoped to project B and the user has selected three of its goals
- **WHEN** the user activates the bulk Pause action
- **THEN** exactly those three goals are paused, and the project's other goals are untouched
