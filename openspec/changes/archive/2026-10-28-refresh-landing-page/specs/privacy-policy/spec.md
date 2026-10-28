# Spec Delta

## Purpose

Defines the public privacy page: where it lives, who can reach it, and what it must tell a visitor about the data Tacticus Planner handles, so the claims match what the app and API actually do.

## ADDED Requirements

### Requirement: A privacy page is public at /privacy

The app SHALL serve a privacy page at `/privacy` that renders for signed-out and signed-in visitors alike, without the onboarding gate, inside the public layout (see `landing-page`). It SHALL be linked from the public footer. Its route chunk SHALL load lazily so the landing page bundle does not grow by its text. Its browser title SHALL name the page.

#### Scenario: Signed-out visitor opens the privacy page

- **WHEN** a signed-out visitor follows the footer's Privacy link
- **THEN** `/privacy` renders the privacy notice without starting sign-in or redirecting to `/`

#### Scenario: Signed-in user without a configured API key

- **WHEN** a signed-in user who has not finished account setup opens `/privacy`
- **THEN** the privacy notice renders and the user is not sent to account setup

### Requirement: The privacy notice states what is collected and why

The page SHALL be localized in every supported locale and SHALL state, in plain language, with a "last updated" date:

- that Tacticus Planner is an unofficial, open-source fan project and who to contact (the Discord server and the GitHub organization);
- that sign-in is handled by Microsoft Entra External ID, and the planner keeps only the sign-in identifier it returns, a display name, and a last-seen time, not a password;
- that a Tacticus API key the user provides is stored encrypted and used only to read the user's game and guild data from the Tacticus API;
- that the planner stores the user's synced game data, goals, projects, event plans, guild data and settings so the planner works across devices, and keeps a copy in the browser's local storage;
- that browsing without an account sends no analytics, and that for signed-in users, usage events and uncaught errors are sent to PostHog under a pseudonymous id, without autocapture, session replay, typed planner content, email or display name;
- that the feedback board (UserJot) identifies a signed-in user by a signed token for their planner account and display name only when they open it through the in-app feedback entry points, and that opening the public board link (as from the public footer) sends nothing from the planner;
- that the planner does not sell data or show ads;
- how to delete the account and all its planner data (Account settings, Account tab, "Purge my account"), and that the browser's local copy is deleted when the user signs out.

#### Scenario: Notice covers analytics

- **WHEN** a visitor reads `/privacy`
- **THEN** it says signed-out browsing sends no analytics and names PostHog and the pseudonymous id for signed-in users

#### Scenario: Localized notice

- **WHEN** a visitor with the language set to Français opens `/privacy`
- **THEN** every heading and paragraph of the notice is in French
