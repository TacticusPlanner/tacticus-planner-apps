# Spec Delta

## MODIFIED Requirements

### Requirement: Automatic silent restore attempt on app load

When the application loads and a previously cached account exists on the
device, the system SHALL attempt to restore that session automatically,
without requiring the user to interact with a sign-in control first. The
attempt SHALL start before the application's first API request. It SHALL
first restore from the device's cached tokens (a valid access token, or a
refresh token exchanged directly with the identity provider) and SHALL only
fall back to a hidden identity-provider session check when no cached token is
usable. A non-secret account hint (the account identifier only, never a
token) also persists on the device, so a cleared token cache still counts as
"a previously cached account exists". A hidden session check SHALL give up
after at most 6 seconds.

#### Scenario: Cached account present

- **WHEN** the application loads and a previously cached account exists on
  the device
- **THEN** the system attempts a silent session restore automatically

#### Scenario: Cached tokens still usable

- **GIVEN** a cached account whose access token or refresh token is still
  valid on the device
- **WHEN** the application loads, in any tab or after a relaunch
- **THEN** the session is restored from those tokens and no hidden
  identity-provider session check runs

#### Scenario: Refresh token expired

- **GIVEN** a cached account whose refresh token has expired (for example the
  user last signed in more than 24 hours ago) and no valid access token on the
  device
- **WHEN** the application loads
- **THEN** exactly one hidden identity-provider session check runs, and it
  gives up after at most 6 seconds if it cannot complete
