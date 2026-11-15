# NPC Library Specification

## Purpose

Defines the public NPC Library page: how the served NPC variation records are grouped into browsable units, how a variation and level are selected and reflected in the URL, what the detail view shows for a selected level, how filters narrow both the list and the variations, and how the page behaves when data is loading, missing, filtered out, or unavailable — on desktop and on mobile.

## Requirements

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

### Requirement: Filters narrow the NPC list and the variation choices together

The page SHALL offer a name search plus faction, alliance, attack-type, game-mode, damage-type and trait
filters. The name search SHALL remain visible at all times and SHALL NOT be counted as a filter; the
remaining controls MAY be collapsed behind a toggle that reports how many are active. Faction, alliance,
attack type and game mode SHALL be single-select; damage type and trait SHALL be multi-select, and each
multi-select SHALL offer its own clear control that resets only that control. Filter options SHALL be
derived from the listed catalog, and an option whose id is blank SHALL NOT be offered. The game-mode
options SHALL be the encounter `source`s that at least one available listed variation has a record for,
in the source order of the encounters section, with the same localized labels; the game-mode control
SHALL be offered only while `npc-encounters` is present. Search SHALL match the localized NPC name
case-insensitively. A variation **matches** when its `factionId` equals the selected faction (if any),
when its `alliance` equals the selected alliance (if any), when it satisfies the selected attack type
(if any — `ranged` requires a ranged damage profile, `meleeOnly` requires the absence of one), when it
has at least one `npc-encounters` record with the selected game mode as its `source` (if any), when its
melee, ranged, active-ability, or passive-ability damage-type ids include every selected damage type
(if any), when its trait ids include every selected trait (if any), and when the group name matches the
search (if any). A group SHALL be listed when at least one of its available variations matches. While
filters are active, the Variation selector for the selected group SHALL offer only the matching
variations; if the currently selected variation stops matching, the page SHALL select the first
matching variation in the group. Clearing all filters SHALL restore every listed NPC and every available
variation. If the selected group has no matching variation, the page SHALL keep the selected group's URL
and show the no-matching-variation state instead of navigating away. Filter state SHALL be page-local
(not in the URL) and SHALL reset when the user leaves the NPC Library.

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

#### Scenario: Location filter narrows within a game mode

- **GIVEN** the Game mode filter is `campaign` and the listed variations have records in more than one
  campaign
- **WHEN** the user sets the Location filter to one of them
- **THEN** only variations with a `campaign` record for that group stay listed and selectable, and
  the filter counts as active

#### Scenario: Location belongs to its game mode

- **GIVEN** a Location is chosen
- **WHEN** the user changes the Game mode filter
- **THEN** the Location resets

#### Scenario: Refreshed data stops offering the chosen filter

- **GIVEN** a Game mode or Location is chosen
- **WHEN** refreshed encounter data no longer offers it
- **THEN** that filter stops narrowing the list and no longer counts as active

#### Scenario: No Location filter without a choice to make

- **WHEN** no game mode is chosen, or the chosen one has a single group (Onslaught)
- **THEN** the Location filter is not offered

#### Scenario: Running-now filter

- **GIVEN** the `events-calendar` has a Legendary Event running for `astarLysander`
- **WHEN** the user turns on the Running now filter
- **THEN** only variations with an encounter whose timing is "Running now" stay listed. Survival, Guild
  Raid and Campaign Event encounters never match, because no schedule identifies them, and neither do
  Campaign and Onslaught, which are "Always available"

#### Scenario: Mission count for one NPC

- **GIVEN** no unit filter is chosen and an NPC spawns 5 times in battle `E01`
- **WHEN** the user sets the "Min. in one battle" filter to 5
- **THEN** that NPC stays listed, and its Encountered in section lists only the battles where it spawns at
  least 5 times, hiding rows with none, and each row's location reads how many of its battles match

#### Scenario: Mission count means each NPC alone

- **GIVEN** battle `E01` spawns 9 of the selected NPC and 20 of another with the same trait, and a trait
  filter is chosen
