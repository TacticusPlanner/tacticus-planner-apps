# landing-page Specification

## Purpose

Defines what a signed-out visitor sees on the landing page at `/`, the public top bar and footer it shares with other public pages, and the actions each offers, so a first-time visitor can tell what the planner does, start sign-in, browse the Library, and find who runs it before creating an account.

## Requirements

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

### Requirement: The footer carries the disclaimer and project links

The footer SHALL state that Tacticus Planner is an unofficial fan project not affiliated with Snowprint Studios or Games Workshop, and SHALL link to the project's Discord invite, the TacticusPlanner GitHub organization and the public UserJot feedback board (each opening in a new tab), and to `/privacy` (labelled "Privacy & cookies") and `/terms` ("Terms of use"), both in the same tab. Outside production builds it SHALL also link to `/ui-kit`. It SHALL NOT embed the UserJot widget or any other feedback entry point.

#### Scenario: Footer links on the landing page

- **WHEN** a signed-out visitor scrolls to the end of `/`
- **THEN** the disclaimer and the Discord, GitHub, Feedback board, Privacy & cookies and Terms of use links are present, external links open in a new tab with `rel="noopener noreferrer"`, and no UserJot launcher, toast or popup appears

#### Scenario: Production build hides the UI Kit link

- **WHEN** the landing page renders in a production build
- **THEN** the footer has no UI Kit link

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

### Requirement: Desktop shows a static example plan

At or above 768px the hero SHALL show, beside the text, a static card titled as an example of a daily plan, with three rows each made of a character portrait, a one-line goal or event label, a one-line detail and a progress bar. The card SHALL be fixed illustration content that reads no player or catalog data, and SHALL be labelled as an example so it is not mistaken for the visitor's own data. Below 768px the card SHALL NOT render.

#### Scenario: Desktop preview

- **WHEN** a signed-out visitor opens `/` at 1440px
- **THEN** the example plan card with three portrait rows is visible beside the headline

#### Scenario: Mobile hides the preview

- **WHEN** a signed-out visitor opens `/` below 768px
- **THEN** no example plan card is rendered

### Requirement: The landing page names the planning features

Below the hero the landing page SHALL show a "Plan every part of your account" section with four cards in this order, each with an in-game menu icon, a title and one sentence: Goals, Daily raids, Legendary Events, Guild raids. The cards SHALL be informational, not links, since every target requires sign-in. They SHALL lay out in four columns at desktop widths and two columns below 768px.

#### Scenario: Features listed

- **WHEN** a signed-out visitor scrolls past the hero
- **THEN** the four feature cards appear in the order Goals, Daily raids, Legendary Events, Guild raids, each with its icon

### Requirement: The landing Library section uses in-game art

The Library section SHALL show three equal-width link cards, Characters (`/library/characters`), Guild Raid Bosses (`/library/raid-bosses`) and Daily Shops (`/library/shops`), each with an in-game icon in place of a generic icon, its existing localized title and description, and a trailing arrow. Characters SHALL show a row of character portraits and Guild Raid Bosses a row of boss portraits as decorative previews. Below the cards a line SHALL link Machines of War (`/library/machines-of-war`) and NPCs (`/library/npcs`). The cards SHALL be in three columns at desktop widths and one column below 768px, with no orphaned card.

#### Scenario: Library cards link without an account

- **WHEN** a signed-out visitor activates the Guild Raid Bosses card
- **THEN** they land on `/library/raid-bosses` without being asked to sign in

#### Scenario: Remaining Library collections reachable

- **WHEN** a signed-out visitor reads the Library section
- **THEN** Machines of War and NPCs are linked beneath the cards

### Requirement: Landing art is decorative and sourced from the datamine

Every game image on the public pages SHALL be a datamined sprite served from `public/game_catalog/datamines/` through `datamineAssetUrl()`, listed in `apps/web/datamine/sprites.txt`, and SHALL be decorative (`alt=""`, or a CSS background) because each sits beside text that names it. The official Tacticus, Snowprint and Warhammer logos SHALL NOT be used. Images below the hero SHALL load lazily.

#### Scenario: Screen reader skips decorative art

- **WHEN** a screen-reader user moves through the Library section
- **THEN** each card is announced by its title and description only, with no image names

### Requirement: The document describes the planner when shared

`index.html` SHALL carry a meta description and Open Graph and Twitter title and description tags describing Tacticus Planner, so a link to the site shared in a chat app shows a title and a summary.

#### Scenario: Link preview metadata

- **WHEN** the built `index.html` is fetched
- **THEN** it contains `meta name="description"`, `og:title`, `og:description`, `og:type` and `twitter:card` tags

### Requirement: Signed-in visitors can browse the landing page

A signed-in visitor opening a bare `/` SHALL see the landing page in the public layout rather than being redirected. A signed-in visitor arriving at `/?next=…` SHALL still be sent to that destination.

#### Scenario: Bare landing address

- **WHEN** a signed-in visitor opens `/`
- **THEN** the landing page is shown with "Open planner" in the top bar and the hero

#### Scenario: Return from sign-in

- **WHEN** a signed-in visitor arrives at `/?next=%2Fplan%2Fgoals`
- **THEN** they are sent to `/plan/goals`

### Requirement: Sign-in from the landing page ends on Home

A sign-in started from a bare `/` SHALL end on `/home`, including when the identity provider's redirect returns to the site root. A sign-in started from `/?next=…` SHALL end on that destination.

#### Scenario: Get started from the landing page

- **WHEN** a signed-out visitor on `/` activates "Get started, it's free" and completes sign-in
- **THEN** they land on Home without having to choose "Open planner"
