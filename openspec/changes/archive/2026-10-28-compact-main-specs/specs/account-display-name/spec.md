## MODIFIED Requirements

### Requirement: Manage Account edits the name

Manage Account SHALL show the display name in an editable field and save it through the profile update operation without changing authentication identity or email. Successful save SHALL refresh the account header/avatar in the same signed-in session (feedback identity: see `userjot-widget`); failed save SHALL preserve the old public name and the user's unsaved draft.

#### Scenario: Name change updates public identity

- **GIVEN** a user with a name changes `Ada` to `Commander Ada`
- **WHEN** the save succeeds
- **THEN** the account menu/avatar use `Commander Ada` without requiring sign-out

#### Scenario: Save fails

- **WHEN** the name update fails
- **THEN** the old public name remains visible, the draft stays editable, and the user sees a retryable error

### Requirement: Identity is neutral until a name is set

The shell SHALL NOT display a provider/email-like suggestion as the account's public name or avatar label before a name is set. It SHALL use neutral product copy, while setup alone may show the suggestion privately. While the account is still loading, the loading identity of `account-menu` applies instead of the neutral copy.

#### Scenario: Provider username resembles email

- **GIVEN** `/account` reports an email-like suggestion and no name
- **WHEN** the shell or account menu renders
- **THEN** it shows neutral account identity rather than that suggestion
