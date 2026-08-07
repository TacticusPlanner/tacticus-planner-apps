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

### Requirement: Silent session checks and token refresh succeed under the identity provider's default isolation policy

The system SHALL complete silent session-restore checks and silent
background token refresh successfully whenever the identity provider has a
live session for the account, regardless of cross-origin isolation
(Cross-Origin-Opener-Policy) headers the identity provider applies to its own
pages.

#### Scenario: Silent session restore with a live identity-provider session

- **WHEN** the application attempts a silent session-restore check and the
  identity provider has a live session for the cached account
- **THEN** the restore attempt succeeds without any user-visible interaction,
  even though the identity provider enforces cross-origin isolation headers
  on its authentication pages

#### Scenario: Silent token refresh with a live identity-provider session

- **WHEN** the application attempts a silent background token refresh and the
  identity provider has a live session for the active account
- **THEN** the refresh succeeds without any user-visible interaction, even
  though the identity provider enforces cross-origin isolation headers on its
  authentication pages

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
