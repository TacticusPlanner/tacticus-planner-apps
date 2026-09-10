# raid-boss-library Specification

## Purpose

Defines the `/library/raid-bosses` experience: a public Library page listing every raid boss and raid-boss prime in two sections, and a per-entity detail view showing progression-stepped stats, weapons, abilities, traits, field enemies, and encounter modifiers — the V2 re-implementation of V1's `learn/guildBosses` list plus `learn/guildBossDetail`, redesigned for desktop and mobile.

## Requirements

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

### Requirement: The detail view shows progression-stepped stats

The detail view SHALL provide a control to choose a progression step across the entity's `statProgression`, and SHALL display for the chosen step: health, damage, fixed armor, rank, star level, base rarity, and ability level, plus block chance/damage and crit chance/damage when the data carries them. Faction and movement SHALL be shown. Changing the step SHALL update the stat block without navigation.

#### Scenario: Stat block reflects the selected step

- **WHEN** the user picks a later progression step
- **THEN** the displayed health/damage/armor and other stats update to that step's values

#### Scenario: Optional stats appear only when present

- **WHEN** a step has no crit or block values in the data
- **THEN** those rows are omitted rather than shown as zero or blank

### Requirement: The detail view shows weapons, abilities, and traits resolved from ids

The detail view SHALL render the entity's weapons as attack-profile rows (hits, damage profile, and range for ranged weapons), and its abilities and traits resolved from their ids to names. Abilities SHALL be grouped by kind — Active, Passive, Relic — each group shown only when it has an entry. An id that resolves to no player-facing game name SHALL be omitted, matching V1: the internal `GuildBossRunAway` ability and the `Boss` / `Hero` pseudo-traits do not appear. The progression stepper SHALL also show the selected step's base rarity and star level.

Each shown ability and trait SHALL also render its rules-text when the catalog resolves one, per the **detail view renders ability and trait rules-text scaled to the step** requirement.

#### Scenario: Ranged and melee weapons

- **WHEN** the entity has a ranged weapon and a melee weapon
- **THEN** the ranged weapon's row shows its range and the melee weapon's row does not

#### Scenario: Abilities are grouped and internal ids hidden

- **WHEN** an entity's ability ids include `GuildBossRunAway` alongside real abilities
- **THEN** the abilities are shown under Active / Passive / Relic headings and `GuildBossRunAway` is not rendered

#### Scenario: Prime names resolve from the character roster

- **WHEN** a prime's unit-set id maps to a playable character (e.g. `GuildBoss4MiniBoss1OrksBigMek`)
- **THEN** the list and detail show that character's name ("Gibbascrapz"), falling back to the id-keyed i18n name for primes that are not playable characters

### Requirement: The detail view renders ability and trait rules-text scaled to the step

