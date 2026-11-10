# Spec Delta

## Purpose

Tells every visitor when the planner starts serving a new game catalog release, and gives players whose game has not updated yet a one-step way back to the release they play.

## ADDED Requirements

### Requirement: A new latest release is announced once per visitor

The app SHALL show a dismissible banner below the global header when the API's latest game version differs from the last latest version this device acknowledged. Signed-in and signed-out visitors SHALL both see it. A visitor seeing the app for the first time SHALL NOT see it; their current latest version is recorded silently. Dismissing it or acting on it SHALL record the version, so it returns only for the next release.

#### Scenario: First visit

- **WHEN** a visitor with no recorded version opens the app while `1.44.87.3088` is latest
- **THEN** no banner shows, and `1.44.87.3088` is recorded

#### Scenario: Dismissed until the next release

- **GIVEN** a visitor who dismissed the banner for `1.44.87.3088`
- **WHEN** they open the app again while `1.44.87.3088` is still latest, and later when `1.45.x` becomes latest
- **THEN** no banner shows the first time, and the banner for `1.45.x` shows the second time

### Requirement: The banner offers the matching switch

When the visitor is on `Latest`, the banner SHALL say the game data was updated to the new version and offer "Use <previous version>" for players whose game has not updated yet. When the visitor is on the previous release, it SHALL say the new version is available and offer "Use latest". Both actions SHALL change the selection exactly as the account menu picker does, and close the banner. Versions SHALL show as `major.minor.patch` (e.g. `1.44.87`).

#### Scenario: On Latest after an update

- **GIVEN** a player on `Latest` who last acknowledged `1.43.157.2989`, while the API serves `1.44.87.3088` and `1.43.157.2989`
- **WHEN** the app opens
- **THEN** the banner says the game data was updated to 1.44.87 and offers "Use 1.43.157"

#### Scenario: On the previous release

- **GIVEN** a player pinned to `1.43.157.2989` who last acknowledged `1.43.157.2989`
- **WHEN** the app opens while `1.44.87.3088` is latest
- **THEN** the banner says 1.44.87 is available and offers "Use latest"

#### Scenario: Acting on the banner

- **WHEN** the player on `Latest` activates "Use 1.43.157"
- **THEN** the selection becomes `1.43.157.2989` (downloading it first if needed), the banner closes, and it does not return for `1.44.87.3088`

### Requirement: The banner does not appear without the release list

When the list of served releases cannot be fetched, or only one release is served, the banner SHALL NOT show and nothing SHALL be recorded.

#### Scenario: Release list unavailable

- **WHEN** the versions request fails
- **THEN** no banner shows, and the recorded version is unchanged
