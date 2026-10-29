# Spec Delta

## MODIFIED Requirements

### Requirement: The gate's loading state is labelled and reports slowness

While the gate waits for the account status it SHALL show the boot screen with a visible "Loading your account" message, exposed as a status to assistive technology. If it is still waiting after 5 seconds (and is not starting re-authentication), it SHALL add a note that loading is taking longer than usual and that refreshing or signing in again will not speed it up.

#### Scenario: Normal load

- **WHEN** the account status is loading
- **THEN** the gate shows the boot screen with "Loading your account" and no slow note

#### Scenario: Slow load

- **WHEN** the account status is still loading 5 seconds later
- **THEN** the gate also shows the "taking longer than usual" note

## ADDED Requirements

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