- **WHEN** the user sets the "Min. in one battle" filter to 13
- **THEN** `E01` is not listed for the selected NPC, because units are never added together

#### Scenario: Mission count where a source has no count

- **WHEN** a mission count is set
- **THEN** a Guild Raid never matches, because it names no counts, and an Onslaught tier uses the NPC's
  largest single wave

#### Scenario: A mission count keeps the other encounter filters

- **GIVEN** a variation spawns 5 times in a campaign battle and in a Legendary Event battle
- **WHEN** the Game mode filter is `campaign` and "Min. in one battle" is 5
- **THEN** its Encountered in section lists the campaign row and not the Legendary Event row

#### Scenario: A chip opens a variation the filters exclude

- **GIVEN** "Min. in one battle" is 5 and a battle spawns another NPC 2 times
- **WHEN** the user clicks that NPC's chip
- **THEN** the filters clear, and that variation opens at that chip's level

#### Scenario: A chip opens in a new tab

- **GIVEN** filters that exclude the variation a chip opens
- **WHEN** the user opens the chip with a modifier key held
- **THEN** the current page keeps its filters and selection

#### Scenario: Encounter filters describe one encounter

- **GIVEN** a variation has a campaign record and a running Legendary Event record
- **WHEN** the Game mode filter is `campaign` and Running now is on
- **THEN** the variation does not match

#### Scenario: No Running now filter without a calendar

- **WHEN** the `events-calendar` dataset is loading, absent or failed
- **THEN** the Running now filter is not offered and does not narrow the list

#### Scenario: Game-mode filter narrows NPCs and variations

- **GIVEN** `Makhotep` has `necroBossWardenLEG` with a `legendaryEvent` record and `necroNpcWarden` with
  only `campaign` records
- **WHEN** the game-mode filter is set to Legendary Event
- **THEN** `Makhotep` is listed, its Variation selector offers `necroBossWardenLEG` but not
  `necroNpcWarden`, and the active-filter count includes the game mode

#### Scenario: Game-mode options come from the data

- **WHEN** no listed variation has a `survival` record
- **THEN** the game-mode control does not offer Survival

#### Scenario: Game-mode filter hidden without encounter data

- **WHEN** `npc-encounters` is loading, absent, or failed to load
- **THEN** no game-mode control is shown, and every other filter works as before

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

Each Variation option SHALL show a human-readable mode label derived from the variation id's suffix — Standard (no suffix), Quest Event (`LHE`), Legendary Event (`LEG`), Survival (`Surv`), Campaign (`C1`), Campaign Event (`CE`), Tutorial (`Tut`, `FTUEtest`), and the hive-fleet names (`Leviathan`, `Kronos`, `Gorgon`) — and SHALL show the raw variation id as secondary text. When a suffix is not recognised the label SHALL fall back to the raw id. When the selected group has exactly one available variation, the selector SHALL show it selected and disabled. These labels SHALL only describe the variation; the game-mode filter and the encounters section SHALL use `npc-encounters` data, not the suffix.

#### Scenario: Known suffix is labelled

- **WHEN** the Variation selector lists `necroBossWardenLHE`
- **THEN** the option reads "Quest Event" with `necroBossWardenLHE` as secondary text

#### Scenario: Campaign Event suffix

- **WHEN** the Variation selector lists `admecBossMarshallCE`
- **THEN** the option reads "Campaign Event" with `admecBossMarshallCE` as secondary text

#### Scenario: Single variation is disabled

- **WHEN** the selected NPC has exactly one available variation
- **THEN** the Variation selector shows it as selected and is disabled

### Requirement: Loading, failure, empty, and unavailable states are distinct

The page SHALL distinguish: the dataset still loading (loading state, no redirect), the dataset failed to load (failure state), the dataset loaded with no listable NPC (no-records state on the collection URL), filters matching no NPC (no-matching-NPCs state with the list), and the selected group having no matching variation under the active filters (no-matching-variation state in place of the detail). It SHALL never render a stat card with a `0` value for an unavailable variation, because unavailable variations are not selectable. The encounters section SHALL separately distinguish its own data states without affecting the rest of the detail: `npc-encounters` loading (a placeholder in the section), absent or failed (a short "encounter data unavailable" note), and present with no record for the variation (the no-recorded-encounters state).

