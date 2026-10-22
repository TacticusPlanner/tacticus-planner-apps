# Spec Delta

## ADDED Requirements

### Requirement: The widget SDK is loaded on demand from app code

The feedback widget SDK SHALL be loaded by the application after first paint, from a versioned SDK URL, and never as a script in the entry document's head. Loading SHALL start when the user is signed in or when any entry point (desktop header button, mobile drawer row, search quick action) is first activated by an anonymous user. Until the SDK has loaded, entry points SHALL remain visible and activation SHALL open the widget once loading completes.

#### Scenario: Signed-in user, SDK loads in the background

- **GIVEN** a user signs in
- **WHEN** the authenticated shell renders
- **THEN** the SDK starts loading after first paint and, once loaded, is identified with the signed identity token as today

#### Scenario: Anonymous user opens feedback from search

- **GIVEN** a signed-out visitor for whom the SDK has not been loaded
- **WHEN** they select Submit Feedback in navigation search
- **THEN** the SDK loads, the widget opens anonymously, and no proactive UI appears

#### Scenario: SDK fails to load

- **WHEN** the SDK request fails or is blocked
- **THEN** the entry points are disabled with an explanation, the full-board link still works, and no error page or console exception is raised

### Requirement: Each environment uses its own feedback project

The staging deployment SHALL identify users to, and submit feedback into, a feedback project distinct from production's, so staging activity never appears on the production board.

#### Scenario: Feedback submitted on staging

- **WHEN** a user submits feedback on the staging deployment
- **THEN** it is recorded in the staging feedback project and not on the production board
