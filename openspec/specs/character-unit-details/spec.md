# character-unit-details Specification

## Purpose

Lets anyone browse every character in the Library and open a character's unit page, which shows the
unit's stats, traits, abilities with rules text and growth charts, a comparison with other
characters, its relic, and the rank-up materials calculator, at the player's own levels when synced.

## Requirements

### Requirement: Characters list page

`/library/characters` SHALL show a list of every catalog character as tiles (portrait and name),
ordered by alliance, then faction, then name, with a name search. Each tile SHALL be a link to that
character's unit page at `/library/characters/{id}`. The page SHALL work signed out. Query
parameters the former calculator used on this URL SHALL be dropped, not applied.

#### Scenario: Opening a character from the list

- **WHEN** a visitor opens `/library/characters` and activates the tile for Tigurius
- **THEN** the browser navigates to `/library/characters/ultraTigurius`, and that page's back button
  is labelled "Characters" and returns to the list

#### Scenario: Searching by name

- **WHEN** the visitor types "tig" in the name search
- **THEN** only characters whose localized name contains "tig" (case-insensitive) remain listed

#### Scenario: Search with no matches

- **WHEN** the search matches no character
- **THEN** the list shows a "no matching characters" message with a control that clears the search

#### Scenario: Catalog still loading or failed

- **WHEN** the characters catalog has not loaded yet, or failed to load
- **THEN** the page shows its loading state, or the Library's existing load-failure state, and no
  empty "no characters" message

#### Scenario: An old calculator link without a character

- **WHEN** a visitor opens `/library/characters?rankStart=Iron1&rankEnd=Gold1`
- **THEN** the characters list is shown and the URL no longer carries those parameters

### Requirement: Character unit page and its states

`/library/characters/{id}` SHALL show the unit page for that character without any character picker.
While the catalog loads it SHALL show a loading state; if the catalog fails it SHALL show the Library's
load-failure state; for an id that is not a catalog character it SHALL show the Library's not-found
state with a way back to the characters list.

#### Scenario: Unknown character id

- **WHEN** a visitor opens `/library/characters/notACharacter`
- **THEN** the page shows the not-found state and a link to the characters list, and no unit content

#### Scenario: No picker on the unit page

- **WHEN** a visitor opens any character's unit page on desktop or mobile
- **THEN** no control on the page selects a different character other than prev/next and the back
  button

### Requirement: Unit navigation follows where the user came from

The unit page SHALL show a navigation bar with a back button, a breadcrumb
`Library / Characters / <name>`, Previous and Next buttons, and the unit's position. The page tour
button SHALL be in the app header, as on every page, not in the navigation bar. Back, prev/next and the position SHALL follow the page the user came from: the characters
list by default, or the Collection page when the unit was opened from a Collection tile. From the
list, prev/next and the position SHALL walk the characters the list showed, in its current order and
narrowed by its search; the back button SHALL return to `/library/characters` without restoring that
search. Opened from Collection, the back button SHALL be labelled "Collection" (its accessible
name "Back to Collection") and return to `/my-game/collection`, and prev/next and the position SHALL
walk only the characters, in the order Collection showed them; Machines of War SHALL NOT be stepped
onto. The origin SHALL survive reload and history back/forward and SHALL carry over when the user
steps with Previous or Next. Prev/next SHALL keep the active tab and drop every other query parameter,
so the Rank-up materials range doesn't carry over to another unit. The first unit SHALL have Previous
disabled and the last unit Next disabled. The breadcrumb SHALL stay `Library / Characters / <name>`
whatever the origin.

#### Scenario: Prev/next from the list

- **GIVEN** the visitor opened Tigurius from the unfiltered characters list
- **WHEN** they activate Next
- **THEN** the page shows the character after Tigurius in the list's order, the position text reads
  "<n> of <total>", and the URL's `tab` parameter is unchanged

#### Scenario: Opened from Collection

- **GIVEN** the player's Collection shows 120 characters and 11 Machines of War, and Titus is the 5th
  character in Collection order
- **WHEN** they open Titus from his Collection tile
- **THEN** the back button reads "Collection", the position reads "5 of 120", and Next opens the 6th
  character in Collection order, never a Machine of War

