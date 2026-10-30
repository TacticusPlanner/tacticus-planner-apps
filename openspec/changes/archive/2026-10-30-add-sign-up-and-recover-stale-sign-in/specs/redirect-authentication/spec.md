# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
