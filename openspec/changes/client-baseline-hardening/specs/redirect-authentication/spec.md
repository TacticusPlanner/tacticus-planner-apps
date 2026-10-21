# Spec Delta

## ADDED Requirements

### Requirement: At most one interactive redirect starts per page load

When one or more callers (an API request, the player-data sync, a sign-in control) determine that interaction is required at about the same time, the system SHALL start exactly one interactive redirect. Later callers in the same page load SHALL join the in-flight redirect instead of starting another, so the identity provider is never entered twice and the return destination is the one recorded by the first caller.

#### Scenario: API request and background sync both require interaction

- **WHEN** the current-user request and the scheduled player-data sync both fail as interaction-required within the same second
- **THEN** one interactive redirect starts, the second caller does not start another, and after completion the user returns to the page they were on

#### Scenario: Redirect already in flight

- **GIVEN** an interactive redirect has been started and the page has not yet left
- **WHEN** another caller requests interactive sign-in
- **THEN** no second redirect is started

### Requirement: Token cache is tab-scoped

Identity-provider tokens SHALL be stored in tab-scoped session storage, not in storage shared across tabs or persisted after the browser closes. Only the non-secret account hint described in `silent-sign-in` SHALL persist on the device.

#### Scenario: Inspecting device storage after sign-in

- **WHEN** a user has signed in
- **THEN** no access token, refresh token or id token is present in long-lived site storage

#### Scenario: Browser restart

- **WHEN** the user closes the browser and reopens the app
- **THEN** no token is read from storage, and sign-in proceeds through the silent restore path of `silent-sign-in`
