# Spec Delta

## MODIFIED Requirements

### Requirement: Token cache is tab-scoped

Identity-provider tokens SHALL be stored in the device's local storage, shared across tabs and kept after the browser or the installed app closes, so a relaunch restores the session from the cached refresh token without a hidden identity-provider frame. Signing out SHALL remove them, together with the account hint described in `silent-sign-in`.

#### Scenario: Relaunching the installed app

- **GIVEN** a user who signed in less than 24 hours ago
- **WHEN** they close and relaunch the installed app
- **THEN** the session is restored from the device's token cache, with no hidden frame and no sign-in prompt

#### Scenario: Signing out

- **WHEN** the user signs out
- **THEN** no access token, refresh token or id token remains in site storage