#### Scenario: Back to Collection

- **GIVEN** a character page opened from Collection, after stepping Next twice
- **WHEN** the user activates the back button
- **THEN** the browser navigates to `/my-game/collection`

#### Scenario: Back button on mobile

- **GIVEN** a mobile viewport and a character page opened from Collection
- **WHEN** a screen reader user focuses the icon-only back button
- **THEN** its accessible name is "Back to Collection"

#### Scenario: Opened directly from a link

- **WHEN** a visitor opens a unit page from a bookmark or shared link
- **THEN** back returns to the characters list and prev/next follow the list's default order

#### Scenario: Accessible prev/next

- **WHEN** a screen reader user focuses Next
- **THEN** its accessible name is "Next unit: <name of the next character>"

### Requirement: Values shown on the unit page

The unit page SHALL show stats at one set of values: rarity, stars and rank. Ability panels and the
relic panel SHALL have their own levels. The values SHALL start as follows:

- **Owned** (signed in, the roster's characters data has synced, and the player has the unit): the
  player's rarity, stars and rank; abilities at the player's levels; the relic at the equipped relic's
  level. The header shows "Your unit: <rarity> · <stars> · <rank> · abilities <active> / <passive>"
  (plus "· relic level <n>" when a relic is equipped), and the values control offers **Your unit** |
  **Custom**.
- **Not owned** (signed in and synced, the player doesn't have the unit): the unit's starting rarity
  and its first star step, Stone I, abilities and relic at level 1. The portrait is greyed out, the
  header says "Not unlocked. Values start at <rarity>, <stars>, Stone I.", it shows shard progress
  ("<shards> / <unlock cost> shards", the unlock cost for the unit's starting rarity), and the values
  control offers **Starting** | **Custom**.
- **No roster** (signed out, or signed in before the characters data has synced): the starting values
  as for Not owned, in full colour, with a banner. Signed out, it says "Sign in and sync to open this
  page at your own levels." with a **Sign in** button; signed in, it asks the player to use the app
  header's **Sync with Tacticus** control.

Custom SHALL reveal a rarity-and-stars select (the progression ladder) and a Rank select offering the
ranks that rarity allows. Changing them SHALL update every stat and the power on the
Details tab except the comparison radar, and SHALL NOT change the Rank-up materials tab or the ability
and relic levels. Custom values SHALL be page state only: not in the URL, and reset when the unit
changes.

Assumptions:

- Starting stars are the first step of the starting rarity on the progression ladder: Common none,
  Uncommon 2 stars, Rare 4 stars, Epic 1 red star, Legendary 3 red stars.

#### Scenario: Owned unit opens at the player's values

- **GIVEN** a signed-in, synced player whose Tigurius is Mythic, 2 blue stars, Adamantine II with no
  Adamantine II slots applied, active ability 58, passive 46
- **WHEN** they open Tigurius's unit page
- **THEN** the header reads "Your unit: Mythic · 2 blue stars · Adamantine II · abilities 58 / 46",
  the ability steppers show 58 and 46, and At a glance shows Health 7,955

#### Scenario: Not owned unit starts at its starting values

- **GIVEN** a signed-in, synced player without Tigurius (starting rarity Uncommon) holding 120 of the
  shards needed to unlock an Uncommon character
- **WHEN** they open Tigurius's unit page
- **THEN** the portrait is greyed out, values are Uncommon, 2 stars, Stone I, abilities level 1, and
  shard progress shows "120 / <Uncommon unlock cost> shards" as a progress bar with those values

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens a unit page
- **THEN** values are the starting values, the portrait is in colour, and the banner offers Sign in

#### Scenario: Custom values

- **GIVEN** an owned unit shown at Your unit
- **WHEN** the user selects Custom and changes Rank to Diamond I
- **THEN** At a glance and Stats by rank use Diamond I, the radar and the Rank-up materials tab are
  unchanged, and selecting Your unit restores the player's values

### Requirement: Unit page tabs and URL state

The unit page SHALL have two tabs, **Details** and **Rank-up materials**, selected by the `tab` query
parameter: absent or `details` for Details, `rankup` for Rank-up materials; any other value SHALL show
Details. Switching tabs SHALL change only `tab` and keep every other query parameter, so the Rank-up
materials range survives switching away and back. The selected tab SHALL survive reload. Tabs SHALL be
keyboard-operable (arrow keys move between them).

#### Scenario: Deep link to the calculator

- **WHEN** a visitor opens `/library/characters/ultraTigurius?tab=rankup&rankStart=Gold1&rankEnd=Diamond1&progressionStart=Legendary:RedThreeStars&progressionEnd=Legendary:RedFiveStars`
- **THEN** Rank-up materials is selected and the calculator shows that range

#### Scenario: Switching tabs keeps the calculation

- **GIVEN** the Rank-up materials tab with an applied range
- **WHEN** the user opens Details and then Rank-up materials again
- **THEN** the same applied range and results are shown

### Requirement: At a glance and traits

The Details tab SHALL show an At a glance card with Health, Damage, Armour and Movement at the shown
values (with no percentile line: the comparison's percentiles are at its fixed reference, not at the
shown values), the melee attack and, when the unit has
one, the ranged attack (hits; damage type with its pierce ratio, the percentage of each hit that gets
through any armour, explained on hover or focus with the rule that a hit deals the higher of its
damage minus the target's armour or that percentage of its damage; range for ranged), and its equipment slots, marking the slot the character's relic goes in (the relic's equipment type)
with "Relic: <relic name>", set off from the slot by a coloured divider. Activating the relic name
SHALL bring the Relic panel into view and move focus to it (on mobile, opening the Relic section
first); activating the slot itself SHALL expand its items. Each slot SHALL show how many items it can
take and SHALL expand, one slot at a time, into those items grouped by rarity from Mythic down to Common (icon centred in its
rarity frame, name): non-relic
equipment of the slot's type whose allowed factions include the character's faction or are empty.
Items whose catalog name starts with "\_" (no real name in the game text) SHALL be left out. Each
item SHALL show a tooltip on hover or focus with its name, rarity and stats at level 1 and its last
level (chance stats as percentages, e.g. "Crit chance +20%", "Crit damage +1,835 → +2,727"). It SHALL show
a Traits card with each trait's icon, name and description; a trait without a description in the game
text SHALL show its name only, with no placeholder.

Stats SHALL be the game's stats before equipment (see `unit-power`, "Character stats come from the
power calculation") at the shown rarity, stars and rank, counting the applied current-rank slots that
the Power requirement counts.

#### Scenario: Worked example — Health at Mythic, 2 blue stars, Adamantine II

- **GIVEN** Tigurius's base Health 65
- **WHEN** the shown values are Mythic, 2 blue stars (progression index 17), Adamantine II, with no
  Adamantine II slots counted
- **THEN** Health = 65 plus the Health slot increases of the 19 completed ranks (Stone I to Adamantine I)
  = 3,616, × `unitStatMultiplierPct` 220% truncated = **7,955**

#### Scenario: Attack rows show the pierce ratio

- **WHEN** a visitor opens Tigurius's unit page
- **THEN** the melee row shows "1 hit", Physical and "1% pierce ratio", and the ranged row shows "1 hit",
  Psychic, "100% pierce ratio" and "Range 2"
- **WHEN** the visitor hovers over or focuses the melee "1% pierce ratio"
- **THEN** a tooltip says each hit deals the higher of its damage minus the target's armour, or 1% of
  its damage

#### Scenario: Trait without description

- **WHEN** a unit has a trait that has no description in the game text
- **THEN** the trait shows its icon and name and nothing else

### Requirement: Ability panels

The Details tab SHALL show an Active and a Passive ability panel. Each SHALL show the ability icon, kind
and name, a level stepper from 1 to 60 for every unit regardless of rarity, the rules text at the
stepper's level with level-dependent values highlighted, and a "Next level (<n+1>)" line comparing the
current and next values, hidden at level 60. For an owned unit the next-level line SHALL add
"· Yours: level <n>". When the game text has no complete rules text for the ability, the panel SHALL
show icon, kind, name, the player's level when owned, and the note "Rules text isn't in the planner
yet.", with no stepper, no next-level line and no chart. Text with an unresolved variable SHALL never
be shown.

#### Scenario: Stepper updates the panel

- **GIVEN** an ability with rules text
- **WHEN** the user raises the stepper from 58 to 59
- **THEN** the rules text, the next-level line and the chart marker all show level 59 / 60

#### Scenario: Character without ability text

- **WHEN** a visitor opens Lhykhis (no ability rules text in V2's game text)
- **THEN** both ability panels show the missing-text note and no stepper, next-level line or chart

### Requirement: Ability growth charts

Below the rules text, an ability panel SHALL chart each level-dependent value that changes between
level 1 and 60 (at most the first two, in the order they appear in the text), with x = level 1–60
and y from 0. A value given as a min–max range SHALL be drawn as a band. A value that is the same at
every level SHALL NOT be charted; the panel SHALL say so in one line instead. A marker SHALL show the
stepper's level; hovering a level SHALL show its value in the chart header; activating a level SHALL
set the stepper to it. Each chart SHALL have a text summary for assistive technology, and the plot
itself SHALL be hidden from it. Charts SHALL not animate when reduced motion is requested.

#### Scenario: Constant value

- **WHEN** an ability's text contains a value that is 120% at every level
- **THEN** that value has no chart and the panel says it stays at 120% at every level

#### Scenario: Clicking the chart sets the level

- **WHEN** the user activates level 40 on an ability's chart
- **THEN** the stepper, rules text and marker move to level 40

### Requirement: Stats by rank

The Details tab SHALL show Health, Damage and Armour for every rank from Stone I to the highest rank in
the game's ladder, at the shown rarity and stars, marking the shown rank. Each rank's values count every slot of the ranks
below it and none of its own, except the shown rank, which counts the slots the Power requirement counts. Ranks above the highest rank
the shown rarity allows SHALL stay on the axis but be faded and marked as above the cap.

#### Scenario: Ranks above the cap are faded

- **GIVEN** the page shows Uncommon stars, whose rank cap is Bronze I
- **WHEN** Stats by rank is shown
- **THEN** Bronze II to the top rank are faded (on desktop the charts' readout adds "(above the cap for
  these stars)"; on mobile those table rows are muted and say so to screen readers), and the
  footnote reads "Faded ranks are above Bronze I, the cap for these stars."

#### Scenario: On desktop, three charts

- **WHEN** the page is at least 768px wide
- **THEN** Stats by rank shows three separate charts, one per stat, each from 0, with a marker at the
  shown rank and a hover readout ("Adamantine II: 7,955 (yours)" for an owned unit at that rank)

#### Scenario: On mobile, a table

- **WHEN** the page is narrower than 768px
- **THEN** Stats by rank is a table of rank, Health, Damage and Armour with the shown rank's row
  highlighted

### Requirement: Compared with other characters

The Details tab SHALL show V1's stat comparison: a six-axis radar and a percentile list with the same
values. The axes, clockwise from the top, SHALL be Health; Armour; Melee damage vs infinite armour;
Melee damage vs 0 armour; Ranged damage vs infinite armour; Ranged damage vs 0 armour. Every character,
including the shown one, SHALL be evaluated at one fixed reference, Mythic Wings and Adamantine II,
whatever values the page shows. The radar SHALL also draw the 50% outline. The card SHALL link to the
Tacticus wiki's damage explanation ("How damage works", opening in a new tab), which describes the
pierce ratio minimum behind the "vs infinite armour" axes.

For each axis, the percentile SHALL be the share of all catalog characters whose value at the
reference is strictly lower than this character's, × 100, shown rounded to a whole percent.

Assumptions:

- Damage vs 0 armour = damage × hits; damage vs infinite armour = damage × hits × the attack's pierce
  ratio (the Tacticus wiki's per-damage-type table, which corrects V1 for Chain and Plasma; an
  unknown type counts as 0).
- A character with no ranged attack has 0 on both ranged axes, so it reads 0% there.
- Ties do not count as lower.
- Reference stats use V1's formula and rounding: round(base × (1.252^17 + 5 × 2) × (1 + 0.1 × 14)),
  i.e. base × 133.5178 rounded; damage is rounded before multiplying by hits. With V2's own stat
  formula a few close values order differently, so V1's is kept and, for the same character data, the
  percentiles equal V1's (apart from
  characters whose ratios the wiki corrects).

#### Scenario: Worked example — Tigurius's Health percentile

- **GIVEN** 119 catalog characters, and Tigurius's base Health 65
- **WHEN** the comparison is computed
- **THEN** Tigurius's Health at the reference is round(65 × 133.5178) = round(8,678.66) = 8,679,
  6 characters have a lower reference Health, so the percentile is 6 / 119 × 100 =
  5.04, shown as **5%** in the percentile list

#### Scenario: Link to the wiki's damage explanation

- **WHEN** a visitor opens a character's Details tab
- **THEN** the comparison card shows "How damage works (Tacticus wiki)", linking to
  https://tacticus.wiki.gg/wiki/HDTW_Damage in a new tab

#### Scenario: Melee-only character

- **WHEN** a character has no ranged attack
- **THEN** both ranged axes show 0%

#### Scenario: Radar is independent of the shown values

- **WHEN** the user changes Custom values
- **THEN** the radar and percentile list do not change

### Requirement: Relic panel

For a character that a relic can be equipped on (a catalog relic whose allowed units include it), the
Details tab SHALL show a Relic panel with the relic's icon in a rarity-coloured frame, its name, and a
level stepper from 1 to 10 starting at the player's equipped relic level, else 1. When the relic has
rules text in V2's game text, the panel SHALL show it at the stepper's level with a next-level line and
a chart whose y axis starts near the lowest value; otherwise it SHALL show the missing-text note with no
stepper and no chart. The panel's label SHALL say whether the relic is unique or shared, from the
catalog's unique-relic flag: "Unique relic", or "Shared relic" with a line naming the other characters
that can equip it ("Also equippable by …"). Characters without a relic SHALL still show the Relic card,
naming the character ("<name> has no relic.") with no stepper or chart; on mobile its section starts
collapsed with the summary "None".

Assumptions:

- All 35 catalog relics have rules text (see the `ability-rules-text` capability); the missing-text state
  stays for a relic a later catalog adds before its text exists.
- Relic rules-text values are not scaled by rarity unless V1 marks them as rarity-affected.

#### Scenario: Relic slot is marked

- **WHEN** a visitor opens Maugan Ra, whose relic Maugetar is a Crit relic
- **THEN** At a glance marks his Crit slot "Relic: Maugetar" and no other slot

#### Scenario: Equippable items for a slot

- **WHEN** a visitor opens Maugan Ra and expands his Crit slot
- **THEN** it lists 12 items grouped Mythic down to Common, the Shuriken Pistol and Ceremonial Knife lines,
  and no item of another faction or without a real name

#### Scenario: Relic name jumps to the Relic panel

- **WHEN** a visitor activates "Relic: Maugetar" in Maugan Ra's Crit slot
- **THEN** the Relic panel scrolls into view and has focus; on mobile the Relic section opens first

#### Scenario: Unique relic

- **WHEN** a visitor opens Maugan Ra, whose relic Maugetar is unique to him
- **THEN** the Relic panel's label reads "Unique relic" and no other characters are listed

#### Scenario: Shared relic

- **WHEN** a visitor opens a character whose relic the catalog marks as not unique
- **THEN** the Relic panel's label reads "Shared relic" and a line under the name lists the other
  characters that can equip it

#### Scenario: Character without a relic

- **WHEN** a visitor opens a character no relic can be equipped on
- **THEN** the Relic card shows "<name> has no relic.", e.g. "Lhykhis has no relic."
- **AND** on mobile the Relic section is collapsed with the summary "None"

#### Scenario: Relic rules text at a level

- **GIVEN** Hollan, who can equip Amulet of the Voidwyrm (ability `AmuletOfTheVoidwyrm`,
  `critDmgReduction` = 390, 411, 432 … 579 for levels 1–10, not rarity-affected)
- **WHEN** a visitor opens Hollan's Details tab with the Relic stepper at level 1
- **THEN** the panel reads "The relic bearer takes -390 Crit Damage for each friendly adjacent Summon or
  Decoy.", the next-level line shows 411, and the chart plots `critDmgReduction` over levels 1–10
- **AND** stepping to level 2 shows -411 and a next-level value of 432

#### Scenario: Relic with no source text

- **GIVEN** a relic whose ability has no entry in the rules-text namespace
- **WHEN** a visitor opens a character that can equip it
- **THEN** the Relic panel shows the relic's icon and name with the missing-text note, no stepper and no chart

### Requirement: Mythic quests

For a character with mythic quest data, the Details tab SHALL show a Mythic quests card listing its
quests in order (up to five). Quest data (tasks, targets, parameters, rewards) SHALL come from the game
catalog's `mythic-quests` dataset; task text SHALL come from the `mythicQuestTasks` game-text namespace by the
task's `locaKey`. Each quest SHALL show its number, the task text with the task's values filled in (character
name, amounts, trait and damage type names), and its rewards as chips with icon, quantity and name (mythic
shards, ascension orbs, ability badges, XP books, gold, equipment), read from the dataset's structured reward
records. On mobile the card is a collapsible section whose header shows the quest count. A character without
quest data SHALL have no Mythic quests card: no record for the character in the dataset, or the dataset absent
from the client's catalog (a client synced against an API without it), both count as no quest data. While the
catalog loads, and when it fails to load, the page SHALL show its existing loading and load-failure states; the
card adds none of its own. A task whose `locaKey` has no template SHALL show the quest's number and rewards
without task text rather than a raw key.

Assumptions:

- Quest data is V1's (117 characters), served by the catalog.
- Task wording is V1's, in English only; other languages show English (no de/es/fr source exists).

#### Scenario: Character with quests

- **WHEN** a visitor opens Abaddon's unit page
- **THEN** the Mythic quests card shows "5 quests", and quest 1 reads "Defeat 8 enemies that have the
  Emplacement trait with Abaddon in one battle" with rewards 4 × Abaddon mythic shards, 2 × Mythic
  Chaos ascension orb and 1 × Mythic XP book

#### Scenario: Character without quest data

- **WHEN** a visitor opens a character the dataset has no record for (for example Weirdboy)
- **THEN** no Mythic quests card is shown

#### Scenario: Dataset not in the client's catalog

- **GIVEN** a client whose synced catalog has no `mythic-quests` dataset
- **WHEN** a visitor opens Abaddon's unit page
- **THEN** no Mythic quests card is shown and the rest of the page renders normally

#### Scenario: Singular task text keeps "in one battle"

- **WHEN** a visitor opens Calgar's unit page
- **THEN** quest 4 reads "Defeat 1 enemy that has the Immune trait with Calgar in one battle"

#### Scenario: Lucius's Armour of Shrieking Souls task names the hero

- **WHEN** a visitor opens Lucius's unit page
- **THEN** quest 1's task text names Lucius once and the Armour of Shrieking Souls effect once, and ends with
  "in one battle"

#### Scenario: German falls back to English task text

- **GIVEN** the language is German
- **WHEN** a visitor opens Abaddon's unit page
- **THEN** quest 1's task text is the English template with Abaddon's values, and the card's own labels and
  reward names are German

### Requirement: Rank-up materials tab

The Rank-up materials tab SHALL host the existing Character Lookup calculator with all of its controls
and behaviour: rank range, progression range, ".5" ranks, Include owned materials, Apply, Share, the
range in the URL, and the existing range-default and range-control rules. The calculator's character
SHALL be the unit page's character. The values control SHALL NOT change it. Share SHALL copy the full
URL including `tab=rankup`.

#### Scenario: Synced default range

- **GIVEN** a signed-in, synced owned character and no range in the URL
- **WHEN** the user opens Rank-up materials
- **THEN** the range starts at the player's rank and progression, as before this change

#### Scenario: Share includes the tab

- **WHEN** the user shares a calculation
- **THEN** the copied URL opens that character with Rank-up materials selected and the same range

### Requirement: Mobile form of the unit page

Below 768px the unit page SHALL use the mobile form: a compact navigation bar with 44px icon buttons, a
smaller header with the values control on its own row, a full-width two-tab bar that stays visible
under the app header while scrolling, and on the Details tab the At a glance card followed by
collapsible sections (Traits, Active, Passive, Compared with other characters, Stats by rank, Relic),
each showing a summary value in its header. Active SHALL start expanded and the others collapsed. The
Rank-up materials tab SHALL use the calculator's existing mobile layout. Nothing SHALL scroll
horizontally at 360px width.

#### Scenario: Mobile Details tab

- **WHEN** a visitor opens a unit page below 768px
- **THEN** At a glance is shown first, then the collapsible sections with Active expanded, and the tab
  bar stays visible while scrolling

#### Scenario: Desktop Details tab

- **WHEN** the page is at least 768px wide
- **THEN** the Details sections are cards laid out in rows (At a glance | Traits; Active | Passive;
  Compared with other characters | Stats by rank; Relic) with no collapsing

### Requirement: Page tours

The characters list and the unit page SHALL each have a page tour on desktop and mobile. The unit page
tour SHALL cover the header and values control, the tabs, an ability panel, the comparison radar, and
the Rank-up materials tab. A step whose target is not on the page SHALL be left out.

#### Scenario: Tour on a character without a relic or ability text

- **WHEN** a visitor starts the unit page tour on Lhykhis
- **THEN** the tour runs without steps that target absent elements

### Requirement: Localized text

Every new visible string SHALL be localized in English, German, Spanish and French. Character, trait
and ability names and rules text SHALL come from the game-text namespaces, falling back to English when
a language has no entry.

#### Scenario: German visitor

- **WHEN** a visitor uses the app in German
- **THEN** page labels are German and ability rules text without a German entry is shown in English

### Requirement: Power on the unit page

The unit page SHALL show the unit's **power** (the `character-combat-power` estimate), labelled
"Power", in the page header's values area (as the MoW page does), at:

- the shown rarity, stars and rank (Your unit, Starting or Custom);
- applied current-rank slots: the player's, while the shown rank is the player's rank; none otherwise
  (Starting, a not-owned unit, or a Custom rank that differs);
- the active and passive levels set on the ability panels;
- equipped items: the player's synced equipped items with their levels when the unit is owned, none
  otherwise; the equipped relic counts at the level set on the Relic panel;

with a muted line saying what it counts ("Includes your equipped items" when owned items count,
"Without equipment" otherwise). It SHALL update as soon as any of those inputs changes and SHALL NOT be
stored or put in the URL. While the `unit-power` dataset is loading it SHALL show a placeholder;
when it is absent, failed to load or has no entry for the unit, the header SHALL NOT show power at
all. At a glance and Stats by rank, which come from the same dataset (see `unit-power`, "Character
stats come from the power calculation"), SHALL then show "—" and "Stats data unavailable"; the rest of
the page SHALL be unaffected. Desktop and mobile show it in the same
place in the header, so the existing header tour step covers it.

#### Scenario: Owned unit at Your unit

- **GIVEN** a synced player whose Tigurius is Gold I, Epic 1 red star, slots 0 to 2 applied, abilities
  20/15, wearing `I_Crit_C001` at level 3 and no relic
- **WHEN** they open Tigurius's page
- **THEN** the header shows "Power 16,809" with "Includes your equipped items"

#### Scenario: Ability stepper changes power

- **GIVEN** that page
- **WHEN** the user raises the passive ability to 16
- **THEN** power becomes the estimate at passive 16 without a reload, and the stats are unchanged

#### Scenario: Custom rank drops the applied slots

- **GIVEN** that page
- **WHEN** the user selects Custom and changes Rank to Gold II
- **THEN** power and stats use Gold II with no Gold II slots applied, still including the equipped item

#### Scenario: Not owned

- **GIVEN** a signed-in, synced player without Tigurius
- **WHEN** they open the page
- **THEN** power is computed at Uncommon, 2 stars, Stone I, abilities 1/1, no slots and no items, with
  "Without equipment"

#### Scenario: Power data unavailable

- **GIVEN** the `unit-power` dataset is absent or failed to load
- **WHEN** a unit page renders
- **THEN** the header has no Power figure, At a glance shows "—" for Health, Damage and Armour with
  "Stats data unavailable", and every other section renders as usual
