## Purpose

Lets a user who was previously signed in on a device resume their session
automatically, without a manual "Sign in" click, whenever the identity
provider still has a live session for them.

## ADDED Requirements

### Requirement: Automatic silent restore attempt on app load

When the application loads and a previously cached account exists on the
device, the system SHALL attempt to restore that session automatically,
without requiring the user to interact with a sign-in control first.

#### Scenario: Cached account present

- **WHEN** the application loads and a previously cached account exists on
  the device
- **THEN** the system attempts a silent session restore automatically

#### Scenario: No cached account present

- **WHEN** the application loads and no previously cached account exists on
  the device
- **THEN** the system does not attempt a silent session restore and shows
  the unauthenticated experience exactly as it does today

### Requirement: Successful restore requires no further user action

When the automatic silent restore succeeds, the user SHALL be taken directly
into the authenticated experience with no additional click or prompt.

#### Scenario: Silent restore succeeds

- **WHEN** an automatic silent restore attempt succeeds
- **THEN** the user is signed in and lands on the authenticated experience
  without clicking a sign-in control

### Requirement: Failed restore falls back to manual sign-in without error

When the automatic silent restore does not succeed — whether because the
identity provider has no active session for the account, or the attempt
cannot complete (e.g. it is blocked by the browser) — the system SHALL fall
back to the existing manual sign-in experience and SHALL NOT surface an
error to the user for this background attempt.

#### Scenario: Identity provider has no active session

- **WHEN** an automatic silent restore attempt is rejected because the
  identity provider has no active session for the cached account
- **THEN** the unauthenticated experience is shown with its normal sign-in
  control, and no error is displayed to the user

#### Scenario: Restore attempt cannot complete

- **WHEN** an automatic silent restore attempt cannot complete (for example,
  the browser blocks the mechanism used to check for a live session)
- **THEN** the unauthenticated experience is shown with its normal sign-in
  control, and no error is displayed to the user

### Requirement: Sign-in controls reflect an in-progress restore attempt

Every sign-in control in the application (desktop and mobile) SHALL reflect
a single, shared in-progress state while an automatic silent restore attempt
is underway, rather than each control tracking its own independent attempt.

#### Scenario: Restore attempt in progress

- **WHEN** an automatic silent restore attempt is in progress
- **THEN** every sign-in control visible to the user indicates that a
  previously used account was detected and that sign-in is being attempted
  automatically

#### Scenario: No restore attempt in progress

- **WHEN** no automatic silent restore attempt is in progress (none was
  needed, or a prior attempt has already finished)
- **THEN** sign-in controls show their normal, unmodified label and behavior

### Requirement: Manual sign-in remains available during an in-progress restore attempt

A user SHALL be able to trigger manual sign-in at any time, including while
an automatic silent restore attempt is still in progress, without waiting
for that attempt to finish.

#### Scenario: User signs in manually while a restore attempt is in progress

- **WHEN** the user activates a sign-in control while an automatic silent
  restore attempt is still in progress
- **THEN** the system proceeds with the manual sign-in flow immediately,
  without waiting for the in-progress attempt to finish
