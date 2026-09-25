## MODIFIED Requirements

### Requirement: Account setup blocks protected content until a Tacticus API key is configured

A signed-in user without a configured Tacticus API key or without an application display name SHALL be sent to account setup instead of protected route content. Once both are present, protected content SHALL be shown and setup SHALL NOT reappear. While account state is being determined, the system SHALL show neither protected content nor setup, and SHALL NOT navigate; if account state cannot be determined, the system SHALL fail open, show protected content, and SHALL NOT navigate.

#### Scenario: Unconfigured user is sent to setup instead of protected content

- **WHEN** a signed-in user with no configured Tacticus API key opens a protected route
- **THEN** they are taken to account setup and the route's own content is not shown

#### Scenario: Configured user is shown protected content

- **WHEN** a signed-in user with a configured Tacticus API key and a display name opens a protected route
- **THEN** the route's content is shown and account setup is not

#### Scenario: Account state still loading

- **WHEN** a signed-in user opens a protected route and their account state has not yet resolved
- **THEN** a loading indicator is shown, neither setup nor route content is shown, and no navigation occurs

#### Scenario: Account state cannot be determined

- **WHEN** the request for the signed-in user's account state fails
- **THEN** the route's content is shown rather than setup, and no navigation occurs, so a transient failure does not lock the user out of the app

#### Scenario: Key exists but no name is set

- **WHEN** a signed-in user with a configured key but no display name opens a protected route
- **THEN** they are taken to the name step and the route's own content is not shown
