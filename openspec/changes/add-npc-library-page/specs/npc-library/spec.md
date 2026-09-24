## Purpose

Defines the public NPC Library page: how the served NPC variation records are grouped into browsable units, how a variation and level are selected and reflected in the URL, what the detail view shows for a selected level, how filters narrow both the list and the variations, and how the page behaves when data is loading, missing, filtered out, or unavailable — on desktop and on mobile.

## ADDED Requirements

### Requirement: NPC variations are grouped into one listed NPC per distinct unit

The page SHALL derive its browsable NPCs from the served `npcs` dataset by grouping records that share the same catalog `name` into one **NPC group**. Each group SHALL have a stable, URL-safe id derived from that name (lower-case, non-alphanumerics collapsed to `-`), which is the group's identity in the Library route. Each record in a group is a **variation**, identified by its served `id`. A group SHALL be listed only when at least one of its variations is available (see the availability requirement). Grouping SHALL NOT merge, sort, or de-duplicate the variations' stat ladders — each variation keeps its own ladder.

#### Scenario: Five Makhotep records become one listed NPC

- **WHEN** the dataset contains `necroNpcWarden`, `necroBossWarden`, `necroBossWardenLHE`, `necroBossWardenLEG`, and `necroBossC1Warden`, all named `Makhotep`
- **THEN** the list shows a single NPC `Makhotep` with group id `makhotep` and five variations

#### Scenario: Group id round-trips in the route

- **WHEN** a user opens `/library/npcs/makhotep`
- **THEN** the page selects the `Makhotep` group

#### Scenario: Variation ladders are kept apart

- **WHEN** `admecNpc1Vanguard` and `admecNpc1VanguardSurv` both carry a row at rank 17 / 11 stars with different health values
- **THEN** selecting each variation shows its own health for that row; the two rows are never combined into one ladder

### Requirement: Only regular units with a usable ladder are listed

The page SHALL list only records whose served `kind` is `unit`. Records with `kind` `machineOfWar` or `object` SHALL NOT appear as NPCs or variations. A variation SHALL be **unavailable** when every row of its stat ladder has `health`, `armour`, and `damage` all equal to `0`; unavailable variations SHALL NOT be offered in the Variation selector. A group whose variations are all unavailable SHALL NOT be listed.

#### Scenario: Machines of War are excluded

- **WHEN** the dataset contains `deathNpcMoWCrawler` with `kind` `machineOfWar`
- **THEN** no NPC named `Crawler` appears in the list, and no variation `deathNpcMoWCrawler` is selectable

#### Scenario: Loot objects are excluded

- **WHEN** the dataset contains `LootObj_AmmoBox` with `kind` `object`
- **THEN** it does not appear in the list

#### Scenario: All-zero variation is hidden but the NPC stays listed

- **WHEN** an NPC group has one variation whose every stat row is all zeros and one variation with non-zero rows
- **THEN** the NPC is listed and only the non-zero variation is offered

#### Scenario: NPC with only all-zero variations is not listed

- **WHEN** `genesDecoy` has `kind` `unit` and every stat row is all zeros and it is the only variation of its group
- **THEN** the group is not listed and `/library/npcs/decoy` is canonicalized to the first listed NPC per the shared Library route contract

### Requirement: The route carries the NPC group and the query carries variation and level

