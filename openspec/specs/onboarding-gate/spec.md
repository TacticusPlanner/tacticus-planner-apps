# onboarding-gate Specification

## Purpose

Defines how the gate in front of protected routes behaves while it waits for, and when it cannot get, the current user's account status, so that a short API outage or an expired token never presents signing out as the way forward.

## Requirements

### Requirement: Transient account-status failures retry before an error is shown

While resolving the current user's account status for a protected route, the gate SHALL treat a network failure, a server error (HTTP 5xx) or a rate-limit response (HTTP 429) as transient and SHALL retry the request automatically, at least three times with increasing delay, while continuing to show its loading state. Only after the retries are exhausted SHALL the gate show its error card. A client error other than 429 (HTTP 4xx) SHALL NOT be retried.

#### Scenario: API briefly unavailable during a rollout

- **GIVEN** a signed-in user opens `/home` while the API is restarting and the first account-status request fails with a network error
- **WHEN** the API becomes available within the retry window
- **THEN** a retry succeeds, the gate shows no error, and the page renders

#### Scenario: Retries exhausted

- **GIVEN** every automatic retry of the account-status request fails with a server error
- **WHEN** the last retry fails
- **THEN** the gate shows its error card with a Retry action

#### Scenario: Client error is not retried

- **GIVEN** the account-status request fails with HTTP 403
- **WHEN** the gate evaluates the failure
- **THEN** it shows the error card without further automatic retries

### Requirement: An expired or revoked session re-authenticates instead of erroring

When the account-status request fails because the user's session needs interaction (the identity provider requires sign-in again, the refresh token was rejected, or a silent token request timed out), the gate SHALL start the app's in-app re-authentication flow that returns the user to the same page, and SHALL NOT show the error card for that failure. Such failures SHALL NOT be retried. While the flow is starting the gate SHALL say that the user is being taken to sign in.

#### Scenario: Token refresh requires sign-in

- **GIVEN** a user's tab has been open long enough that their session can no longer be renewed silently
- **WHEN** they navigate to a protected route and the account-status request reports that interaction is required
- **THEN** the app redirects them to sign in and, on return, lands them on the route they were opening, still signed in, without an error card in between

#### Scenario: Returning after the refresh token expired

- **GIVEN** a user returns more than 24 hours after signing in and the app-load silent restore has already failed
- **WHEN** the gate requests their account status
- **THEN** the request fails as interaction-required without another silent wait, and the gate shows "taking you to sign in" while the redirect starts

### Requirement: The error card prioritises recovery over signing out

The gate's error card SHALL present Retry as its primary action and SHALL describe the failure as a problem reaching the service, not as a problem with the user's account or sign-in. Sign out SHALL remain available as a secondary action.

#### Scenario: Error card actions

- **WHEN** the error card is shown
- **THEN** Retry is the primary, first-focused action, Sign out is visually secondary, and the copy says the account status could not be checked right now

### Requirement: The gate's loading state is labelled and reports slowness

While the gate waits for the account status it SHALL show the boot screen with a visible "Loading your account" message, exposed as a status to assistive technology. If it is still waiting after 5 seconds (and is not starting re-authentication), it SHALL add a note that loading is taking longer than usual and that refreshing or signing in again will not speed it up.

#### Scenario: Normal load

- **WHEN** the account status is loading
- **THEN** the gate shows the boot screen with "Loading your account" and no slow note

#### Scenario: Slow load

- **WHEN** the account status is still loading 5 seconds later
- **THEN** the gate also shows the "taking longer than usual" note

### Requirement: An account that finished setup on this device does not wait for the account check

When the account status answers that setup is complete, the client SHALL remember the signed-in account's identity-provider account id on the device, and nothing else about the account. While a later account check for that same account is loading, the gate SHALL render protected content instead of waiting. The check SHALL still run: if it answers that setup is incomplete the gate SHALL redirect to setup as usual and forget the account, and if it fails the gate SHALL show its usual error handling. Deleting the account SHALL forget it.

#### Scenario: Returning user

- **GIVEN** the signed-in account finished setup on this device before
- **WHEN** the gate mounts and the account check is still loading
- **THEN** protected content renders immediately

#### Scenario: First sign-in on a device

- **GIVEN** no remembered account, or a different one
- **WHEN** the gate mounts and the account check is loading
- **THEN** the gate waits on the boot screen as before

### Requirement: Public pages send an unfinished signed-in account to setup

The public pages inside the app shell (the Library and My Game › Collection) SHALL stay open to every visitor without the gate's loading screen. When the visitor is signed in and the account status answers that setup is incomplete, the page SHALL redirect to setup the same way the gate does (the name step for an account that already has a key, otherwise the start), carrying the current page as `next`. While the status is loading or failed, the page SHALL render as usual. Player-data sync SHALL NOT start for an account until it is known to have finished setup, either from the device's remembered account or from the account status.

#### Scenario: First sign-in from the Library

- **GIVEN** a first-time visitor on `/library/characters` signs in and has no Tacticus key yet
- **WHEN** the account status answers
- **THEN** they are sent to `/setup?next=%2Flibrary%2Fcharacters`, and no player-data sync was attempted

#### Scenario: Configured account on a public page

- **WHEN** a signed-in account that finished setup opens My Game › Collection
- **THEN** the page renders without a redirect and the background sync runs as usual