For each ability shown in the detail's ability panel, the view SHALL render the ability's description text with its embedded variable and constant tokens resolved to the values for the currently selected progression step (the step's ability level indexes the per-level variable arrays). Changing the progression step SHALL update the rendered numbers without navigation. Stat and damage-type tokens in the text SHALL be presented distinctly from the surrounding prose (as V1 styles them), but a plain-text rendering that still substitutes the values is acceptable.

Traits SHALL render their rules-text the same way where the catalog resolves one; a trait id that resolves to a name but no text SHALL continue to show the name only. An ability id that resolves to no description SHALL show its name only, with no empty text block.

The description strings are game data resolved from the ability/trait id (English only, consistent with the existing `raidBossAbilities` / `raidBossTraits` namespaces); the served `raid-bosses` dataset carries ids only.

#### Scenario: Ability text scales with the step

- **WHEN** the user selects a higher progression step for an entity whose ability description contains a level-scaled variable
- **THEN** the rendered ability text shows the value for that step's ability level, and reverts when a lower step is selected

#### Scenario: Ability with no description

- **WHEN** a shown ability id resolves to a name but no description text
- **THEN** only the ability name is shown, with no empty description area

#### Scenario: Trait text when resolved

- **WHEN** a trait id resolves to both a name and rules-text
- **THEN** the trait shows its name and the rules-text; a trait that resolves to a name only shows just the name

### Requirement: The detail view shows field enemies and prime modifiers

For the selected entity at the viewed progression step, the detail view SHALL resolve a representative encounter (exact step match, else the nearest lower step, else any) and show its field enemies, with each `fieldNpcId` resolved to an npc name by fuzzy-matching the `npcs` catalog dataset on the faction abbreviation (falling back to a humanized token). It SHALL then show a modifier section:

- for a **boss**: a **Prime Modifiers** panel listing the primes fought alongside it in that encounter's set (its two `Crystal` encounters), each with its prime name and its modifier list;
- for a **prime**: a **Modifiers** panel listing its own modifiers.

Each modifier row SHALL show its activation threshold (`hpLost`, as a percentage) and its effect: a genuine stat-percent or flat-stat decrease renders with its value (`−15% dmg`, `−1 movement`); every other modifier type — which scales an ability's internal variables by an amount that is only meaningful once the full modifier math is applied — renders as a direction plus target only (`Reduces Massive Scything Talons`). Turning those definitions into concrete adjusted values is covered by the **detail view previews stats adjusted by active modifiers** requirement.

#### Scenario: Prime modifiers for a boss

- **WHEN** a boss is selected and its set has two `Crystal` prime encounters
- **THEN** the Prime Modifiers panel lists each prime by name with its modifiers, ordered by `hpLost`

#### Scenario: Modifier effect rendering

- **WHEN** a modifier is a `bossStatPctDecrease` of `dmg` by 15 and another is a `bossAbilityAllStatsPctDecrease` of `MassiveScythingTalons`
- **THEN** the first renders as `−15% dmg` and the second as `Reduces Massive Scything Talons` (no raw amount)

#### Scenario: Entity with no encounter data

- **WHEN** the selected entity has no season encounter referencing it
- **THEN** the modifier section shows an explicit "no encounter data" state, not an empty gap

### Requirement: The detail view previews stats adjusted by active modifiers

The detail view SHALL let the user choose an HP-lost point across the resolved encounter's modifier schedule — `0` (full HP) plus each modifier's activation threshold — and SHALL show, for the modifiers active at or below that point:

- the boss's or prime's **stat block** with each affected stat recomputed (percentage and flat `bossStat*Decrease` modifiers summed additively per stat, applied as `round(base × (1 + pct/100) + flat)`, clamped at 0), shown alongside its unadjusted value;
- **ability variables and constants** for each affected ability recomputed by the same additive rule (`bossAbilityAllStatsPctDecrease` applies to every variable of its target ability; per-variable percent and flat modifiers apply to the named variables), clamped at 0;
- the **field-enemy list** with `unitAmountDecrease` removals applied (up to N copies of each targeted unit-set id removed, progression suffix ignored for matching), noting how many of which enemy were removed.

The modifier thresholds SHALL be rescaled to the currently displayed total HP so the schedule stays proportional to the selected progression step and the final threshold lands exactly at 0 HP remaining. When no modifiers are active at the chosen point (including the `0` / full-HP point), the adjusted values SHALL equal the base values. When the entity has no resolved encounter, the adjusted-stats view SHALL NOT render.

#### Scenario: Stats recompute at an HP-lost point

- **WHEN** the user moves the HP-lost control to a point where a `bossStatPctDecrease` of `dmg` by 45 and a `bossStatDecrease` of `movement` by 1 are active
- **THEN** the damage row shows `round(baseDamage × 0.55)` next to the base damage and the movement row shows `base − 1`, and stats with no active modifier are unchanged

#### Scenario: Full-HP point shows base values

- **WHEN** the HP-lost control is at `0` (full HP)
- **THEN** every adjusted value equals its base value

#### Scenario: Enemy removals applied

- **WHEN** a `unitAmountDecrease` modifier targeting a field npc is active and the encounter lists two copies of that npc
- **THEN** the adjusted enemy list shows one copy and a note that one was removed

#### Scenario: Desktop shows both sides, mobile one panel

- **WHEN** the page renders at ≥768px
- **THEN** the adjusted-stats view shows a panel per fight side / prime, each with its own HP-lost slider
- **WHEN** the page renders below 768px
- **THEN** a single panel with an HP-lost stepper is shown, with a toggle that reveals the adjusted values inline in the stat list

### Requirement: The page tour covers the adjusted-stats view

The page's Joyride tour (desktop and mobile step sets) SHALL include a step anchored to the adjusted-stats area, with title/content sourced from `tour.raidBosses.steps.*` i18n keys present in every supported locale.

#### Scenario: Tour includes the adjusted-stats step

- **WHEN** a user runs the page tour on desktop and again on mobile
- **THEN** a step anchored to a present element in the adjusted-stats area runs on each platform with localized copy

### Requirement: Desktop and mobile present distinct layouts

The page SHALL render its tab control and shared route state at all viewport
sizes. At ≥768px, Details keeps the portrait list beside the selected detail;
Seasons Config uses a dense selectable season/tier/set presentation; Meta uses
scannable boss recommendation cards and a Comp filter/guidance area. Below
768px, the tab control remains touch-accessible, Details uses the existing
compact card form and mobile entity picker, Seasons Config uses stacked
expandable tier/set cards, and Meta uses stacked recommendation and Comp
guidance cards. Both layouts expose the same datasets, tab state, and content.

#### Scenario: Desktop season reference

- **WHEN** the Seasons Config tab renders at a viewport at or above 768px
- **THEN** the desktop season selector and dense, horizontally grouped
  tier/set encounter rows render, while the Details tab retains its desktop
  navigation and side-by-side detail layout

#### Scenario: Mobile season reference

- **WHEN** the Seasons Config tab renders below 768px
- **THEN** every tier and set is reachable through stacked, expandable,
  touch-oriented cards, while the Details tab retains its compact form

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

#### Scenario: Tour runs on the season reference on both platforms

- **WHEN** a user starts the page tour with Seasons Config active at a
  viewport at or above 768px and again below 768px
- **THEN** the applicable tour steps target the visible season selector and
  tier/set content with localized copy

#### Scenario: Tour runs on an entity detail on both platforms

- **WHEN** a user starts the page tour with Details active on a valid entity
  route at a viewport at or above 768px and again below 768px
- **THEN** the applicable tour steps target only visible detail navigation,
  progression, modifier, and adjusted-stats controls with localized copy

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
