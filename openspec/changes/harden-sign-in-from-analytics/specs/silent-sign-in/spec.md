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
after at most 6 seconds. Browsers that keep the identity provider's cookies out
of hidden frames (Safari and every iOS browser, Firefox, Brave, Samsung
Internet) SHALL skip the hidden check, because it cannot find their session,
and go on to the quiet renewal described below. When the cached-token restore
fails because the identity provider could not be reached (no network, a failed
request, authority metadata that could not be fetched), the restore SHALL stop
there: no hidden check and no quiet renewal run, no renewal cooldown starts,
and the cached account stays, so the first API call tries the refresh token
again.

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

#### Scenario: Refresh token expired in a browser that blocks hidden frames

- **GIVEN** an email user on Safari, any iOS browser, Firefox, Brave or Samsung
  Internet whose refresh token has expired
- **WHEN** the application loads
- **THEN** no hidden check runs, and the quiet top-level renewal starts
  straight away

#### Scenario: Identity provider unreachable at load

- **GIVEN** a cached account and a device that cannot reach the identity
  provider
- **WHEN** the application loads and the cached-token restore fails with a
  network error
- **THEN** no hidden check or quiet renewal runs, no renewal cooldown starts,
  and the cached account is kept for the next token request

#### Scenario: Sign-out clears the account hint

- **WHEN** the user signs out
- **THEN** the account hint is removed from the device and a new tab shows
  the unauthenticated experience without attempting a restore

#### Scenario: No cached account present

- **WHEN** the application loads and no previously cached account exists on
  the device
- **THEN** the system does not attempt a silent session restore and shows
  the unauthenticated experience exactly as it does today
