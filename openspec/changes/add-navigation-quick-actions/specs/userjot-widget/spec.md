## MODIFIED Requirements

### Requirement: Both entry points also link to the full public board

Alongside each dedicated in-app widget entry point (the desktop header button and the mobile account drawer row), the app SHALL show a link to the project's public UserJot board that opens in a new tab, so the full board is reachable without prior knowledge of its URL or a separate announcement post. This link SHALL NOT depend on the user being signed in or identified to the widget — the public board is browsable anonymously.

#### Scenario: Reaching the full board from the desktop header

- **GIVEN** a user viewing the desktop header
- **WHEN** they activate the "view full board" link beside the feedback button
- **THEN** the project's public UserJot board opens in a new tab

#### Scenario: Reaching the full board from the mobile account drawer

- **GIVEN** a user with the mobile account drawer open
- **WHEN** they activate the "view full board" row beside the Feedback row
- **THEN** the project's public UserJot board opens in a new tab

#### Scenario: The link works without a signed-in session

- **GIVEN** an unauthenticated user
- **WHEN** they activate the "view full board" link
- **THEN** the public board opens in a new tab, with no identify/sign-in step required first

The search quick action SHALL open the widget only and SHALL NOT require a duplicate adjacent full-board link.

### Requirement: No default UserJot UI appears outside the app's own entry points

On every page and in every auth state, the app SHALL suppress all of UserJot's proactive default UI — the floating launcher button, ephemeral "whisper" notification toasts, and auto-shown changelog announcements — so the widget only ever opens as a direct result of the user activating one of this app's own entry points (the desktop header button, the mobile drawer row, the search quick action, or the full-board link). This SHALL hold on pages where no custom entry point is rendered at all, such as the unauthenticated landing page, not only on pages where one is.

#### Scenario: No proactive popup on the unauthenticated landing page

- **GIVEN** a signed-out user on the landing page
- **WHEN** the page loads and remains open with no user interaction
- **THEN** no UserJot popup, toast, or launcher button appears

#### Scenario: No proactive popup on an authenticated page

- **GIVEN** a signed-in user on any page inside the app shell
- **WHEN** the page loads and remains open with no interaction with a UserJot entry point
- **THEN** no UserJot popup, toast, or launcher button appears unprompted

## ADDED Requirements

### Requirement: Search quick action opens the feedback widget

Desktop navigation search and mobile Menu search SHALL offer Submit Feedback as an explicit widget entry point for signed-in and anonymous users. Activation SHALL dismiss search before opening the same feedback/roadmap/updates widget, retaining verified identity, anonymous fallback, theme, language, and suppression of proactive UI. It SHALL not submit feedback or open Conversations. If the widget is unavailable, the result SHALL be disabled with an explanation.

#### Scenario: Desktop feedback from search

- **WHEN** a desktop user selects Submit Feedback in navigation search while the widget is ready
- **THEN** search closes and the existing widget opens without posting content

#### Scenario: Mobile feedback from search

- **WHEN** a mobile user taps Submit Feedback in Menu search while the widget is ready
- **THEN** the Menu drawer releases focus and pointer restrictions before the existing widget opens

#### Scenario: Identification failure preserves anonymous feedback

- **WHEN** a signed-in user selects Submit Feedback and identity verification fails
- **THEN** the ready widget opens anonymously with no unsigned identity fallback
