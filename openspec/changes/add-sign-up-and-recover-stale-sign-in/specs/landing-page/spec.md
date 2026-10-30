# Spec Delta

## MODIFIED Requirements

### Requirement: Public pages share a top bar and a footer

The landing page and every other public page (currently `/privacy` and `/terms`) SHALL render inside one public layout with a top bar, a single `main` landmark holding the page, and a footer. The top bar SHALL show the app logo and name (linking to `/`), a Library link to `/library/characters`, a preferences menu, and the account actions. The preferences menu SHALL offer the theme switch, the language picker, the Roadmap link and the Privacy & cookies and Terms of use links, and SHALL NOT offer the UserJot Changelog, since the UserJot widget is not mounted outside the app shell. For a signed-out visitor the account actions SHALL be Sign in, starting the sign-in redirect, and Sign up, starting the create-account redirect (see `redirect-authentication`); for a signed-in one they SHALL be a single "Open planner" link to `/home`.

#### Scenario: Desktop top bar

- **WHEN** a signed-out visitor opens `/` at a viewport at or above 768px
- **THEN** the top bar shows the logo and name, the Library link, the preferences button, a Sign in button and a Sign up button

#### Scenario: Mobile top bar

- **WHEN** a signed-out visitor opens `/` at a viewport below 768px
- **THEN** the top bar shows the logo and name, the preferences button, the Sign in button and the Sign up button on one row without horizontal scrolling (the name truncates first), and the Library link is hidden from the top bar (the hero's secondary action and the Library section still reach it)

#### Scenario: Sign up from the top bar

- **WHEN** a signed-out visitor activates the top bar's Sign up on any public page
- **THEN** the create-account redirect starts and, once complete, follows the same return-destination rules as the top bar's Sign in

#### Scenario: Language chosen before sign-in

- **WHEN** a signed-out visitor opens the preferences menu, picks Deutsch, and closes the menu
- **THEN** the landing page re-renders in German and the choice is kept for later visits like the in-app language picker's

#### Scenario: Signed-in visitor on a public page

- **WHEN** a signed-in user opens `/privacy`
- **THEN** the top bar's account action is "Open planner" linking to `/home`, no Sign up is shown, and no sign-in is started

### Requirement: The landing hero explains the product and offers sign-in

The landing page SHALL open with a hero over datamined space art containing, in order: an eyebrow naming the planner as free and fan-made, a single `h1` headline, one sentence describing what the planner does, a primary "Get started, it's free" button that starts the same sign-in redirect as the top bar, a Sign up button that starts the same create-account redirect as the top bar's Sign up, a secondary "Browse the library" link to `/library/characters`, and three short trust points: syncs with a Tacticus API key, works on phone, open source. For a signed-in visitor the primary button SHALL instead be an "Open planner" link to `/home` and the Sign up button SHALL NOT be shown. While a sign-in interaction is in progress the primary button and the Sign up button SHALL be disabled; while a silent sign-in check is running the primary button SHALL read the existing "Account detected — signing you in…" text. A failed sign-in or sign-up redirect SHALL show the existing localized authentication error toast. The `next` destination preserved by the route guard SHALL be honoured exactly as today (see `redirect-authentication`), and sign-in or sign-up started from a bare `/` SHALL return to `/home`.

#### Scenario: Visitor starts sign-in from the hero

- **WHEN** a signed-out visitor activates "Get started, it's free"
- **THEN** the sign-in redirect starts with the app's login request and returns to `/home` once complete

#### Scenario: Visitor starts sign-up from the hero

- **WHEN** a signed-out visitor activates the hero's Sign up
- **THEN** the create-account redirect starts and returns to `/home` once complete

#### Scenario: Signed-in visitor

- **WHEN** a signed-in visitor views the landing page
- **THEN** the primary action is an "Open planner" link to `/home` and no Sign up button is shown

#### Scenario: Silent sign-in in progress

- **WHEN** the silent sign-in check is running as the landing page renders
- **THEN** the primary button reads "Account detected — signing you in…" and the Sign up button stays available

#### Scenario: Mobile hero keeps the call to action above the fold

- **WHEN** a signed-out visitor opens `/` at a 390 x 844 viewport
- **THEN** the headline, the primary button and the Sign up button are visible without scrolling and no content touches the top edge of the viewport
