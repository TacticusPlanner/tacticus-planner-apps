## MODIFIED Requirements

### Requirement: Manage Account edits the name

Manage Account SHALL show the display name in an editable field and save it through the profile update operation without changing authentication identity or email. Successful save SHALL refresh the account header/avatar in the same signed-in session (feedback identity: see `userjot-widget`); failed save SHALL preserve the old public name and the user's unsaved draft.

#### Scenario: Name change updates public identity

- **GIVEN** a user with a name changes `Ada` to `Commander Ada`
- **WHEN** the save succeeds
- **THEN** the account menu/avatar use `Commander Ada` without requiring sign-out

#### Scenario: Name edit is one tap from the user menu

- **WHEN** a user with a name opens the account menu on desktop or mobile
- **THEN** an edit control beside the shown name opens Manage Account on the name editor

#### Scenario: Save fails

- **WHEN** the name update fails
- **THEN** the old public name remains visible, the draft stays editable, and the user sees a retryable error

### Requirement: Identity is neutral until a name is set

The shell SHALL NOT display a provider/email-like suggestion as the account's public name or avatar label before a name is set. It SHALL use neutral product copy, while setup alone may show the suggestion privately. While the account is still loading, the loading identity of `account-menu` applies instead of the neutral copy.

#### Scenario: Provider username resembles email

- **GIVEN** `/account` reports an email-like suggestion and no name
- **WHEN** the shell or account menu renders
- **THEN** it shows neutral account identity rather than that suggestion

#### Scenario: Name not yet known

- **GIVEN** `/account` has not answered yet for a user who has a confirmed name
- **WHEN** the shell or account menu renders
- **THEN** it shows a loading identity, neither the neutral label nor the provider email, until the confirmed name arrives
