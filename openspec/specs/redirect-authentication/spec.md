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
- **THEN** the application still starts, the user is shown as signed out, no
  error toast is shown for the deliberate cancel, and signing in again starts
  a fresh interactive sign-in at the identity provider's login page

#### Scenario: Identity provider returns a sign-in error

- **WHEN** an interactive sign-in or re-authentication returns to the
  application with an error response that is not a deliberate cancel (for
  example, the identity provider still holds a session for an account that
  was deleted on another device)
- **THEN** the application still starts, the user is shown as signed out, and
  the localized authentication error toast is shown once

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

### Requirement: Token cache persists on the device

Identity-provider tokens SHALL be stored in the device's local storage, shared across tabs and kept after the browser or the installed app closes, so a relaunch restores the session from the cached refresh token without a hidden identity-provider frame. Signing out SHALL remove them, together with the account hint described in `silent-sign-in`.

#### Scenario: Relaunching the installed app

- **GIVEN** a user who signed in less than 24 hours ago
- **WHEN** they close and relaunch the installed app
- **THEN** the session is restored from the device's token cache, with no hidden frame and no sign-in prompt

#### Scenario: Signing out

- **WHEN** the user signs out
- **THEN** no access token, refresh token or id token remains in site storage

### Requirement: Signing out removes the account's local data

Signing out, including the sign-out that follows an account purge, SHALL delete the browser's local copy of the account's data before leaving for the identity provider: the game-catalog and player-data databases, the in-memory local-data cache, and every localStorage entry whose key starts with `tp.session.`. Data that belongs to the account SHALL be stored under that prefix. Per-device preferences, such as theme and language, SHALL use other keys and are kept.

#### Scenario: Import leftovers do not reach the next account

- **GIVEN** a V1 import left material steps waiting on the Goals page
- **WHEN** the user signs out and another account signs in on the same browser
- **THEN** the Goals page does not show the previous account's steps

#### Scenario: Other open tabs let go of the account's data

- **GIVEN** the app is open in a second tab, possibly in the middle of a player-data sync
- **WHEN** the user signs out in the first tab
- **THEN** the second tab drops the local reads it holds, and its sync writes nothing into the player-data database

#### Scenario: Preferences survive sign-out

- **WHEN** the user signs out
- **THEN** the chosen theme and language are still applied on the signed-out pages

### Requirement: A failed sign-in never reuses a stale identity-provider session

After an interactive sign-in or re-authentication returns with an error response, the system SHALL forget the accounts cached on the device and the remembered account hint, and SHALL ask the identity provider for a fresh login on the next interactive sign-in, re-authentication or sign-up from that browser. A completed sign-in SHALL end this. Silent restore attempts are unaffected.

#### Scenario: Sign-in after a failed attempt shows the login page

- **WHEN** a sign-in returned with an error response and the user activates
  any sign-in control
- **THEN** the identity provider shows its login page instead of answering
  from an existing session, so the user can enter a different account or
  create a new one

#### Scenario: Account deleted on another device

- **WHEN** a user purged their account on one device, and on another device
  whose identity-provider session still belongs to that account they start
  sign-in, the identity provider rejects it, and they start sign-in again
- **THEN** the second attempt shows the identity provider's login page, and
  the user is not sent back to the landing page in a loop

#### Scenario: Fresh login is required only until a sign-in succeeds

- **WHEN** a fresh login was required after a failed attempt and the user
  then completes sign-in
- **THEN** later sign-ins, re-authentications and silent restores behave as
  before the failure, reusing the identity provider's session

#### Scenario: Failed sign-in clears device sign-in state

- **WHEN** an interactive sign-in returns with an error response
- **THEN** no account is cached on the device and no account hint remains,
  so the next app load does not start a silent restore for the failed
  account

### Requirement: Sign-up opens account creation directly

A sign-up control SHALL start the same full-page interactive flow as sign-in, but SHALL ask the identity provider to open its create-account step directly, where every sign-up method of the user flow (email and Google) is offered. A completed sign-up SHALL authenticate the user and follow the same return-destination rules as a sign-in started from the same page.

#### Scenario: Sign-up from the landing page

- **WHEN** a signed-out visitor on a bare `/` activates Sign up and completes
  account creation at the identity provider
- **THEN** they are returned signed in and land on Home

#### Scenario: Sign-up with a preserved destination

- **WHEN** a signed-out visitor on `/?next=/goals` activates Sign up and
  completes account creation
- **THEN** they land on `/goals`

#### Scenario: Visitor with an existing account uses Sign up

- **WHEN** a visitor activates Sign up but already has an account
- **THEN** the identity provider's create-account step offers its own link
  back to sign-in, and completing sign-in there signs them in as usual

#### Scenario: Sign-up abandoned

- **WHEN** a visitor backs out of the create-account step and is returned
  with an error response
- **THEN** the same abandoned-sign-in behaviour applies: signed out, no
  toast, and the next sign-in or sign-up shows a fresh login page