#### Scenario: Unknown group id is canonicalized

- **WHEN** a user opens `/library/npcs/not-a-real-npc` after the dataset has loaded
- **THEN** the URL is replaced with `/library/npcs/{firstListedGroupId}` per the shared Library route contract, and no not-found state is shown

#### Scenario: Selected NPC has no matching variation

- **WHEN** the selected NPC's variations are all excluded by the active filters
- **THEN** the detail area shows a no-matching-variation state with a clear-filters control and the URL is unchanged

#### Scenario: Encounter data unavailable

- **WHEN** `npc-encounters` is absent or failed to load and an NPC is selected
- **THEN** stats, attacks, abilities and traits render as usual, and the encounters section shows only
  the "encounter data unavailable" note

#### Scenario: Encounter data loading

- **WHEN** `npc-encounters` is still loading and an NPC is selected
- **THEN** the rest of the detail renders and the encounters section shows a placeholder

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

The page SHALL register a Joyride tour with desktop steps for the filter bar, the NPC list, the Variation and Level selectors, the stats/attacks area, and the encounters section, and mobile steps for the combobox, the selectors, the stats area, and the encounters section. Step titles and content SHALL come from i18n.

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

### Requirement: The detail view shows the selected level's power

The NPC detail view SHALL show a **Power** stat card next to Health, Armour and Damage. It holds the NPC power (see `unit-power`, "NPC power") of the selected variation's selected level row, and changing the level SHALL update it. The card SHALL carry a short note, revealed on hover, focus or tap, saying the value is estimated from the listed stats and can differ from the game's figure for units with extra abilities, crit or block. While the `unit-power` dataset is loading it SHALL show a placeholder. When the dataset is absent or failed to load, the Power card SHALL NOT be shown, and the other stat cards SHALL be unaffected. Desktop and mobile show the same card in their stat card rows.

#### Scenario: Power follows the selected level

- **WHEN** `darkaNpc1Infiltrator` is selected at its third level row (health 76, damage 34, armour 22)
- **THEN** the Power card shows 45, and choosing another level updates it

#### Scenario: Unit with no attacks

- **WHEN** a variation with no attacks, such as `Watcher`, is selected
- **THEN** the Power card shows round(10 + trait multiplier × ability power) for that row, not an error

#### Scenario: Power data unavailable

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** an NPC detail renders
- **THEN** there is no Power card, and Health, Armour and Damage show as usual

### Requirement: The detail view lists where the selected variation is encountered

For the selected variation the page SHALL show an **Encountered in** section built from the
`npc-encounters` records whose `npcId` is that variation's id. Records SHALL be grouped by `source`
in this order: Campaign, Campaign Event, Legendary Event, Quest Event, Incursion, Guild Raid, Survival,
Onslaught. Each source SHALL show its localized label once, followed by one row per record in served
order. Changing the variation SHALL replace the section's content. Changing the level SHALL NOT change it.

Each row SHALL show:

1. **The group name**, resolved from `groupId`:

   | Source                       | Name                                                          |
   | ---------------------------- | ------------------------------------------------------------- |
   | Campaign, Campaign Event     | the campaign's display name                                   |
   | Legendary Event, Quest Event | the featured character's localized name                       |
   | Incursion                    | the Machine of War's localized name                           |
   | Guild Raid                   | the raid boss / prime label                                   |
   | Survival                     | the localized season label, falling back to the raw `groupId` |
   | Onslaught                    | the source label                                              |

