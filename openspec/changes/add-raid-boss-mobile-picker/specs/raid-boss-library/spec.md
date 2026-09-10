## MODIFIED Requirements

### Requirement: The Raid Bosses list shows Bosses and Primes as two sections

The public **Guild Raid Bosses** Library's Details tab SHALL present the roster so that every boss and every raid-boss prime is selectable, showing each entity's resolved portrait and resolved name. The portrait is the round portrait resolved from the entity's `unitSetId` (see `raid-boss-catalog`); when no portrait asset resolves, a readable initials badge is shown in its place. It SHALL render for anonymous and signed-in users alike, without gating behind authentication, and SHALL not depend on any signed-in user data.

The presentation depends on viewport:

- **Desktop (≥768px)**: two labelled sections — **Bosses** and **Primes** — each listing its entities as a portrait grid in the catalog's served order.
- **Mobile (<768px)**: a single searchable Select (a combobox — trigger with the selected entity's portrait and name, a text search field, a scrollable grouped list). The list is grouped one group per boss, in the catalog's served boss order; each group's heading is the boss name and its members are the boss entry followed by the primes fought alongside it — the primes referenced by that boss's encounter sets' `Crystal` encounters, deduped and in encounter order. The served dataset is assumed to reference every prime through the boss(es) it fights with.

Selecting an entity in either form SHALL behave identically.

#### Scenario: Details tab shows both entity sections

- **WHEN** an anonymous user opens the Details tab at ≥768px after the `raid-bosses` dataset has synced
- **THEN** Bosses and Primes sections are shown in served order, with a portrait or readable initials fallback for every entity

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

The page SHALL render its tab control and shared route state at all viewport sizes. At ≥768px, Details keeps the two-section portrait grid beside the selected detail; Seasons Config uses a dense selectable season/tier/set presentation; Meta uses scannable boss recommendation cards and a Comp filter/guidance area. Below 768px, the tab control remains touch-accessible, Details uses a single searchable Select grouped by boss (each boss heading followed by the primes it is fought alongside) plus compact stacked detail cards, Seasons Config uses stacked expandable tier/set cards, and Meta uses stacked recommendation and Comp guidance cards. Both layouts expose the same datasets, tab state, content, and entity selection behavior.

#### Scenario: Desktop season reference

- **WHEN** the Seasons Config tab renders at a viewport at or above 768px
- **THEN** the desktop season selector and dense, horizontally grouped tier/set encounter rows render, while the Details tab retains its desktop navigation and side-by-side detail layout

#### Scenario: Mobile season reference

- **WHEN** the Seasons Config tab renders below 768px
- **THEN** every tier and set is reachable through stacked, expandable, touch-oriented cards, while the Details tab retains its searchable picker and compact form

#### Scenario: Desktop layout

- **WHEN** the page renders at a viewport ≥768px
- **THEN** the desktop layout is used, with the two-section portrait grid, the stat and ability panels laid out side by side, and a step selector control

#### Scenario: Mobile layout

- **WHEN** the page renders at a viewport below 768px
- **THEN** the mobile layout is used, with the roster as a grouped searchable Select, the detail as stacked cards with collapsible groups and a progression stepper, and touch targets sized for tapping

### Requirement: The page has an onboarding tour covering both platforms

The page SHALL register a Joyride tour via `useTourPageSteps` with localized `library` keys and targets that exist for the active tab. Every tour includes a tab-control step. The Details tour covers choosing an entity, the roster layout (the Bosses/Primes split on desktop and one grouped searchable Select on mobile), progression, encounter modifiers, and adjusted stats; the Seasons Config tour covers season selection and tier/set content; the Meta tour covers recommendations, Comp filtering, and expandable core/flex/Machine-of-War guidance. Desktop and mobile tours SHALL use platform-appropriate targets.

#### Scenario: Tour runs on the season reference on both platforms

- **WHEN** a user starts the page tour with Seasons Config active at a viewport at or above 768px and again below 768px
- **THEN** the applicable tour steps target the visible season selector and tier/set content with localized copy

#### Scenario: Tour runs on an entity detail on both platforms

- **WHEN** a user starts the page tour with Details active on a valid entity route at a viewport at or above 768px and again below 768px
- **THEN** the applicable tour steps target only visible detail navigation, progression, modifier, and adjusted-stats controls, using the two section targets on desktop and the single picker target on mobile

#### Scenario: A Details tour includes adjusted stats

- **WHEN** a user starts the tour with Details active on desktop or mobile
- **THEN** a localized step targets the present adjusted-stats area alongside the Details-specific controls

#### Scenario: A Seasons Config or Meta tour targets its active view

- **WHEN** a user starts the tour with Seasons Config or Meta active on desktop or mobile
- **THEN** every content step targets an element present in that active tab and does not point to hidden Details content

#### Scenario: Tour runs on desktop and mobile

- **WHEN** a user starts the page tour at a viewport ≥768px and again below 768px
- **THEN** the platform-appropriate step set runs, each step anchored to a present element, with localized copy — on desktop the roster steps anchor to the Bosses and Primes sections, on mobile a single roster step anchors to the searchable Select
