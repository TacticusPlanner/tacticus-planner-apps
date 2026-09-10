## MODIFIED Requirements

### Requirement: The Raid Bosses list shows Bosses and Primes as two sections

The public **Guild Raid Bosses** Library SHALL render a tab control with
**Seasons Config**, **Meta**, and **Boss / Prime Details** views. The Details
tab SHALL render two labelled sections—**Bosses** and **Primes**—each listing
its entities in catalog served order with a resolved portrait and name. The
portrait is the round portrait resolved from `unitSetId` (see
`raid-boss-catalog`); when no portrait resolves, a readable initials badge is
shown. The Library remains available to anonymous and signed-in users and
shall not depend on signed-in user data.

#### Scenario: Details tab shows both entity sections

- **WHEN** an anonymous user opens the Details tab after the `raid-bosses`
  dataset has synced
- **THEN** Bosses and Primes sections are shown in served order, with a
  portrait or readable initials fallback for every entity

#### Scenario: Both sections render

- **WHEN** an anonymous user opens `/library/raid-bosses` after the dataset has
  synced
- **THEN** a Bosses section and a Primes section are shown in the Details tab,
  each populated with served entities in order and a portrait or initials-badge
  fallback

#### Scenario: Selecting an entity opens its detail

- **WHEN** the user activates a boss or prime entry in the Details tab
- **THEN** the app navigates to `/library/raid-bosses/{unitSetId}` while
  retaining the Details tab and shows that entity's detail

#### Scenario: Primes are browsable in their own right

- **WHEN** the user selects a prime from the Details tab
- **THEN** its detail opens the same way as a boss detail; primes remain
  first-class entities rather than a sub-view of a boss

#### Scenario: Field enemies show an icon

- **WHEN** the selected detail's field-enemy list renders an enemy whose
  portrait resolves through `questUnitId` or the npc portrait map
- **THEN** that enemy shows its portrait; an unresolved asset renders a badge
  or plain name, never a broken image

### Requirement: Route selection follows the shared Library contract

The page SHALL honor `library-entity-routes` and expose the selected tab in
the `tab` query parameter: `details`, `seasons`, or `meta`. Missing or
unrecognized values default to `details`. The selected `unitSetId` remains
path-backed and is preserved while switching tabs, even where Seasons Config
or Meta does not use it directly, so returning to Details restores the
selection. Opening a bare collection URL with a populated `raid-bosses`
dataset canonicalizes to the first available entity URL; unknown entity ids
fall back to that first entity. Browser history and shared links SHALL restore
both selection and tab state.

The Seasons Config tab SHALL store its selected season in `season`; it
defaults to the first `seasonConfigRotation` id and an unknown season falls
back to that id. The Meta tab SHALL store its optional Comp filter in `comp`;
an unknown Comp id clears the filter. `season` and `comp` remain in the URL
when switching tabs so a user can return to the previous view without losing
its selection/filter.

#### Scenario: A shared Meta link restores Meta

- **WHEN** a user opens `/library/raid-bosses/{unitSetId}?tab=meta&comp={compId}`
  with valid synced datasets
- **THEN** the Meta tab is active, the matching Comp filter is applied, and
  switching back to Details retains `{unitSetId}`

#### Scenario: Bare collection URL canonicalizes to Details

- **WHEN** a user opens `/library/raid-bosses` and the raid-boss dataset has
  entities
- **THEN** the URL is replaced with
  `/library/raid-bosses/{firstEntityId}` and Details is the active tab

#### Scenario: Bare collection URL canonicalizes

- **WHEN** a user opens `/library/raid-bosses` and the dataset has entities
- **THEN** the URL is replaced with `/library/raid-bosses/{firstEntityId}` and
  Details is the active tab

#### Scenario: Unknown URL state is repaired

- **WHEN** a user opens the page with an unknown entity id, tab, season, or
  Comp id
- **THEN** the page uses the defined defaults, replaces invalid selection state
  in the URL, and renders no broken view

#### Scenario: Unknown entity id falls back

- **WHEN** a user opens `/library/raid-bosses/not-a-real-id`
- **THEN** the page selects the first available entity instead of rendering an
  empty Details view

### Requirement: Desktop and mobile present distinct layouts

The page SHALL render its tab control and shared route state at all viewport
sizes. At ≥768px, Details keeps the portrait list beside the selected detail;
Seasons Config uses a dense selectable season/tier/set presentation; Meta uses
scannable boss recommendation cards and a Comp filter/guidance area. Below
768px, the tab control remains touch-accessible, Details uses the existing
compact card form and mobile entity picker, Seasons Config uses stacked
expandable tier/set cards, and Meta uses stacked recommendation and Comp
guidance cards. Both layouts expose the same datasets, tab state, and content.

#### Scenario: Desktop layout

- **WHEN** the page renders at a viewport ≥768px
- **THEN** the desktop tab layout is used, with the Details side-by-side view
  and dense season/Meta forms appropriate to the wider viewport

#### Scenario: Mobile layout

- **WHEN** the page renders at a viewport below 768px
- **THEN** the mobile tab layout uses touch-sized controls, the mobile entity
  picker in Details, and stacked/expandable season and Meta content

### Requirement: Loading, dataset-absent, and failure states are distinct

