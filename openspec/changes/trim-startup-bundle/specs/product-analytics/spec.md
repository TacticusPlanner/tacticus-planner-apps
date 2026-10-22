# Spec Delta

## ADDED Requirements

### Requirement: Analytics code is loaded only once a user is identified

The client SHALL NOT download or initialise the analytics SDK until a signed-in user's analytics id is available. Before that point no analytics script is requested and no analytics network traffic of any kind occurs. Loading the SDK SHALL NOT delay rendering or navigation, and a failed or blocked SDK download SHALL leave the app fully functional with capture silently off.

#### Scenario: Signed-out visitor on an anonymous page

- **WHEN** a visitor who is not signed in opens any page, including anonymously-accessible Library pages
- **THEN** no analytics script is downloaded and no request to the analytics destination is made

#### Scenario: User becomes identified

- **WHEN** a signed-in user's analytics id becomes available
- **THEN** the analytics SDK is downloaded, the identity is established, and the page view for the current route is reported once the SDK is ready

#### Scenario: SDK download blocked

- **WHEN** the analytics script cannot be downloaded (network policy, blocker, outage)
- **THEN** the app renders and navigates normally, shows no error, and reports nothing

#### Scenario: Signing out before the SDK finished loading

- **WHEN** a user signs out while the analytics SDK is still downloading
- **THEN** no event is reported for that user and no identity is established when the download completes
