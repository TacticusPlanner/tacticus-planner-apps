# Spec Delta

## MODIFIED Requirements

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
  user last signed in more than 24 hours ago)
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
