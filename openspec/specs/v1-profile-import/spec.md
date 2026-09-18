# v1-profile-import Specification

## Purpose

TBD - created by archiving change rewrite-v1-goal-import. Update Purpose after archive.

## Requirements

### Requirement: The dialog does not create goals itself

The import operation SHALL create the imported goals. The dialog SHALL NOT
submit goal-creation requests, and SHALL NOT compute any part of a goal's
initial state. After the operation returns, the dialog SHALL refresh the goal
and project views so the newly created goals are visible.

#### Scenario: No goal-creation request is issued

- **GIVEN** the goals part is selected
- **WHEN** an import completes
- **THEN** the dialog issues no goal-creation request of its own

#### Scenario: Goal views refresh after an import

- **GIVEN** the goals part was imported and created goals
- **WHEN** the user closes the dialog and views their goals
- **THEN** the newly created goals are shown without a manual reload

### Requirement: Goal outcomes are reported in four buckets

The result SHALL group per-goal outcomes into four buckets, each with a count:

- **imported** — goals created, reporting the number of goals and the number of
  units as two distinct values;
- **needed no import** — outcomes whose reason is that the target was already
  reached, a matching goal already existed, or the goal was merged into
  another;
- **not imported** — outcomes whose reason is an unknown unit, an unsupported
  V1 goal type, an untranslatable target, or a missing target;
- **failed** — outcomes for goals that could not be created.

The needed-no-import bucket SHALL be collapsed by default and expandable. The
not-imported and failed buckets SHALL be expanded when non-empty. A bucket with
no outcomes SHALL NOT be shown.

#### Scenario: Imported reports goals and units separately

- **GIVEN** an import created five goals across four units
- **WHEN** the result is shown
- **THEN** it reports five goals and four units as distinct values, and does not present a
  single ambiguous "created" number

#### Scenario: Benign outcomes are collapsed

- **GIVEN** an import in which several goals needed no import and none failed
- **WHEN** the result is shown
- **THEN** the needed-no-import bucket shows a count and is collapsed, and can be expanded to
  list its goals

#### Scenario: Attention-needing outcomes are expanded

- **GIVEN** an import in which one goal's unit was unknown to the catalog
- **WHEN** the result is shown
- **THEN** the not-imported bucket is shown expanded

#### Scenario: Empty buckets are omitted

- **GIVEN** an import in which every goal was created
- **WHEN** the result is shown
- **THEN** only the imported bucket is shown

### Requirement: A not-imported or failed outcome names what it concerned

Each outcome listed in the not-imported or failed bucket SHALL show the unit it
concerned, the goal type when one was determined, and a reason in the user's
language. For an unknown unit the outcome SHALL show the unit identifier as it
appeared in the V1 profile, because that is the value that failed to match.

#### Scenario: Unknown unit shows the V1 identifier

- **GIVEN** an outcome reporting that a goal's unit is not in the game catalog
- **WHEN** it is listed
- **THEN** it shows the unit identifier as it appeared in the V1 profile

#### Scenario: A failed goal shows its reason

- **GIVEN** an outcome reporting that a goal could not be created
- **WHEN** it is listed
- **THEN** it shows the unit, the goal type, and the reason the creation was refused

### Requirement: Automatically added prerequisites are reported as such

An outcome for a goal the import added on the user's behalf SHALL be presented
in the imported bucket, identified as automatically added, and SHALL name the
goal it was added for.

#### Scenario: A synthesized Unlock goal is identified

- **GIVEN** an import that added an Unlock goal so an imported Rank goal could proceed
- **WHEN** the result is shown
- **THEN** the Unlock goal appears as imported, marked as automatically added, and names the
  Rank goal it was added for

### Requirement: Outcome codes and statuses have translated copy

Every outcome code and every outcome status the import can return SHALL have
user-facing copy in every supported locale. No outcome SHALL render a raw
machine-readable code or untranslated server text to the user.

#### Scenario: No raw codes are displayed

