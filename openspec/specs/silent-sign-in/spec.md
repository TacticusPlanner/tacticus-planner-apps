# silent-sign-in Specification

## Purpose

Lets a user who was previously signed in on a device resume their session
automatically, without a manual "Sign in" click, whenever the identity
provider still has a live session for them.

## Requirements

### Requirement: Automatic silent restore attempt on app load

When the application loads and a previously cached account exists on the
device, the system SHALL attempt to restore that session automatically,
without requiring the user to interact with a sign-in control first. The
attempt SHALL start before the application's first API request. It SHALL
first restore from the current tab's cached tokens (a valid access token, or a
refresh token exchanged directly with the identity provider) and SHALL only
fall back to a hidden identity-provider session check when no cached token is
usable. Cached tokens are scoped to the browser tab; a non-secret account hint
(the account identifier only, never a token) persists on the device so a new
tab or a restarted browser still counts as "a previously cached account
exists". A hidden session check SHALL give up after at most 6 seconds.

#### Scenario: Cached account present

- **WHEN** the application loads and a previously cached account exists on
  the device
- **THEN** the system attempts a silent session restore automatically

#### Scenario: Cached tokens still usable

- **GIVEN** a cached account whose access token or refresh token is still
  valid in the current tab
- **WHEN** the application loads
- **THEN** the session is restored from those tokens and no hidden
  identity-provider session check runs

#### Scenario: Refresh token expired

- **GIVEN** a cached account whose refresh token has expired (for example the
  user last signed in more than 24 hours ago) and whose tab holds no valid
  access token
- **WHEN** the application loads
- **THEN** exactly one hidden identity-provider session check runs, and it
  gives up after at most 6 seconds if it cannot complete

#### Scenario: New tab with an account hint

- **GIVEN** the user signed in earlier in another tab, so the device holds an
  account hint but this tab holds no tokens
- **WHEN** the application loads in the new tab
- **THEN** exactly one hidden identity-provider session check runs using the
  account hint, and on success the user is signed in without interaction

#### Scenario: Sign-out clears the account hint

- **WHEN** the user signs out
- **THEN** the account hint is removed from the device and a new tab shows
  the unauthenticated experience without attempting a restore

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

### Requirement: API token requests coordinate with the restore attempt

An API token request made while the app-load restore attempt is in progress
SHALL wait for that attempt instead of starting its own hidden session check.
Once the restore attempt has failed, API token requests in the same page load
SHALL NOT run another hidden session check; they SHALL fail at once as
requiring interaction, so the caller can start interactive re-authentication
immediately. A refresh token the identity provider rejects SHALL be treated
as requiring interaction.

#### Scenario: First API call during the restore

- **WHEN** the current-user request needs a token while the restore attempt
  is still running
- **THEN** it waits for the restore and then uses the restored tokens, and
  only one hidden session check runs for the page load

#### Scenario: Restore failed

- **GIVEN** the restore attempt failed because the session cannot be renewed
  silently
- **WHEN** the current-user request needs a token
- **THEN** the request fails as interaction-required without a second hidden
  session check, and re-authentication starts without further waiting
