## MODIFIED Requirements

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

## ADDED Requirements

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
when it failed to load or has no entry for the unit it SHALL show "—" with the text "Power data
unavailable", and the rest of the page SHALL be unaffected. Desktop and mobile show it in the same
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

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** a unit page renders
- **THEN** the header power shows "—" and "Power data unavailable", and every other section renders as usual
