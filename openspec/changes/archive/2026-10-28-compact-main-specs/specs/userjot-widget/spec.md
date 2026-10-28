## MODIFIED Requirements

### Requirement: Search quick action opens the feedback widget

The Submit Feedback quick action in desktop navigation search and mobile Menu search (availability and search hand-off: see `app-navigation`) SHALL open the same feedback/roadmap/updates widget, retaining verified identity, anonymous fallback, theme, language, and suppression of proactive UI, and SHALL NOT open Conversations.

#### Scenario: Identification failure preserves anonymous feedback

- **WHEN** a signed-in user selects Submit Feedback and identity verification fails
- **THEN** the ready widget opens anonymously with no unsigned identity fallback

### Requirement: The widget SDK is loaded on demand from app code

The feedback widget SDK SHALL be loaded by the application after first paint, from a versioned SDK URL, and never as a static `<script>` in the entry document; app code inserts the SDK script at runtime. Loading SHALL start when the user is signed in or when any entry point (desktop header button, mobile drawer row, search quick action) is first activated by an anonymous user. Until the SDK has loaded, entry points SHALL remain visible and activation SHALL open the widget once loading completes.

#### Scenario: Signed-in user, SDK loads in the background

- **GIVEN** a user signs in
- **WHEN** the authenticated shell renders
- **THEN** the SDK starts loading after first paint and, once loaded, is identified with the signed identity token

#### Scenario: Anonymous user opens feedback from search

- **GIVEN** a signed-out visitor for whom the SDK has not been loaded
- **WHEN** they select Submit Feedback in navigation search
- **THEN** the SDK loads, the widget opens anonymously, and no proactive UI appears

#### Scenario: SDK fails to load

- **WHEN** the SDK request fails or is blocked
- **THEN** the entry points are disabled with an explanation, the full-board link still works, and no error page or console exception is raised
