## MODIFIED Requirements

### Requirement: Identity is neutral until a name is set

The shell SHALL NOT display a provider/email-like suggestion as the account's public name or avatar label before a name is set. It SHALL use neutral product copy, while setup alone may show the suggestion privately. While the account is still loading the shell SHALL show a loading identity rather than the neutral copy, since whether a name is set is not yet known.

#### Scenario: Provider username resembles email

- **GIVEN** `/me` reports an email-like suggestion and no name
- **WHEN** the shell or account menu renders
- **THEN** it shows neutral account identity rather than that suggestion

#### Scenario: Name not yet known

- **GIVEN** `/me` has not answered yet for a user who has a confirmed name
- **WHEN** the shell or account menu renders
- **THEN** it shows a loading identity, neither the neutral label nor the provider email, until the confirmed name arrives
