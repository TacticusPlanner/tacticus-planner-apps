# redirect-authentication Specification

## Purpose

Defines how the application completes sign-in and token-acquisition flows
that round-trip through the identity provider, and guarantees those flows
succeed reliably regardless of the identity provider's cross-origin
isolation policies.

## Requirements

### Requirement: Interactive sign-in completes and authenticates the user

When a user completes an interactive sign-in (full-page redirect) with the
identity provider, the system SHALL return the user to the application in an
authenticated state without requiring any further manual action.

#### Scenario: Successful interactive sign-in

- **WHEN** a user completes credential entry and consent at the identity
  provider after triggering sign-in
- **THEN** the user is returned to the application already signed in, with no
  additional click or prompt required

#### Scenario: Interactive sign-in abandoned at the identity provider

- **WHEN** a user cancels or backs out of the identity provider's sign-in or
  sign-up steps and is returned to the application with an error response
- **THEN** the application still starts, the user is shown as signed out, and
  signing in again starts a fresh interactive sign-in

### Requirement: Sign-in from the landing experience reaches the authenticated home experience

When a user signs in starting from the unauthenticated landing page, the
system SHALL land them on the authenticated home experience once sign-in
completes.

#### Scenario: Sign-in from the landing page

- **WHEN** a user triggers sign-in from the unauthenticated landing page and
  completes it at the identity provider
- **THEN** the user lands on the authenticated home experience

### Requirement: Re-authentication from within the application returns the user to the same page

When a user triggers sign-in or re-authentication from a control inside the
already-authenticated application (not the unauthenticated landing page),
the system SHALL return the user to the same page they were on once the flow
completes, rather than to a different default destination.

#### Scenario: Re-authentication triggered from an in-app control

- **WHEN** a user triggers sign-in or re-authentication from a control shown
  inside the authenticated application (for example, in response to an
  expired session) and completes it at the identity provider
- **THEN** the user returns to the same page/route they were on before the
  flow started

### Requirement: Silent session checks and token refresh are not blocked by the identity provider's cross-origin isolation policy

Cross-origin isolation (Cross-Origin-Opener-Policy) headers the identity
provider applies to its own pages SHALL NOT, by themselves, prevent a silent
session-restore check or a silent background token refresh from completing
when the identity provider has a live session for the account. This
guarantee covers only the cross-origin isolation policy — it does not cover
other conditions, such as browser privacy restrictions that block
third-party storage or cookies, which remain an expected and separate source
of silent failure. When a silent attempt fails for any reason, the system
falls back to interactive sign-in rather than surfacing an error for the
background attempt.

#### Scenario: Silent session restore with a live identity-provider session and no browser privacy restriction

- **WHEN** the application attempts a silent session-restore check, the
  identity provider has a live session for the cached account, and the
  browser does not block the storage or cookies the check relies on
- **THEN** the restore attempt succeeds without any user-visible interaction,
  even though the identity provider enforces cross-origin isolation headers
  on its authentication pages

#### Scenario: Silent token refresh with a live identity-provider session and no browser privacy restriction

- **WHEN** the application attempts a silent background token refresh, the
  identity provider has a live session for the active account, and the
  browser does not block the storage or cookies the refresh relies on
- **THEN** the refresh succeeds without any user-visible interaction, even
  though the identity provider enforces cross-origin isolation headers on its
  authentication pages

#### Scenario: Browser privacy restrictions block a silent attempt despite a live identity-provider session

- **WHEN** the browser blocks the third-party storage or cookies a silent
  attempt relies on, even though the identity provider has a live session
  for the account
- **THEN** the silent attempt fails, this is not treated as a defect in the
  cross-origin isolation handling, and the system falls back to interactive
  sign-in

### Requirement: Authentication responses are never exposed as visible URLs or cached

The system SHALL ensure that raw authentication responses (authorization
codes or tokens returned by the identity provider) are never visibly
displayed in a browser tab, title, or history entry, and are never retained
by intermediate HTTP caches.

#### Scenario: Sign-in redirect completes

- **WHEN** the identity provider redirects back to the application with an
  authentication response
- **THEN** the browser tab title and address bar do not display the raw
  authentication response, and no intermediate cache retains it

### Requirement: At most one interactive redirect starts per page load

When one or more callers (an API request, the player-data sync, a sign-in control) determine that interaction is required at about the same time, the system SHALL start exactly one interactive redirect. Later callers in the same page load SHALL join the in-flight redirect instead of starting another, so the identity provider is never entered twice and the return destination is the one recorded by the first caller. A redirect whose launch fails clears the in-flight state, so a later caller MAY start a new one.

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
