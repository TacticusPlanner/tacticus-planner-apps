## Purpose

Defines how the gate in front of protected routes behaves while it waits for, and when it cannot get, the current user's account status, so that a short API outage or an expired token never presents signing out as the way forward.

## ADDED Requirements

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

When the account-status request fails because the user's session needs interaction (the identity provider requires sign-in again, or a silent token request timed out), the gate SHALL start the app's in-app re-authentication flow that returns the user to the same page, and SHALL NOT show the error card for that failure.

#### Scenario: Token refresh requires sign-in

- **GIVEN** a user's tab has been open long enough that their session can no longer be renewed silently
- **WHEN** they navigate to a protected route and the account-status request reports that interaction is required
- **THEN** the app redirects them to sign in and, on return, lands them on the route they were opening, still signed in, without an error card in between

### Requirement: The error card prioritises recovery over signing out

The gate's error card SHALL present Retry as its primary action and SHALL describe the failure as a problem reaching the service, not as a problem with the user's account or sign-in. Sign out SHALL remain available as a secondary action.

#### Scenario: Error card actions

- **WHEN** the error card is shown
- **THEN** Retry is the primary, first-focused action, Sign out is visually secondary, and the copy says the account status could not be checked right now
