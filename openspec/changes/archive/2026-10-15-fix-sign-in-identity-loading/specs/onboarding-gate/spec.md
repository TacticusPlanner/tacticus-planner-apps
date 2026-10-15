## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: The gate's loading state is labelled and reports slowness

While the gate waits for the account status it SHALL show a spinner with a visible "Loading your account" label exposed as a status to assistive technology. If it is still waiting after 5 seconds (and is not starting re-authentication), it SHALL add a note that loading is taking longer than usual and that refreshing or signing in again will not speed it up.

#### Scenario: Normal load

- **WHEN** the account status is loading
- **THEN** the gate shows a spinner labelled "Loading your account" and no slow note

#### Scenario: Slow load

- **WHEN** the account status is still loading 5 seconds later
- **THEN** the gate also shows the "taking longer than usual" note
