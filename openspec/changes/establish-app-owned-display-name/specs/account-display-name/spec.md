## Purpose

Provides a deliberate, editable application name during setup and account management while keeping provider-derived suggestions private until confirmed.

## ADDED Requirements

### Requirement: Setup asks the user to confirm an editable name

After either key-entry or V1-import setup path, the app SHALL present an editable display-name step before setup completes. It SHALL prefill a private `/me` suggestion when available, allow replacement, and require a valid 1–80-character trimmed value before saving. A saved confirmation SHALL survive reload. A failed save SHALL keep the draft and show a retryable error.

#### Scenario: Normal setup with provider suggestion

- **GIVEN** `/me` provides an unconfirmed provider-derived suggestion
- **WHEN** the user reaches the name step after configuring a key
- **THEN** the suggestion is editable and the app does not complete setup until the user submits it or another valid name

#### Scenario: V1 setup suggests the authenticated username

- **GIVEN** successful V1 import updated `/me` with an unconfirmed username suggestion
- **WHEN** the name step opens
- **THEN** the field is prefilled with that suggestion but is not automatically confirmed

#### Scenario: Existing key but unconfirmed name

- **WHEN** an existing signed-in user has a configured key and no confirmed name
- **THEN** setup opens directly at the name step while preserving their originally requested destination

#### Scenario: Mobile name step is addressable

- **WHEN** a user below 768px moves from the key/import step to name confirmation
- **THEN** the URL changes to the name step and Back/reload preserve that step and the safe return destination

#### Scenario: Desktop name step is reachable

- **WHEN** a user at or above 768px finishes key/import setup
- **THEN** the name form is visibly presented before completion and can be submitted by keyboard

### Requirement: Manage Account edits the confirmed name

Manage Account SHALL show the confirmed display name in an editable field and save it through the profile update operation without changing authentication identity or email. Successful save SHALL refresh the account header/avatar and feedback identity in the same signed-in session; failed save SHALL preserve the old public name and the user's unsaved draft.

#### Scenario: Name change updates public identity

- **GIVEN** a confirmed user changes `Ada` to `Commander Ada`
- **WHEN** the save succeeds
- **THEN** the account menu/avatar and a newly identified feedback widget use `Commander Ada` without requiring sign-out

#### Scenario: Save fails

- **WHEN** the name update fails
- **THEN** the old public name remains visible, the draft stays editable, and the user sees a retryable error

### Requirement: Unconfirmed identity is neutral outside setup

The shell SHALL NOT display a provider/email-like suggestion as the account's public name or avatar label before confirmation. It SHALL use neutral product copy, while setup alone may show the suggestion privately.

#### Scenario: Provider username resembles email

- **GIVEN** `/me` reports an unconfirmed email-like suggestion
- **WHEN** the shell or account menu renders
- **THEN** it shows neutral account identity rather than that suggestion
