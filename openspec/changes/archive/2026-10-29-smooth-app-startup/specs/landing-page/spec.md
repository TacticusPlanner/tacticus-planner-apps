# Spec Delta

## MODIFIED Requirements

### Requirement: The landing hero explains the product and offers sign-in

The landing page SHALL open with a hero over datamined space art containing, in order: an eyebrow naming the planner as free and fan-made, a single `h1` headline, one sentence describing what the planner does, a primary "Get started, it's free" button that starts the same sign-in redirect as the top bar, a secondary "Browse the library" link to `/library/characters`, and three short trust points: syncs with a Tacticus API key, works on phone, open source. For a signed-in visitor the primary button SHALL instead be an "Open planner" link to `/home`. While a sign-in interaction is in progress the primary button SHALL be disabled; while a silent sign-in check is running it SHALL read the existing "Account detected — signing you in…" text. A failed sign-in redirect SHALL show the existing localized authentication error toast. The `next` destination preserved by the route guard SHALL be honoured exactly as today (see `redirect-authentication`), and sign-in started from a bare `/` SHALL return to `/home`.

#### Scenario: Visitor starts sign-in from the hero

- **WHEN** a signed-out visitor activates "Get started, it's free"
- **THEN** the sign-in redirect starts with the app's login request and returns to `/home` once complete

#### Scenario: Signed-in visitor

- **WHEN** a signed-in visitor views the landing page
- **THEN** the primary action is an "Open planner" link to `/home`

#### Scenario: Silent sign-in in progress

- **WHEN** the silent sign-in check is running as the landing page renders
- **THEN** the primary button reads "Account detected — signing you in…"

#### Scenario: Mobile hero keeps the call to action above the fold

- **WHEN** a signed-out visitor opens `/` at a 390 x 844 viewport
- **THEN** the headline and the primary button are visible without scrolling and no content touches the top edge of the viewport

## ADDED Requirements

### Requirement: Signed-in visitors can browse the landing page

A signed-in visitor opening a bare `/` SHALL see the landing page in the public layout rather than being redirected. A signed-in visitor arriving at `/?next=…` SHALL still be sent to that destination.

#### Scenario: Bare landing address

- **WHEN** a signed-in visitor opens `/`
- **THEN** the landing page is shown with "Open planner" in the top bar and the hero

#### Scenario: Return from sign-in

- **WHEN** a signed-in visitor arrives at `/?next=%2Fplan%2Fgoals`
- **THEN** they are sent to `/plan/goals`
