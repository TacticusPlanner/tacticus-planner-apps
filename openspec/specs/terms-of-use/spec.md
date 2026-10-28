# terms-of-use Specification

## Purpose

Defines the public terms of use page: where it lives, who can reach it, and what it must tell a visitor about the rules for using the hosted Tacticus Planner. It is the "Terms of use" link in the Microsoft Entra ID sign-in branding, beside "Privacy & cookies" (see `privacy-policy`).

## Requirements

### Requirement: A terms of use page is public at /terms

The app SHALL serve a terms of use page at `/terms` that renders for signed-out and signed-in visitors alike, without the onboarding gate, inside the public layout (see `landing-page`). It SHALL be linked from the public footer and, with the privacy page, from the signed-in account menu and the guest preferences menu, so it is reachable from inside the app. Its route chunk SHALL load lazily so the landing page bundle does not grow by its text. Its browser title SHALL name the page. It SHALL share its page structure (title, "last updated" date, intro, titled sections, contact links) with the privacy page.

#### Scenario: Signed-out visitor opens the terms page

- **WHEN** a signed-out visitor follows the footer's Terms of use link, or the Terms of use link on the Microsoft sign-in page
- **THEN** `/terms` renders the terms without starting sign-in or redirecting to `/`

#### Scenario: Signed-in user without a configured API key

- **WHEN** a signed-in user who has not finished account setup opens `/terms`
- **THEN** the terms render and the user is not sent to account setup

### Requirement: The terms state the rules of use in plain language

The page SHALL be localized in every supported locale and SHALL state, in plain language, with a "last updated" date:

- that the planner is a free, volunteer-run, unofficial fan project not affiliated with, endorsed or sponsored by Snowprint Studios or Games Workshop, and that using it means accepting the terms;
- that the user signs in with Microsoft Entra External ID, is responsible for that sign-in, should only add a Tacticus API key they own or may use, and can delete their account in Account settings;
- what use is not allowed (breaking the law or the game's terms, reaching other users' data, disrupting or overloading the service, automated scraping, offensive or impersonating planner names);
- that Tacticus and Warhammer 40,000 names, art and data belong to their owners;
- that the source code is open source under each repository's licence, which the terms do not limit;
- that the planner is provided as is, its plans and recommendations may be wrong, and liability is excluded as far as the law allows;
- that features may change, the planner may be unavailable or shut down, and accounts breaking the terms may be suspended or removed;
- that the terms may change, with the date showing the current version;
- who to contact (the Discord server and the GitHub organization).

#### Scenario: Localized terms

- **WHEN** a visitor with the language set to Deutsch opens `/terms`
- **THEN** every heading and paragraph of the terms is in German