- **GIVEN** a result containing outcomes across all four buckets
- **WHEN** it is rendered in any supported locale
- **THEN** no machine-readable code string appears in the output

### Requirement: The result offers a copyable diagnostic

The result SHALL offer an action that places the not-imported and failed
outcomes on the clipboard as plain text, including for each the unit, the goal
type, the reason, and a server trace identifier where the failure carried one.
The user SHALL NOT have to read a trace identifier out of browser developer
tools to report a failure.

#### Scenario: Copying yields the attention-needing detail

- **GIVEN** a result with a non-empty not-imported or failed bucket
- **WHEN** the user invokes the copy action
- **THEN** the clipboard holds plain text listing each such outcome's unit, goal type and
  reason

#### Scenario: No copy action without anything to report

- **GIVEN** a result whose not-imported and failed buckets are both empty
- **WHEN** the result is shown
- **THEN** no copy action is offered

### Requirement: Each part's outcome shows its reason, not only its status

A part's reported outcome SHALL include the reason for that outcome when the
import supplied one. A part that succeeded but did not import everything it
covers SHALL show that qualification alongside its success.

#### Scenario: A partial success is qualified

- **GIVEN** a part that imported successfully but could not carry across some of its data
- **WHEN** the result is shown
- **THEN** that part shows both its success and the qualification describing what was not
  imported

#### Scenario: A skipped part explains why

- **GIVEN** a selected part the V1 profile had no data for
- **WHEN** the result is shown
- **THEN** that part's outcome states that the V1 profile held no such data

### Requirement: The goals part status reflects what the import did

The goals part's reported status SHALL be derived from the goal outcomes. It
SHALL NOT report success when no goal was created.

#### Scenario: No goals created is not reported as success

- **GIVEN** an import in which every goal outcome was not-imported or failed
- **WHEN** the result is shown
- **THEN** the goals part does not report success

### Requirement: A refused goals import explains the remedy

When the import refuses the goals part because the account has no synced player
data, the dialog SHALL present that as a blocking explanation naming the
remedy — sync player data, then import goals again — rather than as a failure
or a generic skip.

#### Scenario: Sync-required is explained, not reported as an error

- **GIVEN** an account with no synced player data
- **WHEN** the goals part is imported
- **THEN** the result explains that player data must be synced first and that goals can then be
  imported again

### Requirement: The part selection offers automatic prerequisite creation

The part selection SHALL include an option to add missing prerequisite goals,
selected by default. Clearing it SHALL import only the goals present in the V1
profile.

#### Scenario: The option is on by default

- **WHEN** the dialog is opened
- **THEN** the add-missing-prerequisites option is selected

#### Scenario: Clearing the option is honoured

- **GIVEN** the user clears the add-missing-prerequisites option
- **WHEN** the import runs
- **THEN** no automatically added prerequisite outcome is reported

### Requirement: The dialog describes what the import actually does

The dialog's description SHALL state the import's actual behavior. It SHALL NOT
state that matching V2 goals are replaced, and SHALL NOT state, unconditionally,
that imported goals are paused or that none are — a goal lands Paused only when
the import's default project isn't the profile's active project.

#### Scenario: The description matches the behavior

- **WHEN** the dialog is opened
- **THEN** its description does not claim that matching goals are replaced, and
  states that imported goals are paused unless they land in the active project

### Requirement: An unselected part occupies no row in the result

A part the user did not select SHALL NOT occupy a row in the result. The result
SHALL list only the parts the import was asked to process, so a cleared part
cannot be mistaken for one that was attempted and skipped.

#### Scenario: A cleared part has no row

- **GIVEN** the user cleared the guild token part
- **WHEN** the import completes
- **THEN** no row for the guild token part appears in the result

#### Scenario: Selected parts each keep a row

- **GIVEN** the user selected the personal API key part and the goals part
- **WHEN** the import completes
- **THEN** the result has a row for each of those two parts

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
