## MODIFIED Requirements

### Requirement: The Raid Bosses list shows Bosses and Primes as two sections

The `/library/raid-bosses` page SHALL present the roster so that every boss and every raid-boss prime is selectable, showing each entity's resolved portrait and resolved name. The portrait is the round portrait resolved from the entity's `unitSetId` (see `raid-boss-catalog`); when no portrait asset resolves, a readable initials badge is shown in its place. It is a public page: it SHALL render for anonymous and signed-in users alike, without gating behind authentication, and SHALL not depend on any signed-in user data.

The presentation depends on viewport:

- **Desktop (≥768px)**: two labelled sections — **Bosses** and **Primes** — each listing its entities as a portrait grid in the catalog's served order.
- **Mobile (<768px)**: a single searchable Select (a combobox — trigger with the selected entity's portrait and name, a text search field, a scrollable grouped list). The list is grouped one group per boss, in the catalog's served boss order; each group's heading is the boss name and its members are the boss entry followed by the primes fought alongside it — the primes referenced by that boss's encounter sets' `Crystal` encounters, deduped and in encounter order. The served dataset is assumed to reference every prime through the boss(es) it fights with.

Selecting an entity in either form SHALL behave identically.

#### Scenario: Both sections render

- **WHEN** an anonymous user opens `/library/raid-bosses` at ≥768px after the dataset has synced
- **THEN** a Bosses section and a Primes section are shown, each populated with the served entities in order, each entity showing its portrait or an initials-badge fallback

#### Scenario: Mobile shows a grouped searchable Select

- **WHEN** an anonymous user opens `/library/raid-bosses` below 768px after the dataset has synced
- **THEN** the roster is a single combobox whose list is grouped per boss, each group headed by the boss name and containing that boss followed by its primes, with a search field that filters options by name

#### Scenario: Selecting an entity opens its detail

- **WHEN** the user activates a boss or prime entry in either the desktop sections or the mobile Select
- **THEN** the app navigates to `/library/raid-bosses/{unitSetId}` and the detail view for that entity is shown

#### Scenario: Primes are browsable in their own right

- **WHEN** the user selects a prime — from the desktop Primes section or from a boss's group in the mobile Select
- **THEN** its detail view opens the same way a boss's does — primes are first-class entities, not a sub-view of a boss

#### Scenario: Field enemies show an icon

- **WHEN** the detail's field-enemy list renders an enemy whose portrait resolves (via `questUnitId` or the npc portrait map)
- **THEN** that enemy is shown with its portrait icon; an enemy with no resolvable asset shows a badge or plain name, never a broken image

### Requirement: Desktop and mobile present distinct layouts

The page SHALL implement an orchestrator that renders a desktop layout at ≥768px and a mobile layout below 768px. Desktop: the list as a two-section portrait grid with the detail beside it (or on its own route view) using side-by-side stat and ability panels and a step selector. Mobile: the list as a single searchable Select grouped by boss (each boss heading followed by the primes it is fought alongside); the detail as stacked cards with collapsible ability/trait/encounter groups and a compact progression stepper. Both layouts expose the same data and selection behavior.

#### Scenario: Desktop layout

- **WHEN** the page renders at a viewport ≥768px
- **THEN** the desktop layout is used, with the two-section portrait grid, the stat and ability panels laid out side by side, and a step selector control

#### Scenario: Mobile layout

- **WHEN** the page renders at a viewport below 768px
- **THEN** the mobile layout is used, with the roster as a grouped searchable Select, the detail as stacked cards with collapsible groups and a progression stepper, and touch targets sized for tapping

### Requirement: The page has an onboarding tour covering both platforms

The page SHALL register a Joyride tour via `useTourPageSteps` with a co-located tutorial hook exposing desktop and mobile step sets, targeting `data-testid` selectors, with step title/content sourced from `tour.raidBosses.steps.*` i18n keys present in every supported locale. The tour SHALL cover choosing an entity, the roster layout (the Bosses/Primes section split on desktop, the grouped searchable Select on mobile), the progression step control, and the encounter-modifiers area.

#### Scenario: Tour runs on desktop and mobile

- **WHEN** a user starts the page tour at a viewport ≥768px and again below 768px
- **THEN** the platform-appropriate step set runs, each step anchored to a present element, with localized copy — on desktop the roster steps anchor to the Bosses and Primes sections, on mobile a single roster step anchors to the searchable Select