2. **The location**, formatted from the record's battles. Consecutive numbers SHALL collapse into ranges
   (`3, 7, 12–14`):

   | Source          | Location                                                                                                                                                                            |
   | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Campaign        | battle numbers, with challenge battles marked                                                                                                                                       |
   | Campaign Event  | battle numbers per track (Standard, Extremis), challenge battles marked                                                                                                             |
   | Legendary Event | battle numbers per track (Alpha, Beta, Gamma)                                                                                                                                       |
   | Quest Event     | battle numbers                                                                                                                                                                      |
   | Incursion       | battles per tier, tiers named by rarity as the Incursions page names them ("Common 1 – Uncommon 2"), falling back to the 1-based tier while the `incursions` dataset is unavailable |
   | Guild Raid      | "Boss" or "Prime" when the NPC is the unit itself, otherwise "Alongside" the named boss                                                                                             |
   | Survival        | the rounds it spawns in                                                                                                                                                             |
   | Onslaught       | the tiers, worded as "can appear in"                                                                                                                                                |

3. **A timing status**:
   - Campaign, Onslaught: "Always available".
   - Campaign Event, Guild Raid, Survival: "Rotating", with no date (no schedule identifies them).
   - Legendary Event, Quest Event, Incursion: from the `events-calendar` dataset. The matching entries
     are those whose `definitionId` is `legendary-event`, `quest` or `incursion` respectively; for
     `legendary-event` and `quest` the entry's `parameters.featuredCharacterId` must also equal `groupId`.
     Every `incursion` entry matches every Incursion group: an Incursion window opens every Machine of
     War's Incursion (the rule the Incursions page uses), and `featuredMowId` only marks a debut. The
     status is "Running now" when an entry has
     `startUtc <= now < endUtc`. Otherwise it is "Next run" with the date of the earliest
     `startUtc > now`. With no match it is "No scheduled run". While the calendar is loading, absent
     or failed, no timing status is shown and the row is otherwise unchanged.

4. **A link** to the planner page where one exists: Campaign to `/my-game/campaigns`, Campaign Event to
   `/my-game/campaign-events`, Legendary Event to `/legendary-events/{groupId}`, Incursion to
   `/my-game/incursions/{groupId}`, Guild Raid to `/library/raid-bosses/{groupId}`, Onslaught to
   `/my-game/onslaught`. Quest Event and Survival rows SHALL NOT link: no page lists a past or future quest
   or a Survival season. A link to a sign-in-protected page SHALL follow that route's existing sign-in behavior.

5. **An expandable list of its locations**. Opening a row SHALL list its places, one per battle (Campaign,
   Campaign Event, Legendary Event, Quest Event), per round (Survival) or per tier (Onslaught). An Incursion
   SHALL list its tiers, named and coloured by rarity, and Campaign Event and Legendary Event rows SHALL list
   their tracks. Each of these groups SHALL name its battles and open to them, and a row with one group SHALL
   open it at once. Opening a place SHALL show every NPC the data records at that place, one chip per NPC
   and level, with its portrait, localized name, level and how many of it fight at that level: "×N", or
   "up to N" for Onslaught, whose tiers draw from a pool of waves. A Guild Raid names no level or number, so
   its NPCs show neither. Every chip SHALL open that variation at that level, when the Library lists it,
   including the selected variation's. A level the data cannot place SHALL open the variation at its default level. The selected variation SHALL be marked and the others SHALL link to their
   NPC Library page when the Library lists them. A group with a single place, as every Guild Raid group
   is, SHALL open straight to its NPCs. A long list of places SHALL scroll inside the row. Rows SHALL start
   closed, and opening one SHALL NOT navigate.

Assumptions:

- An Onslaught tier draws its waves from a weighted pool, so an Onslaught row means the NPC _can_
  appear there, not that it always does.
- The data covers what the current game build configures. Older Quest Events, Survival seasons and
  Legendary Events may be missing, so "no recorded encounters" does not mean "never encountered".

#### Scenario: Encounters grouped by source in fixed order

- **GIVEN** the selected variation has records for `onslaught`, `campaign` and `legendaryEvent`
- **WHEN** the detail renders
- **THEN** the section lists Campaign, then Legendary Event, then Onslaught, each label shown once

#### Scenario: Legendary Event row with tracks and a next run

