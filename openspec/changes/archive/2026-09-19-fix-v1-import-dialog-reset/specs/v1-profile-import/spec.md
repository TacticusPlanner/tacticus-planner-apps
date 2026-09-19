## Purpose

Covers the account-level dialog that imports selected parts of a V1 planner
profile: entering V1 credentials, choosing which parts to import, submitting
and re-submitting, and how the outcome of each part is reported back.

## ADDED Requirements

### Requirement: The import dialog takes V1 credentials and a part selection

The dialog SHALL accept a V1 username and password and SHALL let the user
choose which parts of the V1 profile to import. V1 credentials SHALL be used
for the import only and SHALL NOT be retained after the dialog closes.

#### Scenario: Reopening the dialog presents empty credentials

- **GIVEN** the user submitted an import and closed the dialog
- **WHEN** the dialog is reopened
- **THEN** the password field is empty

#### Scenario: No part selected prevents submission

- **WHEN** the user clears every part from the selection
- **THEN** the dialog's submit control is unavailable

### Requirement: Submitting is never a silent no-op

The dialog's submit control SHALL be unavailable whenever submitting would not
start an import. Every condition that prevents an import from starting SHALL be
reflected in the control's availability. Activating the submit control SHALL
either start an import or be impossible; it SHALL NOT complete without
starting an import, without a progress indication, and without a message.

#### Scenario: Missing password makes the control unavailable

- **GIVEN** the username is filled, at least one part is selected, and the password is empty
- **WHEN** the dialog is rendered
- **THEN** the submit control is unavailable

#### Scenario: Missing username makes the control unavailable

- **GIVEN** the password is filled, at least one part is selected, and the username is empty
- **WHEN** the dialog is rendered
- **THEN** the submit control is unavailable

#### Scenario: Whitespace-only username does not count as filled

- **GIVEN** the username contains only whitespace and the password is filled
- **WHEN** the dialog is rendered
- **THEN** the submit control is unavailable

### Requirement: A completed import clears the password and says so

After an import run completes, the dialog SHALL clear the password and SHALL
indicate that the run finished and that re-running requires entering the
password again. The submit control SHALL be unavailable until the password is
entered again.

#### Scenario: Completed run explains why submission is unavailable

- **GIVEN** an import run has completed and its result is shown
- **WHEN** the user looks at the dialog
- **THEN** the submit control is unavailable and the dialog states that the password must be
  entered again to run another import

#### Scenario: Re-entering the password restores submission

- **GIVEN** an import run has completed and the password was cleared
- **WHEN** the user enters the password again
- **THEN** the submit control becomes available

#### Scenario: A second run replaces the previous result

- **GIVEN** an import run has completed and its result is shown
- **WHEN** the user re-enters the password and submits again
- **THEN** the dialog indicates progress and then shows the new run's result in place of the
  previous one

### Requirement: A failed import leaves the dialog usable

When an import fails, the dialog SHALL show the failure and SHALL remain
usable: no progress indication persists, the entered username is preserved, and
the dialog does not close on its own.

#### Scenario: Failure keeps the username and stops the progress indication

- **GIVEN** the user submits credentials and the import fails
- **WHEN** the failure is shown
- **THEN** no progress indication remains, the username is still filled, and the dialog is still
  open

#### Scenario: Correcting the password allows a retry

- **GIVEN** an import failed because the credentials were rejected
- **WHEN** the user enters a different password
- **THEN** the submit control is available and submitting starts a new import

### Requirement: Each selected part's outcome is reported

The dialog SHALL report an outcome for every part the user selected. A part
that was not selected SHALL NOT be reported as an import outcome.

#### Scenario: Unselected parts are absent from the report

- **GIVEN** the user selected only the personal API key part
- **WHEN** the import completes
- **THEN** the result reports the personal API key part and does not report an outcome for the
  parts that were not selected
