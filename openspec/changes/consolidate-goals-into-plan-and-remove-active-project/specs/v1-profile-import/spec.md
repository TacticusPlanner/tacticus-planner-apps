## MODIFIED Requirements

### Requirement: The dialog describes what the import actually does

The dialog's description SHALL state the import's actual behavior. It SHALL NOT
state that matching V2 goals are replaced, and SHALL NOT state, unconditionally,
that imported goals are paused or that none are, and SHALL NOT refer to an
active project or Current plan.

#### Scenario: The description matches the behavior

- **WHEN** the dialog is opened
- **THEN** its description does not claim that matching goals are replaced, does
  not refer to an active project or Current plan, and states the status
  imported goals receive as the import actually assigns it
