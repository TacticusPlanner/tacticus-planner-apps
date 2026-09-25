# account-display-name Specification

## Purpose

Provides a deliberate, editable application name during setup and account management while keeping provider-derived suggestions private until the user saves a name.

## Requirements

### Requirement: Setup asks the user to choose an editable name

After either key-entry or V1-import setup path, the app SHALL present an editable display-name step before setup completes. It SHALL prefill a private suggestion when available (the `/me` provider suggestion, or after V1 import the suggestion returned by the import), allow replacement, and require a valid 1–80-character trimmed value before saving. A saved name SHALL survive reload. A failed save SHALL keep the draft and show a retryable error.

#### Scenario: Normal setup with provider suggestion

- **GIVEN** `/me` provides a provider-derived suggestion and no name
- **WHEN** the user reaches the name step after configuring a key
- **THEN** the suggestion is editable and the app does not complete setup until the user submits it or another valid name

#### Scenario: V1 setup suggests the authenticated username

- **GIVEN** a successful V1 import returned a username suggestion
- **WHEN** the name step opens
- **THEN** the field is prefilled with that suggestion (falling back to the `/me` suggestion after a reload) but is not saved until the user submits it

#### Scenario: Existing key but no name

- **WHEN** an existing signed-in user has a configured key and no name
- **THEN** setup opens directly at the name step while preserving their originally requested destination

#### Scenario: Mobile name step is addressable

- **WHEN** a user below 768px moves from the key/import step to the name step
- **THEN** the URL changes to the name step and Back/reload preserve that step and the safe return destination

#### Scenario: Desktop name step is reachable

- **WHEN** a user at or above 768px finishes key/import setup
- **THEN** the name form is visibly presented before completion and can be submitted by keyboard

### Requirement: Manage Account edits the name

Manage Account SHALL show the display name in an editable field and save it through the profile update operation without changing authentication identity or email. Successful save SHALL refresh the account header/avatar and feedback identity in the same signed-in session; failed save SHALL preserve the old public name and the user's unsaved draft.

#### Scenario: Name change updates public identity

- **GIVEN** a user with a name changes `Ada` to `Commander Ada`
- **WHEN** the save succeeds
- **THEN** the account menu/avatar and a newly identified feedback widget use `Commander Ada` without requiring sign-out

#### Scenario: Name edit is one tap from the user menu

- **WHEN** a user with a name opens the account menu on desktop or mobile
- **THEN** an edit control beside the shown name opens Manage Account on the name editor

#### Scenario: Save fails

- **WHEN** the name update fails
- **THEN** the old public name remains visible, the draft stays editable, and the user sees a retryable error

### Requirement: Identity is neutral until a name is set

The shell SHALL NOT display a provider/email-like suggestion as the account's public name or avatar label before a name is set. It SHALL use neutral product copy, while setup alone may show the suggestion privately.

#### Scenario: Provider username resembles email

- **GIVEN** `/me` reports an email-like suggestion and no name
- **WHEN** the shell or account menu renders
- **THEN** it shows neutral account identity rather than that suggestion
