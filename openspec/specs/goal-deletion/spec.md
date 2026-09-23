# goal-deletion Specification

## Purpose

Defines how deleting a goal behaves from the user's perspective — how
quickly the goal disappears, what happens if the deletion fails, and what
feedback the user sees — independently of the pause/resume/archive
lifecycle actions `goal-status-actions` covers.

## Requirements

### Requirement: Deleting a goal removes it immediately, without waiting for the network

Confirming a goal's deletion SHALL remove that goal from every list and
view where it currently appears immediately, without waiting for the
delete request to complete. The removal SHALL NOT be gated on that
request's response.

#### Scenario: The goal row disappears on confirmation

- **GIVEN** a goal is visible in a goal list
- **WHEN** the user confirms deleting it
- **THEN** the goal's row disappears from that list immediately, before the
  underlying delete request has resolved

#### Scenario: The goal disappears everywhere it was cached

- **GIVEN** a goal is visible in both Goals Overview and a project's detail
  route at the same time
- **WHEN** the user confirms deleting it from either view
- **THEN** it disappears from both immediately

### Requirement: A failed deletion restores the goal and reports the failure

If the underlying delete request fails, the system SHALL restore the goal
to every list it was removed from and SHALL report the failure to the
user. The user SHALL be able to retry the deletion after a restore.

#### Scenario: A failed delete brings the goal back

- **GIVEN** a goal was optimistically removed and its delete request then
  fails
- **WHEN** the failure is received
- **THEN** the goal reappears in the lists it was removed from, and an
  error is shown to the user

### Requirement: A successful deletion shows no success toast

The system SHALL NOT show a success toast or other blocking confirmation
UI when a deletion succeeds. The goal's immediate removal from its lists
is sufficient confirmation.

#### Scenario: No toast appears after a successful delete

- **WHEN** the user confirms deleting a goal and the request succeeds
- **THEN** no success toast is shown

#### Scenario: A subsequent action is not obstructed

- **GIVEN** the user deletes a goal and then immediately acts on another
  goal's row
- **WHEN** they do so
- **THEN** no leftover confirmation or success UI from the prior deletion
  obstructs that action
