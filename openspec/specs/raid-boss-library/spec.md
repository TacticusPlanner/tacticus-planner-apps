# raid-boss-library Specification

## Purpose

Defines the `/library/raid-bosses` experience: a public Library page listing every raid boss and raid-boss prime in two sections, and a per-entity detail view showing progression-stepped stats, weapons, abilities, traits, field enemies, and encounter modifiers — the V2 re-implementation of V1's `learn/guildBosses` list plus `learn/guildBossDetail`, redesigned for desktop and mobile.

## Requirements

### Requirement: The Raid Bosses list shows Bosses and Primes as two sections

The `/library/raid-bosses` page SHALL render two labelled sections — **Bosses** and **Primes** — each listing its entities in the catalog's served order, showing each entity's resolved portrait and resolved name. The portrait is the round portrait resolved from the entity's `unitSetId` (see `raid-boss-catalog`); when no portrait asset resolves, a readable initials badge is shown in its place. It is a public page: it SHALL render for anonymous and signed-in users alike, without gating behind authentication, and SHALL not depend on any signed-in user data.

#### Scenario: Both sections render

- **WHEN** an anonymous user opens `/library/raid-bosses` after the dataset has synced
- **THEN** a Bosses section and a Primes section are shown, each populated with the served entities in order, each entity showing its portrait or an initials-badge fallback

#### Scenario: Selecting an entity opens its detail

- **WHEN** the user activates a boss or prime entry in either section
- **THEN** the app navigates to `/library/raid-bosses/{unitSetId}` and the detail view for that entity is shown

#### Scenario: Primes are browsable in their own right

- **WHEN** the user selects a prime from the Primes section
- **THEN** its detail view opens the same way a boss's does — primes are first-class entities, not a sub-view of a boss

#### Scenario: Field enemies show an icon

- **WHEN** the detail's field-enemy list renders an enemy whose portrait resolves (via `questUnitId` or the npc portrait map)
- **THEN** that enemy is shown with its portrait icon; an enemy with no resolvable asset shows a badge or plain name, never a broken image

### Requirement: Route selection follows the shared Library contract

The page SHALL honor `library-entity-routes`: opening `/library/raid-bosses` with a populated dataset canonicalizes to the first available entity's URL; secondary query parameters are preserved across selection and clear; browser back/forward and shared links resolve selection from the path. A `unitSetId` in the path that matches no synced entity SHALL fall back to the first available entity rather than showing a broken detail view.

#### Scenario: Bare collection URL canonicalizes

- **WHEN** a user opens `/library/raid-bosses` and the dataset has entities
- **THEN** the URL is replaced with `/library/raid-bosses/{firstEntityId}`

#### Scenario: Unknown entity id falls back

- **WHEN** a user opens `/library/raid-bosses/not-a-real-id`
- **THEN** the page selects the first available entity instead of rendering an empty detail

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

The page SHALL implement an orchestrator that renders a desktop layout at ≥768px and a mobile layout below 768px. Desktop: the list as a portrait grid with the detail beside it (or on its own route view) using side-by-side stat and ability panels and a step selector. Mobile: the list as stacked sections; the detail as stacked cards with collapsible ability/trait/encounter groups and a compact progression stepper. Both layouts expose the same data and selection behavior.

#### Scenario: Desktop layout

- **WHEN** the page renders at a viewport ≥768px
- **THEN** the desktop layout is used, with the stat and ability panels laid out side by side and a step selector control

#### Scenario: Mobile layout

- **WHEN** the page renders at a viewport below 768px
- **THEN** the mobile layout is used, with stacked cards, collapsible groups, and a progression stepper, and touch targets sized for tapping

### Requirement: Loading, dataset-absent, and failure states are distinct

The page SHALL distinguish: the dataset still syncing (loading indicator), the dataset never synced / unavailable (a feature-unavailable message consistent with the other Library collections' empty state), a load/sync failure (an error state with a retry affordance), and a synced dataset with a valid selection (the content). It SHALL NOT show an empty grid or a broken detail while any of the non-content states apply.

#### Scenario: Loading

- **WHEN** the page opens before the `raid-bosses` dataset has finished syncing
- **THEN** a loading state is shown until the data resolves

#### Scenario: Dataset unavailable

- **WHEN** the `raid-bosses` dataset is absent from the client catalog
- **THEN** the page shows a feature-unavailable message rather than an empty Bosses/Primes grid

#### Scenario: Sync failure

- **WHEN** the `raid-bosses` dataset fails to load
- **THEN** the page shows an error state with a way to retry

### Requirement: The page has an onboarding tour covering both platforms

The page SHALL register a Joyride tour via `useTourPageSteps` with a co-located tutorial hook exposing desktop and mobile step sets, targeting `data-testid` selectors, with step title/content sourced from `tour.raidBosses.steps.*` i18n keys present in every supported locale. The tour SHALL cover choosing an entity, the section split (Bosses vs Primes), the progression step control, and the encounter-modifiers area.

#### Scenario: Tour runs on desktop and mobile

- **WHEN** a user starts the page tour at a viewport ≥768px and again below 768px
- **THEN** the platform-appropriate step set runs, each step anchored to a present element, with localized copy
