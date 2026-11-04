## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: The page has an onboarding tour covering both platforms

The page SHALL register a Joyride tour with desktop steps for the filter bar, the NPC list, the Variation and Level selectors, the stats/attacks area, and the encounters section, and mobile steps for the combobox, the selectors, the stats area, and the encounters section. Step titles and content SHALL come from i18n.

#### Scenario: Desktop tour targets exist

- **WHEN** the desktop page renders with an NPC selected
- **THEN** every desktop tour step's target selector matches an element

#### Scenario: Mobile tour targets exist

- **WHEN** the mobile page renders with an NPC selected
- **THEN** every mobile tour step's target selector matches an element
