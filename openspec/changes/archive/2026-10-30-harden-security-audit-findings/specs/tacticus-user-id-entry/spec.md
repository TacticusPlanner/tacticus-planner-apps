## ADDED Requirements

### Requirement: A Tacticus user id is checked as a GUID before it is saved

Every form that saves the Tacticus user id (account setup, the Account settings integration tab and the guild prerequisite card) SHALL accept only a GUID, ignoring surrounding whitespace, in the hyphenated, bare 32-digit, braced or parenthesized form. While the field holds a non-empty value that is not a GUID, the form SHALL show a translated message under the user-id field and SHALL NOT send the request. An empty field keeps each form's existing meaning (leave unchanged, or nothing to save).

#### Scenario: A non-GUID id is not sent

- **WHEN** the user types `player-123` into the user-id field
- **THEN** a translated "enter it as a GUID" message shows under the field
- **AND** the save action is disabled and no request is sent

#### Scenario: A GUID with surrounding spaces is saved trimmed

- **WHEN** the user enters `3f2504e0-4f89-11d3-9a0c-0305e82c3301` with a leading and a trailing space, and saves
- **THEN** the request carries `3f2504e0-4f89-11d3-9a0c-0305e82c3301`

### Requirement: The API's user-id refusals show under the user-id field

A failed save SHALL show a 409 `tacticusUserIdInUse` as a translated "already linked to another planner account" message, and a 400 whose `errors` name the user id as the translated GUID message, both under the user-id field. Any other failure keeps the form-level message.

#### Scenario: The id is already claimed

- **WHEN** saving returns 409 `tacticusUserIdInUse`
- **THEN** the user-id field shows the translated "already linked" message and the form-level error stays empty
- **AND** the typed values stay in the form