- **GIVEN** the selected variation has a `legendaryEvent` record for `astarLysander` with battles alpha 1,
  alpha 2, alpha 3 and beta 7, and the calendar has a `legendary-event` entry with
  `featuredCharacterId` `astarLysander` starting after now
- **WHEN** the detail renders
- **THEN** the row shows Lysander's localized name, "Alpha 1–3 · Beta 7", "Next run" with that entry's
  start date, and links to `/legendary-events/astarLysander`

#### Scenario: Quest Event with no scheduled run

- **GIVEN** a `questEvent` record for `astarCyrus` and no calendar `quest` entry for `astarCyrus`
- **WHEN** the detail renders
- **THEN** the row shows "No scheduled run" and is not a link

#### Scenario: Incursion running without a featured MoW

- **GIVEN** an `incursion` record for `tyranBiovore` and a calendar `incursion` entry running now whose
  parameters name no `featuredMowId`
- **WHEN** the detail renders
- **THEN** the row shows "Running now"

#### Scenario: Guild raid field unit

- **GIVEN** a `guildRaid` record with `groupId` `GuildBoss1Boss1TyranTervigonLeviathan` and a battle with
  `role` `enemy`
- **WHEN** the detail renders
- **THEN** the row reads as appearing alongside that boss's label, shows "Rotating", and links to
  `/library/raid-bosses/GuildBoss1Boss1TyranTervigonLeviathan`

#### Scenario: Onslaught tiers as a range

- **GIVEN** an `onslaught` record with battles for tiers 1 to 21
- **WHEN** the detail renders
- **THEN** the row reads "Can appear in tiers 1–21" and "Always available"

#### Scenario: No recorded encounters

- **GIVEN** `npc-encounters` is present and has no record for the selected variation
- **WHEN** the detail renders
- **THEN** the section says no encounters are recorded for this variation and notes that past or
  rotating content may be missing; it does not say the NPC cannot be encountered

#### Scenario: Calendar unavailable

- **GIVEN** the `events-calendar` dataset failed to load
- **WHEN** a `legendaryEvent` row renders
- **THEN** it shows its name, location and link, and no timing status

#### Scenario: A battle lists everyone fought there

- **GIVEN** the selected variation and another NPC both have a `campaign` record for `campaign1` naming
  battle `I03`
- **WHEN** the user opens the row and then "Battle 3"
- **THEN** both NPCs are listed with their counts, the selected variation marked and the other linking to
  its Library page

#### Scenario: An Incursion nests battles under tiers

- **GIVEN** the selected variation fights in battles 1 and 2 of an Incursion's first tier
- **WHEN** the user opens the row
- **THEN** it lists that tier by rarity name with "Battles 1–2", opening the tier lists the battles, and
  opening a battle shows its NPCs

#### Scenario: An event nests battles under tracks

- **GIVEN** the selected variation fights in Alpha and Beta battles of a Legendary Event
- **WHEN** the user opens the row
- **THEN** it lists Alpha and Beta, each with its battles and opening to them

#### Scenario: A lone group opens at once

- **GIVEN** the selected variation fights only in Alpha battles of a Legendary Event
- **WHEN** the user opens the row
- **THEN** the Alpha group is already open

#### Scenario: A battle opens an NPC at its level

- **GIVEN** the selected variation fights at two levels in battle `I03`
- **WHEN** the user opens that battle
- **THEN** it shows one chip per level, and choosing one sets the variation and the NPC level to that
  chip's, with the battle still open

#### Scenario: An Onslaught count reads as a ceiling

- **GIVEN** the selected variation has an `onslaught` battle with `tier` 2 and `count` 5
- **WHEN** the user opens the row and then "Tier 2"
- **THEN** the NPC shows "up to 5"

#### Scenario: A Guild Raid row opens straight to its NPCs

- **GIVEN** the selected variation has a `guildRaid` record
- **WHEN** the user opens the row
- **THEN** the NPCs of that group are listed with no intermediate location to open and no counts

#### Scenario: Rows stack on mobile

- **WHEN** the section renders below 768px
- **THEN** each row stacks its name, location and timing vertically without horizontal scrolling