The page SHALL use `/library/npcs/{groupId}` as the entity route under the shared Library route contract, with `variation` (a variation id) and `level` (a zero-based integer index into the selected variation's served stat ladder, in served order) as secondary query parameters. Opening a URL SHALL restore all three. Selecting a different NPC SHALL navigate to that group's URL and drop `variation` and `level`. Changing the variation SHALL replace `variation` and drop `level`. Changing the level SHALL replace `level`. Browser back/forward SHALL restore the selection encoded in the URL reached.

When `variation` is absent or names a variation that is not in the selected group (or is unavailable), the page SHALL select the **default variation**: the group's available variation whose id carries no mode suffix (`necroNpcWarden` over `necroBossWardenLHE`), determined as the available variation whose id is the shortest, with ties broken by served order; when `level` is absent or out of range for the selected variation, the page SHALL select the first level in display order. A default selection SHALL NOT be written back to the URL until the user changes it.

#### Scenario: Direct link restores NPC, variation, and level

- **WHEN** a user opens `/library/npcs/makhotep?variation=necroBossWardenLHE&level=3`
- **THEN** the page shows `Makhotep`, variation `necroBossWardenLHE`, and the stat row at served index 3 of that variation

#### Scenario: Selecting an NPC resets variation and level

- **WHEN** a user viewing `/library/npcs/makhotep?variation=necroBossWardenLHE&level=3` selects `Imospekh`
- **THEN** the URL becomes `/library/npcs/imospekh` and the default variation and first level are shown

#### Scenario: Changing variation resets level

- **WHEN** a user viewing `?variation=necroBossWardenLHE&level=3` selects variation `necroBossWardenLEG`
- **THEN** the URL query becomes `variation=necroBossWardenLEG` with no `level`, and the first level of `necroBossWardenLEG` is shown

#### Scenario: Unknown variation falls back to default

- **WHEN** a user opens `/library/npcs/makhotep?variation=doesNotExist`
- **THEN** the page shows the default variation `necroNpcWarden` and the URL is left unchanged

#### Scenario: Out-of-range level falls back to first

- **WHEN** a user opens `/library/npcs/makhotep?variation=necroBossWardenLEG&level=9` and that variation has 2 levels
- **THEN** the first level in display order is shown

#### Scenario: Collection route redirects to the first listed NPC

- **WHEN** a user opens `/library/npcs` after the dataset has loaded and at least one NPC is listed
- **THEN** the browser is redirected to `/library/npcs/{firstListedGroupId}` per the shared Library route contract

### Requirement: Filters narrow the NPC list and the variation choices together

The page SHALL offer a name search plus faction, alliance, attack-type, damage-type and trait filters. The name search SHALL remain visible at all times and SHALL NOT be counted as a filter; the remaining controls MAY be collapsed behind a toggle that reports how many are active. Faction, alliance and attack type SHALL be single-select; damage type and trait SHALL be multi-select, and each multi-select SHALL offer its own clear control that resets only that control. Filter options SHALL be derived from the listed catalog, and an option whose id is blank SHALL NOT be offered. Search SHALL match the localized NPC name case-insensitively. A variation **matches** when its `factionId` equals the selected faction (if any), when its `alliance` equals the selected alliance (if any), when it satisfies the selected attack type (if any — `ranged` requires a ranged damage profile, `meleeOnly` requires the absence of one), when its melee, ranged, active-ability, or passive-ability damage-type ids include every selected damage type (if any), when its trait ids include every selected trait (if any), and when the group name matches the search (if any). A group SHALL be listed when at least one of its available variations matches. While filters are active, the Variation selector for the selected group SHALL offer only the matching variations; if the currently selected variation stops matching, the page SHALL select the first matching variation in the group. Clearing all filters SHALL restore every listed NPC and every available variation. If the selected group has no matching variation, the page SHALL keep the selected group's URL and show the no-matching-variation state instead of navigating away. Filter state SHALL be page-local (not in the URL) and SHALL reset when the user leaves the NPC Library.

#### Scenario: Name search is not one of the collapsible filters

- **WHEN** the filter controls are collapsed
- **THEN** the name search is still usable, and typing in it does not change the active-filter count

#### Scenario: A multi-select is cleared on its own

- **WHEN** a damage type and a trait are both selected and the damage-type control's clear is used
- **THEN** only the damage-type selection is reset and the trait selection remains

#### Scenario: A unit served without a damage profile offers no blank option

- **WHEN** a listed unit carries an empty damage-type id, as `Watcher` and `Spore Mine` do
- **THEN** no blank row appears in the damage-type options

#### Scenario: Faction filter keeps NPCs of that faction

- **WHEN** the faction filter is set to `Necrons`
- **THEN** the list contains only NPCs with at least one available `Necrons` variation

#### Scenario: Damage-type filter matches across variations

- **WHEN** the damage type filter is `Gauss` and an NPC has one variation with ranged damage `Gauss` and another with no ranged weapon
- **THEN** the NPC is listed and its Variation selector offers only the `Gauss` variation

#### Scenario: Selected variation stops matching

- **WHEN** the user is viewing `necroBossWardenLHE` and applies a filter that only `necroNpcWarden` matches
- **THEN** the page switches to `necroNpcWarden` and the URL's `variation` is updated

#### Scenario: No NPC matches the filters

- **WHEN** the combined filters match no NPC
- **THEN** the list shows a no-matching-NPCs state with a control to clear the filters, and the selected NPC's URL is unchanged

#### Scenario: Filters do not survive navigation

- **WHEN** a user applies a trait filter, navigates to `/library/characters`, and returns to `/library/npcs`
- **THEN** no trait filter is active

### Requirement: The detail view shows identity, stats, attacks, and traits for the selected level

For the selected NPC, variation, and level the page SHALL show: the NPC portrait (initials badge when no portrait asset resolves), the localized NPC name, the variation label, the localized faction name with its icon, and the selected level's rank and stars icons; stat cards for Health, Armour, and Damage from the selected level row and Movement from the variation; one attack chip per melee weapon and per ranged weapon, each with the attack-type icon, the damage-type icon and localized name, and the hit count, with a ranged attack's range shown as a number on its attack icon (and repeated as screen-reader text); and the variation’s traits as chips showing the trait icon and its localized name, The trait name SHALL remain visible at every viewport width, since an icon-only chip is unreadable on touch. A trait whose rules text resolves SHALL open that text in a popover anchored to its chip, leaving the wrapping row unreflowed; a trait with no rules text SHALL render as a plain, non-interactive chip. When the variation has no traits the traits section SHALL show the Library empty-state treatment rather than an empty container. Changing the level SHALL update the stat cards and level icons without changing attacks or traits.

#### Scenario: Stats follow the selected level

- **WHEN** `necroBossWarden` is selected at its rank 9 / 6-star row with health 1028
- **THEN** the Health card shows 1028 and the identity area shows the rank 9 and 6-star icons

#### Scenario: Melee and ranged attacks are listed separately

- **WHEN** the selected variation has melee `Physical` × 1 and ranged `Gauss` × 2 at distance 3
- **THEN** two attack rows are shown: a melee row (`Physical`, 1 hit) and a ranged row (`Gauss`, 2 hits, range 3)

#### Scenario: Unit with no attacks

- **WHEN** the selected variation carries an empty melee damage profile and no ranged weapon, as
  `Watcher` and `Spore Mine` do
- **THEN** the attacks section shows an explicit no-attacks state rather than a chip with an empty
  damage type

#### Scenario: Melee-only unit shows one attack row

- **WHEN** the selected variation has `rangedDamage` `null`
- **THEN** only the melee attack row is shown

#### Scenario: No traits

- **WHEN** the selected variation has an empty `traits` array
- **THEN** the traits section shows the Library empty-state treatment and no empty trait container

### Requirement: The detail view lists the variation's abilities by name

For the selected variation the page SHALL list its `activeAbilities` and `passiveAbilities` as two labelled columns — side by side on desktop, stacked on mobile — each ability shown as its localized name with its ability icon. The kind SHALL be labelled once per column rather than repeated on each ability, since most units carry exactly one of each. An ability whose icon asset is absent SHALL render as its name alone rather than a broken or placeholder image. An ability that has no localized name SHALL be omitted rather than shown as its raw id, since such ids are internal engine markers the game gives no name or icon. A column left with no abilities SHALL be omitted entirely; when the variation has neither, no abilities section SHALL be rendered. The set of abilities SHALL NOT change with the selected level.

An ability whose rules text resolves completely from its own per-ability-level variable and constant tables SHALL be expandable, revealing that text rendered for the selected level's `abilityLevel`, so the numbers rescale as the level changes. An ability whose text cannot be fully resolved SHALL render as a plain, non-expandable chip rather than a partially-substituted description containing a raw `{[token]}`. The page SHALL NOT attribute a `activeAbilityDamage` / `passiveAbilityDamage` entry to an individual ability, because those arrays are not positionally aligned with the ability arrays.

#### Scenario: Active and passive abilities are listed

- **WHEN** the selected variation is `necroBossWarden`, whose `activeAbilities` is `["AdaptiveStrategy"]` and `passiveAbilities` is `["RelentlessMarch"]`
- **THEN** the detail shows an active group containing "Adaptive Strategy" and a passive group containing "Relentless March", each with its ability icon

#### Scenario: Ability without a shipped icon

- **WHEN** a listed ability's icon asset is not present
- **THEN** its name is shown without an icon and no broken image is rendered

#### Scenario: Group with no abilities is omitted

- **WHEN** the selected variation has `activeAbilities` empty and `passiveAbilities` non-empty
- **THEN** only the passive column is rendered, reading as a single labelled list

#### Scenario: Columns stack on mobile

- **WHEN** the detail renders below 768px
- **THEN** the active and passive columns are stacked rather than side by side

#### Scenario: No abilities at all

- **WHEN** the selected variation has both ability arrays empty
- **THEN** no abilities section is rendered

#### Scenario: Rules text expands on demand and rescales with the level

- **WHEN** the user expands an ability whose text resolves, then changes the selected level
- **THEN** the description's numbers are those of the new level's `abilityLevel`, while the set of
  listed abilities is unchanged

#### Scenario: Ability without fully resolvable text is not expandable

- **WHEN** an ability's description references a value neither its variable nor its constant table
  carries
- **THEN** it renders as a plain chip with no expand control, and no raw `{[token]}` is ever shown

#### Scenario: Ability names are localized by id

- **WHEN** the active language is `de` and the variation has the ability `AdaptiveStrategy`
- **THEN** the ability's `de` name is shown, falling back to the raw id when the namespace has no entry

### Requirement: Levels are ordered by progression and disambiguated on ties

The Level selector SHALL list the selected variation's stat rows ordered by `rank` ascending, then `stars` ascending, preserving served order among equal rows. Each option SHALL show the row's stars and rank icons. When two or more rows share the same rank and stars, every option in that tie SHALL additionally show its health value so the options are distinguishable. The `level` query value SHALL remain the row's served index regardless of display order.

#### Scenario: Unsorted served ladder is displayed in progression order

- **WHEN** `necroBossWarden` serves rows in the order rank 2 / 2★, rank 1 / 2★, rank 9 / 6★, …
- **THEN** the selector lists rank 1 / 2★ first, then rank 2 / 2★, then rank 9 / 6★

#### Scenario: Tied rows show health

- **WHEN** `blackNpc4HavocSurv` serves three rows at rank 20 / 14★ with health 34,594, 172,970, and 1,729,700
- **THEN** the three options show the rank and star icons plus their respective health values

#### Scenario: Level index survives reordering

- **WHEN** the user picks the option that was served at index 1 (rank 1 / 2★) of `necroBossWarden`
- **THEN** the URL becomes `?variation=necroBossWarden&level=1`

### Requirement: Variations are labelled by mode, with the id as secondary text

Each Variation option SHALL show a human-readable mode label derived from the variation id's suffix — Standard (no suffix), Legendary Hero Event (`LHE`), Legendary (`LEG`), Survival (`Surv`), Campaign (`C1`), Champion Event (`CE`), Tutorial (`Tut`, `FTUEtest`), and the hive-fleet names (`Leviathan`, `Kronos`, `Gorgon`) — and SHALL show the raw variation id as secondary text. When a suffix is not recognised the label SHALL fall back to the raw id. When the selected group has exactly one available variation, the selector SHALL show it selected and disabled.

#### Scenario: Known suffix is labelled

- **WHEN** the Variation selector lists `necroBossWardenLHE`
- **THEN** the option reads "Legendary Hero Event" with `necroBossWardenLHE` as secondary text

#### Scenario: Single variation is disabled

- **WHEN** the selected NPC has exactly one available variation
- **THEN** the Variation selector shows it as selected and is disabled

### Requirement: Loading, failure, empty, and unavailable states are distinct

The page SHALL distinguish: the dataset still loading (loading state, no redirect), the dataset failed to load (failure state), the dataset loaded with no listable NPC (no-records state on the collection URL), filters matching no NPC (no-matching-NPCs state with the list), and the selected group having no matching variation under the active filters (no-matching-variation state in place of the detail). It SHALL never render a stat card with a `0` value for an unavailable variation, because unavailable variations are not selectable.

#### Scenario: Unknown group id is canonicalized

- **WHEN** a user opens `/library/npcs/not-a-real-npc` after the dataset has loaded
- **THEN** the URL is replaced with `/library/npcs/{firstListedGroupId}` per the shared Library route contract, and no not-found state is shown

#### Scenario: Selected NPC has no matching variation

- **WHEN** the selected NPC's variations are all excluded by the active filters
- **THEN** the detail area shows a no-matching-variation state with a clear-filters control and the URL is unchanged

### Requirement: Desktop and mobile present distinct layouts

On desktop (≥ 768px), the page SHALL show a two-column layout with the filter controls stacked at the top of the left column above the NPC list, remaining visible while the list scrolls: the NPC list (portrait tiles with localized name and faction icon, selected tile highlighted) beside the detail panel, with the Variation and Level selectors inside the detail panel header. On mobile (< 768px), the page SHALL replace the tile list with a searchable combobox (trigger shows the selected NPC's portrait and name; list shows portrait, name, and faction) above the filter controls, and SHALL stack the detail below with the Variation and Level selectors as full-width controls; stat cards SHALL use the two-column card grid and long labels SHALL truncate without overflowing the viewport. On both, every selector SHALL be keyboard navigable, SHALL scroll the selected option into view when opened, and SHALL keep the selection when closed without a choice.

#### Scenario: Desktop layout

- **WHEN** the viewport is 1280px wide and `Makhotep` is selected
- **THEN** the NPC tile list is beside the detail panel and the Variation and Level selectors sit in the detail header

#### Scenario: Mobile layout

- **WHEN** the viewport is 390px wide and `Makhotep` is selected
- **THEN** a combobox trigger showing Makhotep's portrait and name is above the detail, no tile list is rendered, and no horizontal scrolling occurs

#### Scenario: Mobile combobox search

- **WHEN** on mobile the user opens the combobox and types `makh`
- **THEN** the list narrows to `Makhotep` and selecting it navigates to `/library/npcs/makhotep`

### Requirement: The page has an onboarding tour covering both platforms

The page SHALL register a Joyride tour with desktop steps for the filter bar, the NPC list, the Variation and Level selectors, and the stats/attacks area, and mobile steps for the combobox, the selectors, and the stats area. Step titles and content SHALL come from i18n.

#### Scenario: Desktop tour targets exist

- **WHEN** the desktop page renders with an NPC selected
- **THEN** every desktop tour step's target selector matches an element

#### Scenario: Mobile tour targets exist

- **WHEN** the mobile page renders with an NPC selected
- **THEN** every mobile tour step's target selector matches an element

### Requirement: NPC names, factions, damage types, and traits are localized by id

The NPC display name SHALL be resolved from a variation id through an id-keyed `npcs` translation namespace (falling back to the served catalog `name`); a group's display name is the localized name of its default variation. Faction, damage type, and trait names SHALL resolve through their existing id-keyed namespaces. All other page copy SHALL come from the `library` namespace. Every supported locale (en, de, es, fr) SHALL carry real translations.

#### Scenario: Localized NPC name

- **WHEN** the active language is `de` and the `Necron Warrior` group's default variation is `necroNpc1Warrior`
- **THEN** the list and detail show the `de` translation `Necronkrieger` for that group

#### Scenario: Missing translation falls back to catalog name

- **WHEN** a variation id has no entry in the `npcs` namespace
- **THEN** the served catalog `name` is shown