The page SHALL distinguish a `raid-bosses` dataset still syncing, absent, or
failed from a valid selected entity. It SHALL not show an empty Details or
Seasons Config view while a required raid-boss state is unresolved. Meta has
independent states: while `guild-raid-meta` is syncing, the Meta tab shows a
loading state; when it is absent or fails, the Meta tab shows an explicit
Meta-unavailable state with retry where applicable while Details and Seasons
Config remain usable; and when it is valid but lacks a particular boss group,
Meta shows an explicit no-recommendation state for that boss or filter.

#### Scenario: Core raid-boss data is unavailable

- **WHEN** the `raid-bosses` dataset is absent or fails to load
- **THEN** the page shows the corresponding feature-unavailable or retry-able
  state instead of broken Details or Seasons Config content

#### Scenario: Loading

- **WHEN** the page opens before the `raid-bosses` dataset has finished
  syncing
- **THEN** a loading state is shown until the data resolves

#### Scenario: Dataset unavailable

- **WHEN** the `raid-bosses` dataset is absent from the client catalog
- **THEN** the page shows a feature-unavailable message rather than empty
  Details or Seasons Config content

#### Scenario: Sync failure

- **WHEN** the `raid-bosses` dataset fails to load
- **THEN** the page shows an error state with a way to retry

#### Scenario: Meta data is independently unavailable

- **WHEN** `raid-bosses` is valid but `guild-raid-meta` is absent or fails
- **THEN** Details and Seasons Config remain available and the Meta tab clearly
  explains that Meta recommendations are unavailable

#### Scenario: A valid Meta filter has no recommendation

- **WHEN** Meta data is valid and the selected Comp matches no recommendation
- **THEN** the Meta tab shows a no-results state without treating the dataset
  as failed or unavailable

### Requirement: The page has an onboarding tour covering both platforms

The page SHALL register a Joyride tour via `useTourPageSteps` with localized
`library` keys and targets that exist for the active tab. Every tour includes a
tab-control step. The Details tour covers choosing an entity, Bosses vs
Primes, progression, encounter modifiers, and adjusted stats; the Seasons
Config tour covers season selection and tier/set content; the Meta tour covers
recommendations, Comp filtering, and expandable core/flex/Machine-of-War
guidance. Desktop and mobile tours SHALL use platform-appropriate targets.

#### Scenario: A Details tour includes adjusted stats

- **WHEN** a user starts the tour with Details active on desktop or mobile
- **THEN** a localized step targets the present adjusted-stats area alongside
  the Details-specific controls

#### Scenario: A Seasons Config or Meta tour targets its active view

- **WHEN** a user starts the tour with Seasons Config or Meta active on
  desktop or mobile
- **THEN** every content step targets an element present in that active tab and
  does not point to hidden Details content

#### Scenario: Tour runs on desktop and mobile

- **WHEN** a user starts the page tour at a viewport ≥768px and again below
  768px
- **THEN** the platform-appropriate active-tab step set runs, each step anchors
  to a present element, and every step has localized copy

## ADDED Requirements

### Requirement: Seasons Config displays the catalog's raid rotation

The Seasons Config tab SHALL render the ordered `seasonConfigRotation` from
the existing `raid-bosses` catalog data. For its selected season, it SHALL
show ordered tiers and sets, each set's chest id and guild XP, and its ordered
encounters with resolved boss/prime names and portraits. An encounter lacking
a resolvable portrait SHALL use the normal readable fallback.

#### Scenario: A season configuration is selected

- **WHEN** a user selects a season from the rotation
- **THEN** the tab updates to that season's tiers, sets, rewards, and
  encounters and the selected season is reflected in the URL

### Requirement: Meta shows exact recommendations and expandable Comp guidance

The Meta tab SHALL render authored Meta and alternate recommendations grouped
by Guild Raid Boss. A recommendation SHALL show five ordered hero portraits
and names, one Machine-of-War portrait and name, its Comp badges, the
curated-data update date, and source attribution. A missing image SHALL use
the normal readable fallback.

The tab SHALL expose an optional Comp filter. It SHALL show the matching boss
recommendation when any of that recommendation's Comp ids matches the filter.
It SHALL also render expandable guidance for each displayed Comp, with its
signature, core heroes, flex heroes, and suitable Machines of War. Expanding
or collapsing guidance does not change the URL or filter.

#### Scenario: A player examines a Meta team

- **WHEN** a boss has a Meta recommendation with five heroes, one Machine of
  War, and linked Comps
- **THEN** the player can see the exact ordered team, the Machine of War,
  source/update attribution, and its Comp badges

#### Scenario: A player filters recommendations by Comp

- **WHEN** a player selects a Comp filter
- **THEN** only recommendations tagged with that Comp remain visible and the
  URL records the selected Comp id

#### Scenario: A player expands Comp guidance

- **WHEN** a player expands a displayed Comp's guidance
- **THEN** its signature, core heroes, flex heroes, and suitable Machines of
  War are visible in their authored order

### Requirement: Public terminology identifies Guild Raid Bosses

All user-facing Library navigation, collection, loading, unavailable,
sync-failure, Meta, season, and tour copy SHALL identify the feature as
**Guild Raid Boss** or **Guild Raid Bosses** where grammatically appropriate.
The translation resources for English, German, Spanish, and French SHALL
provide complete localized copy. Internal route paths, data keys, TypeScript
names, test ids, and API dataset identifiers remain `raid-bosses`/`RaidBoss*`.

#### Scenario: Navigation uses the public Guild Raid name

- **WHEN** a user views the Library navigation or the Guild Raid Boss Library
- **THEN** the feature is labelled Guild Raid Boss(es), not Raid Boss(es), in
  the active locale
