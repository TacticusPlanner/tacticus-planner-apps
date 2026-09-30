## ADDED Requirements

### Requirement: Activating a card opens that project on Goals

Activating a project card SHALL navigate to the Goals page scoped to that project, `/plan/goals?project={id}`.

#### Scenario: Card opens the scoped Goals page

- **WHEN** the user activates a project card in the widget
- **THEN** `/plan/goals?project={id}` opens with that project's scope chip selected

## REMOVED Requirements

### Requirement: Activating a card navigates to that project's detail route

**Reason**: The project detail route no longer exists.
**Migration**: "Activating a card opens that project on Goals" above.
