## MODIFIED Requirements

### Requirement: The Raid Bosses list shows Bosses and Primes as two sections

The `/library/raid-bosses` page SHALL be a public season-reference landing view
for anonymous and signed-in users alike, without depending on signed-in user
data. It SHALL let the user choose from the served season rotation and present
the selected season's encounters by rarity tier and set. Each encounter card
SHALL show the entity's resolved name and round portrait, with a readable
initials badge when no portrait asset resolves.

The season board SHALL list tiers from highest to lowest. Within each tier it
SHALL list every served set in descending set number; within a set it SHALL
preserve the authored encounter order, including the Crystal prime(s) and boss.
Selecting any card SHALL open that entity's detail view. The detail view SHALL
continue to expose a way to navigate every boss and prime as an entity in its
own right; selecting a prime is not restricted to a sub-view of its boss.
When a detail's field-enemy list resolves an enemy portrait through its quest
unit or NPC mapping, it SHALL show that portrait; otherwise it SHALL show a
readable badge or name and never a broken image.

#### Scenario: Selected season renders as a tier and set board

- **WHEN** an anonymous user opens `/library/raid-bosses` after a dataset with
  rotation entries, tiers, and sets has synced
- **THEN** the default selected season is the first valid ID in
  `seasonConfigRotation`, tiers appear from highest to lowest, each tier's sets
  appear from highest set number to lowest, and each set presents its authored
  boss and Crystal encounters in encounter order with names and portraits or
  initials fallbacks

#### Scenario: User changes the selected season

- **WHEN** the user chooses another served season
- **THEN** the board updates to that season's tiers and sets and the URL records
  that season so reloading, sharing the link, and browser back/forward restore
  it

#### Scenario: Selecting a season-board encounter opens its entity detail

- **WHEN** the user activates a boss or prime card in a selected season's set
- **THEN** the app opens `/library/raid-bosses/{unitSetId}` with that encounter's
  season, tier, set, and encounter context preserved and shows that entity's
  detail

#### Scenario: Detail navigation keeps entities independently browsable

- **WHEN** the user opens a boss or prime detail, including from a direct link
- **THEN** they can select any served boss or prime and the selected entity opens
  as a first-class detail view

#### Scenario: Both sections render

- **WHEN** an anonymous user opens a valid entity detail after the dataset has
  synced
- **THEN** the all-entity navigation presents every served boss and every served
  prime with its resolved portrait or initials fallback

#### Scenario: Selecting an entity opens its detail

- **WHEN** the user activates an entity from the detail's all-entity navigation
- **THEN** the app opens that entity's detail route and clears any exact
  season-board encounter context from the previous entity

#### Scenario: Primes are browsable in their own right

- **WHEN** the user selects a prime from the all-entity navigation
- **THEN** its detail opens as a first-class entity, using direct-link fallback
  behavior unless the user selected it from a season-board card

#### Scenario: Field enemies show an icon

- **WHEN** the detail's field-enemy list renders an enemy whose portrait
  resolves through its quest unit or NPC mapping
- **THEN** that enemy shows its portrait; an enemy with no resolvable asset
  shows a badge or plain name and never a broken image

#### Scenario: A season is structurally unavailable

- **WHEN** the synced dataset has no valid season in its rotation or no season
  payload for the selected ID
- **THEN** the page shows an explicit no-season-reference state rather than an
  empty or broken board

### Requirement: Route selection follows the shared Library contract

The raid-boss route SHALL be a deliberate exception to the generic
`library-entity-routes` bare-collection canonicalization: opening
`/library/raid-bosses` with a usable dataset SHALL retain the collection URL and
render the season reference rather than replace it with an entity path. Its
selected season is URL-backed as `season`; a missing or invalid season SHALL
fall back to the first valid ID in the served `seasonConfigRotation`. Secondary
query parameters unrelated to encounter context SHALL be preserved across
season changes and entity navigation.

An entity route SHALL use its `:entityId` path only when it matches a synced
boss or prime. An unknown entity id SHALL fall back to the season-reference
landing view, preserving a valid selected season rather than rendering a broken
detail or silently selecting an unrelated entity.

#### Scenario: Bare collection URL canonicalizes

- **WHEN** a user opens `/library/raid-bosses` with a populated dataset
- **THEN** the URL remains the collection route, the season reference renders,
  and the URL carries the default season only when needed to represent a
  non-default user choice

#### Scenario: Invalid selected season falls back predictably

- **WHEN** a user opens `/library/raid-bosses?season=missing` and the first
  served rotation entry is `guild_boss_season_config_1`
- **THEN** the board renders `guild_boss_season_config_1` and the URL is
  canonicalized to that valid selection

#### Scenario: Unknown entity id falls back

- **WHEN** a user opens `/library/raid-bosses/not-a-real-id?season=valid-season`
- **THEN** the app renders the season reference for `valid-season` instead of an
  empty detail or the first entity's detail

## ADDED Requirements

