## MODIFIED Requirements

### Requirement: Signed-in users are identified with a verified identity

When a user is signed in, the app SHALL identify that user to the widget using a signed identity token obtained from the backend, so the widget can trust the identity rather than accepting an unverified claim from the browser. The client SHALL not substitute provider/email-like data for a display name that has not been set. After a successful display-name update, it SHALL fetch a fresh token and refresh the widget identity within the session.

#### Scenario: Signing in identifies the user to the widget

- **WHEN** a user with a name signs in
- **THEN** the widget receives a signed identity matching that user's account id and display name; the user's email is never included

#### Scenario: Signing out clears the widget identity

- **WHEN** a signed-in user signs out
- **THEN** the app clears the widget's identity, and subsequent widget activity is anonymous

#### Scenario: No name uses only the server token fallback

- **WHEN** a signed-in user has not set a name
- **THEN** the client uses the server's signed generic identity and does not send its private suggestion to the widget

#### Scenario: Editing name refreshes identity

- **WHEN** a signed-in user successfully saves a new display name
- **THEN** a newly fetched signed token identifies the same stable account id with the new name without requiring sign-out
