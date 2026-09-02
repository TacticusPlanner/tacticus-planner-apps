## Purpose

Ensures users can repeatedly create combined goals from the creation sheet
without stale submission feedback blocking a subsequent attempt.

## ADDED Requirements

### Requirement: Goal creation is ready for a subsequent use after success

The system SHALL return the goal-creation sheet to a non-submitting state when
a successful normal goal creation closes the sheet. A subsequent opening of the
same sheet instance MUST present the submit action according to the form's
current validation state, rather than treating the earlier request as active.

#### Scenario: Reopen after a successful normal creation

- **WHEN** a user submits a valid goal with "Create another" disabled, the
  creation succeeds, and the user opens the goal-creation sheet again
- **THEN** the sheet shows no submission progress indicator and its submit
  action is not disabled because of the preceding submission

### Requirement: Create-another success remains immediately usable

The system SHALL retain the existing create-another flow: after a successful
creation with "Create another" enabled, the sheet remains open with a reset
form and an idle submission state so the user can create another goal.

#### Scenario: Create another after success

- **WHEN** a user submits a valid goal with "Create another" enabled and the
  creation succeeds
- **THEN** the sheet stays open, the form is reset, and the submit action is
  no longer shown as submitting