### Requirement: Season-board navigation preserves an exact encounter context

An entity detail reached from the season board SHALL validate the complete
encounter context carried in its query parameters: the season exists, the tier
exists in that season, the set exists in that tier, the encounter exists in that
set, and the encounter's unit-set ID equals the path entity ID. For valid
context, the detail SHALL use that exact encounter and containing set to show
field enemies, associated Crystal primes, modifiers, adjusted values, and its
initial progression step. The initial step SHALL be the encounter progression
index converted from its 1-based value to the entity's 0-based ladder and
clamped to the ladder's available range.

Direct entity URLs and entity navigation that do not retain a complete valid
context SHALL preserve the existing representative-encounter behavior: choose
the encounter appropriate to the viewed progression step across the served
catalog, and choose the highest known progression step as the initial value.
Invalid or incomplete context SHALL be ignored as a group; it SHALL never mix
parts of two encounters or make an unrelated encounter appear exact.

#### Scenario: Boss detail uses the selected set's primes and enemies

- **WHEN** a player opens a boss from season S, tier 4, set 3, encounter 1 and
  that set contains two Crystal encounters
- **THEN** the detail's Prime Modifiers and adjusted-stats panels use those two
  Crystal encounters, its field-enemy list uses the selected boss encounter,
  and the initial progression step is that encounter's progression step

#### Scenario: Prime detail uses its selected Crystal encounter

- **WHEN** a player opens a Crystal prime from a season-board set
- **THEN** its Modifiers panel and initial progression step use that exact
  Crystal encounter rather than another appearance of the same prime

#### Scenario: Tampered encounter context falls back safely

- **WHEN** a shared detail URL names a real entity but its `encounter` points to
  a different unit or its `tier` and `set` do not exist in the named season
- **THEN** the detail remains usable and uses the representative-encounter
  behavior with no partial exact-context state

## MODIFIED Requirements

### Requirement: Desktop and mobile present distinct layouts

The page SHALL render the season reference and entity detail in platform-
appropriate forms at the existing 768px breakpoint. On desktop, the season
reference SHALL provide a compact season selector followed by tier sections in
which each set's encounter cards remain visually grouped as a horizontal
encounter row. On mobile, it SHALL provide the same selector and all tiers and
sets in a single-column scrollable sequence with touch-sized encounter cards;
no encounter may become unreachable through horizontal overflow alone.

The desktop entity detail SHALL retain its adjacent all-entity navigation and
side-by-side detail layout. The mobile entity detail SHALL retain its stacked,
touch-oriented form and use the grouped searchable entity picker introduced by
the companion mobile-picker change when that change is present. Both platforms
expose the same season selection, season-board cards, and contextual detail
behavior.

#### Scenario: Desktop season reference

- **WHEN** the page renders at a viewport at or above 768px
- **THEN** the desktop season selector and horizontally grouped encounter rows
  render, while an entity detail keeps its desktop navigation and detail layout

#### Scenario: Mobile season reference

- **WHEN** the page renders below 768px
- **THEN** every tier and set is reachable in the vertical page flow using
  touch-sized cards, while an entity detail uses its compact stacked form

#### Scenario: Desktop layout

- **WHEN** the page renders at a viewport at or above 768px
- **THEN** it uses the desktop season board on the bare route and the desktop
  all-entity navigation and side-by-side detail layout on an entity route

#### Scenario: Mobile layout

- **WHEN** the page renders below 768px
- **THEN** it uses the vertically reachable season board on the bare route and
  the compact, touch-oriented entity detail form on an entity route

### Requirement: The page has an onboarding tour covering both platforms

The page SHALL register a Joyride tour via `useTourPageSteps` with a co-located
tutorial hook exposing desktop and mobile step sets, targeting present
`data-testid` selectors with title and content sourced from
`tour.raidBosses.steps.*` keys in every supported locale. On the season-
reference landing view the tour SHALL cover choosing a season and reading the
tier/set encounter board. On an entity detail it SHALL cover entity navigation,
the progression step control, and the encounter-modifiers and adjusted-stats
areas. A route-specific tour step set SHALL not target elements absent from the
currently rendered landing or detail view.

#### Scenario: Tour runs on the season reference on both platforms

- **WHEN** a user starts the page tour on `/library/raid-bosses` at a viewport
  at or above 768px and again below 768px
- **THEN** the applicable tour steps target the visible season selector and
  season board with localized copy

#### Scenario: Tour runs on an entity detail on both platforms

- **WHEN** a user starts the page tour on a valid raid-boss entity route at a
  viewport at or above 768px and again below 768px
- **THEN** the applicable tour steps target only visible detail-navigation,
  progression, modifier, and adjusted-stats controls with localized copy

#### Scenario: Tour runs on desktop and mobile

- **WHEN** a user starts the tour on the season-reference landing and on a
  valid entity detail at a viewport at or above 768px and again below 768px
- **THEN** each route and platform supplies only localized steps anchored to
  elements currently present in that form
