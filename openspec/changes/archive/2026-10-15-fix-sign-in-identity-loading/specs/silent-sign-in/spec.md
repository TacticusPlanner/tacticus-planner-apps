## MODIFIED Requirements

### Requirement: Automatic silent restore attempt on app load

When the application loads and a previously cached account exists on the
device, the system SHALL attempt to restore that session automatically,
without requiring the user to interact with a sign-in control first. The
attempt SHALL start before the application's first API request. It SHALL
first restore from the device's cached tokens (a valid access token, or a
refresh token exchanged directly with the identity provider) and SHALL only
fall back to a hidden identity-provider session check when no cached token is
usable. A hidden session check SHALL give up after at most 6 seconds.

#### Scenario: Cached account present

- **WHEN** the application loads and a previously cached account exists on
  the device
- **THEN** the system attempts a silent session restore automatically

#### Scenario: Cached tokens still usable

- **GIVEN** a cached account whose access token or refresh token is still
  valid
- **WHEN** the application loads
- **THEN** the session is restored from those tokens and no hidden
  identity-provider session check runs

#### Scenario: Refresh token expired

- **GIVEN** a cached account whose refresh token has expired (for example the
  user last signed in more than 24 hours ago)
- **WHEN** the application loads
- **THEN** exactly one hidden identity-provider session check runs, and it
  gives up after at most 6 seconds if it cannot complete

#### Scenario: No cached account present

- **WHEN** the application loads and no previously cached account exists on
  the device
- **THEN** the system does not attempt a silent session restore and shows
  the unauthenticated experience exactly as it does today

## ADDED Requirements

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
