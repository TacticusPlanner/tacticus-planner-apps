## ADDED Requirements

### Requirement: Machines of War list page

`/library/machines-of-war` SHALL show a list of every catalog Machine of War as tiles (round portrait and
name), ordered by alliance, then faction, then name, with a name search. Each tile SHALL be a link to that
MoW's unit page at `/library/machines-of-war/{id}`. The page SHALL work signed out and SHALL NOT show the
"not available yet" placeholder.

#### Scenario: Opening a MoW from the list

- **WHEN** a visitor opens `/library/machines-of-war` and activates the tile for Galatian
- **THEN** the browser navigates to `/library/machines-of-war/ultraDreadnought`, and that page's back
  button is labelled "Machines of War" and returns to the list

#### Scenario: Searching by name

- **WHEN** the visitor types "bio" in the name search
- **THEN** only MoWs whose localized name contains "bio" (case-insensitive), here Biovore, remain listed

#### Scenario: Search with no matches

- **WHEN** the search matches no MoW
- **THEN** the list shows a "no matching Machines of War" message with a control that clears the search

#### Scenario: Catalog still loading, failed or empty

- **WHEN** the MoW catalog has not loaded yet, failed to load, or has no records
- **THEN** the page shows its loading state, the Library's load-failure state, or the Library's
  no-records state respectively

### Requirement: MoW unit page and its states

`/library/machines-of-war/{id}` SHALL show the unit page for that MoW without any MoW picker and without
the placeholder. While the catalog loads it SHALL show a loading state; if the catalog fails it SHALL show
the Library's load-failure state; for an id that is not a catalog MoW it SHALL show the Library's
not-found state with a way back to the Machines of War list.

#### Scenario: A MoW opens its details

- **WHEN** a visitor opens `/library/machines-of-war/ultraDreadnought`
- **THEN** the page shows Galatian's header and the Details tab, and no placeholder message

#### Scenario: Unknown MoW id

- **WHEN** a visitor opens `/library/machines-of-war/notAMow`
- **THEN** the page shows the not-found state and a link to the Machines of War list, and no unit content

### Requirement: MoW unit navigation follows where the user came from

The MoW unit page SHALL show the same navigation bar as the character unit page, with the breadcrumb
`Library / Machines of War / <name>`. Back, Previous, Next and the position ("<n> of <total>") SHALL
follow the page the user came from: the Machines of War list (its current order and search) by default.
Prev/next SHALL keep the active tab. The first MoW SHALL have Previous disabled and the last Next disabled.

#### Scenario: Prev/next from the list

- **GIVEN** the visitor opened Galatian from the unfiltered Machines of War list
- **WHEN** they activate Next on the Ability upgrades tab
- **THEN** the page shows the MoW after Galatian in the list's order with Ability upgrades still selected

#### Scenario: Opened directly from a link

- **WHEN** a visitor opens a MoW unit page from a bookmark or shared link
- **THEN** back returns to the Machines of War list and prev/next follow the list's default order

### Requirement: Values shown on the MoW unit page

The MoW unit page SHALL show one set of values, rarity and stars, plus a level per ability. MoWs have no
rank: the header SHALL NOT show a rank badge or a rank select. The values SHALL start as follows:

- **Owned** (signed in, the roster's MoW data has synced, and the player has the MoW): the player's rarity
  and stars, abilities at the player's levels. The header shows "Your Machine of War: <rarity> · <stars> ·
  primary <n> · secondary <n>", and the values control offers **Your unit** | **Custom**.
- **Not owned** (signed in and synced, the player doesn't have the MoW): Common, no stars, abilities at
  level 1. The portrait is greyed out, the header says "Not unlocked. Values start at Common.", it shows
  shard progress ("<shards> / <unlock cost> shards"), and the values control offers **Starting** |
  **Custom**.
- **No roster** (signed out, or signed in before the roster has synced): the starting values as for Not
  owned, in full colour, with the same sign-in or sync banner as the character unit page.

Custom SHALL reveal a rarity-and-stars select only. Custom values SHALL be page state only: not in the URL,
and reset when the MoW changes. They SHALL NOT change the ability levels or the Ability upgrades tab.

Assumptions:

- Every MoW starts at Common with no stars (V1's MoW data; V2's catalog has no starting rarity for MoWs).
- The player's primary ability level is the first entry of the synced MoW's abilities and the secondary
  the second, as the Goals page already reads them.
- A MoW's unlock cost is the unlock shard cost for its starting rarity, as for characters.

#### Scenario: Owned MoW opens at the player's values

- **GIVEN** a signed-in, synced player whose Galatian is Epic, 3 stars, primary 30, secondary 28
- **WHEN** they open Galatian's unit page
- **THEN** the header reads "Your Machine of War: Epic · 3 stars · primary 30 · secondary 28", has no rank
  badge, and the Primary and Secondary panels show "Yours: level 30" and "Yours: level 28"

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens a MoW unit page
- **THEN** values are Common, no stars, abilities level 1, the portrait is in colour, and the banner offers
  Sign in

#### Scenario: Custom offers rarity and stars only

- **WHEN** the user selects Custom
- **THEN** a rarity-and-stars select appears and no rank select does

### Requirement: MoW unit page tabs and URL state

The MoW unit page SHALL have two tabs, **Details** and **Ability upgrades**, selected by the `tab` query
parameter: absent or `details` for Details, `upgrades` for Ability upgrades; any other value SHALL show
Details. Details SHALL be the default even while every ability panel lacks rules text. Switching tabs SHALL
change only `tab` and keep every other query parameter. The selected tab SHALL survive reload. Tabs SHALL
be keyboard-operable.

#### Scenario: Deep link to the calculator

- **WHEN** a visitor opens `/library/machines-of-war/ultraDreadnought?tab=upgrades`
- **THEN** Ability upgrades is selected

#### Scenario: Unknown tab value

- **WHEN** a visitor opens `/library/machines-of-war/ultraDreadnought?tab=rankup`
- **THEN** Details is selected

### Requirement: MoW ability panels

The Details tab SHALL show a **Primary** and a **Secondary** ability panel, behaving as the character unit
page's ability panels: icon, kind and localized name, a level stepper from 1 to the highest MoW ability
level the catalog's upgrade costs reach (60 today), rules text at that level, a next-level line with
"· Yours: level <n>" for an owned MoW, and growth charts. When the game text has no complete rules text for
the ability, the panel SHALL show icon, kind, name, the player's level when owned, and the note "Rules text
isn't in the planner yet.", with no stepper, no next-level line and no chart. The Details tab SHALL NOT show
stats, a comparison radar, stats by rank, a relic or mythic quests.

#### Scenario: No MoW rules text in the data

- **GIVEN** the game text has no rules text for any MoW ability (0 of 22 today)
- **WHEN** a visitor opens Galatian's Details tab
- **THEN** the Primary panel shows "Duty Eternal" and the Secondary panel "Macro Plasma Incinerator", each
  with the missing-text note and no stepper, next-level line or chart

#### Scenario: Rules text arrives

- **GIVEN** the game text gains complete rules text for a MoW ability
- **WHEN** a visitor opens that MoW's Details tab
- **THEN** that panel shows the stepper, rules text, next-level line and growth chart with no UI change

### Requirement: MoW Mythic ability panel

The Details tab SHALL show a third panel, **Mythic**, after Primary and Secondary. Its level SHALL follow the
blue stars of the values shown, with no stepper: 1 blue star is level 1, 2 blue stars level 2, 3 blue stars
level 3 and Mythic Wings level 4. Below Mythic rarity the level SHALL be 1 and the panel SHALL show "Unlocks at
Mythic" in place of the level. When the catalog names the MoW's mythic ability, the panel SHALL show its
localized name and resolve its rules text like the other panels, without a stepper; otherwise it SHALL be
titled "Mythic ability" and show the missing-text note. On mobile it SHALL be a third collapsible section,
collapsed, whose header shows the level ("Lv 2") or "Unlocks at Mythic".

Assumptions:

- The catalog has no MoW mythic ability today (#204); V1 holds one per MoW.
- The mythic level comes from blue stars, as in V1's unit details page.

#### Scenario: Mythic MoW

- **GIVEN** a Galatian shown at Mythic, 2 blue stars
- **WHEN** a visitor opens its Details tab
- **THEN** the Mythic panel reads "Mythic ability", shows level 2 from blue stars and the missing-text note,
  and has no stepper

#### Scenario: Below Mythic

- **GIVEN** a Galatian shown at Legendary
- **WHEN** a visitor opens its Details tab
- **THEN** the Mythic panel shows "Unlocks at Mythic" and no level

#### Scenario: Custom changes the mythic level

- **GIVEN** the Mythic panel at level 2
- **WHEN** the user selects Custom and picks Mythic Wings
- **THEN** the Mythic panel shows level 4

#### Scenario: The catalog names the mythic ability

- **GIVEN** the catalog gives Galatian the mythic ability WisdomOfTheAncients
- **WHEN** a visitor opens its Details tab
- **THEN** the Mythic panel is titled "Wisdom of the Ancients"

### Requirement: Ability upgrades calculator

The Ability upgrades tab SHALL total what raising a MoW's abilities costs, from the catalog's MoW upgrade
costs (one rung per level reached, levels 2 to 60) and each ability's per-level recipes.

- **Range controls**: one group per ability (Primary, Secondary), each with a From level and a To level
  select. From SHALL default to the player's level for an owned MoW and to 1 otherwise; To SHALL default to
  From + 10, capped at the top level. To's options SHALL start at From, so To below From is impossible.
  From equal to To SHALL add nothing for that ability.
- Raising an ability from level L to L + 1 SHALL cost the upgrade-cost rung for level L + 1 and the
  ability's recipe for that step (the recipe at position L, counting from 1).
- **Total needed**: gold, salvage, components, then badges and forge badges with one value per rarity that
  occurs in the range, each rarity named in text. A total of 0 SHALL show "0". Badges and components SHALL
  be named for the MoW's alliance.
- **Upgrade materials**: every material the steps in the range consume, totalled across both abilities,
  with crafted materials broken down into their base materials; each with icon, name and count.
- **Per level**: a table with one row per level step, Primary rows then Secondary rows, each group under a
  row-group header. Columns: Level ("30 → 31"), Gold, Salvage, Badges, Forge badges, Components, and
  Materials (that step's recipe as icons with counts). Totals SHALL NOT be repeated as a table footer.
- Every change SHALL recalculate immediately, with no Calculate button.
- The selected levels SHALL be page state only: not in the URL, and reset when the MoW changes.

Assumptions:

- The upgrade-cost ladder is shared by every MoW; the recipes are per MoW and per ability.
- Gold and salvage are not in the synced inventory, so they are never reduced by Include owned materials.

#### Scenario: Low levels (worked example)

- **GIVEN** Galatian, Primary 1 → 3 and Secondary 1 → 2
- **WHEN** the tab calculates
- **THEN** the steps are Primary 1 → 2 (rung 2: 15 gold, 5 salvage, 1 Common badge, 1 component; recipe
  upgHpC002, upgDmgC001, upgArmC001), Primary 2 → 3 (rung 3: 30 gold, 5 salvage, 1 Common badge, 1
  component; recipe upgHpC014, upgDmgC012, upgArmC013) and Secondary 1 → 2 (rung 2: 15 gold, 5 salvage, 1
  Common badge, 1 component; recipe upgHpC002, upgDmgC013, upgArmC001)
- **AND** Total needed shows Gold 60 (15 + 30 + 15), Salvage 15, Components 3, Common Imperial badges 3, and
  no forge badges
- **AND** Upgrade materials lists upgHpC002 × 2, upgArmC001 × 2, and upgDmgC001, upgHpC014, upgDmgC012,
  upgArmC013, upgDmgC013 × 1 each

#### Scenario: A range crossing rarities (worked example)

- **GIVEN** Galatian, Primary 49 → 51 and Secondary 49 → 49
- **WHEN** the tab calculates
- **THEN** the steps are Primary 49 → 50 (rung 50: 75,000 gold, 0 salvage, 10 Legendary badges, 10
  Legendary forge badges, 50 components) and Primary 50 → 51 (rung 51: 80,000 gold, 0 salvage, 1 Mythic
  badge, 1 Mythic forge badge, 50 components); Secondary adds nothing
- **AND** Total needed shows Gold 155,000, Salvage 0, Components 100, badges Legendary 10 and Mythic 1, and
  forge badges Legendary 10 and Mythic 1

#### Scenario: To cannot go below From

- **WHEN** the user sets Primary From to 30
- **THEN** Primary To offers only levels 30 to 60, and a To that was below 30 becomes 30

#### Scenario: Owned default range

- **GIVEN** an owned Galatian with primary 30 and secondary 28
- **WHEN** the user opens Ability upgrades
- **THEN** Primary is 30 → 40 and Secondary 28 → 38

#### Scenario: Matches V1's MoW Lookup

- **WHEN** the same MoW and ranges are entered here and in V1's MoW Lookup, for three MoWs
- **THEN** gold, salvage, components, badges, forge badges and materials are equal

### Requirement: Include owned materials on Ability upgrades

Signed in with synced inventory, the Ability upgrades tab SHALL offer an **Include owned materials** toggle,
on by default, with a line saying whether totals subtract the inventory. On, the totals SHALL subtract the
inventory's badges of the MoW's alliance per rarity, forge badges per rarity and components of the MoW's
alliance, and the Upgrade materials counts SHALL show what is still needed after inventory (crafted
materials in the inventory count towards their base materials); a fully covered material SHALL stay listed,
marked as covered. No total SHALL go below 0. Signed out, or before the inventory has synced, the toggle SHALL
be hidden and nothing is subtracted.

#### Scenario: Inventory covers part of the need

- **GIVEN** the low-levels example above and an inventory with 2 Common Imperial badges, 5 Imperial
  components and 1 upgHpC002
- **WHEN** Include owned materials is on
- **THEN** Common Imperial badges show 1 (3 − 2), Components 0 (3 − 5, floored), upgHpC002 shows 1 (2 − 1),
  Gold stays 60 and Salvage 15

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens Ability upgrades
- **THEN** no Include owned materials toggle is shown and From starts at 1 for both abilities

### Requirement: Mobile form of the MoW unit page

Below 768px the MoW unit page SHALL use the character unit page's mobile form: compact navigation bar,
smaller header, and a full-width tab bar that stays visible while scrolling. On Details, Primary,
Secondary and Mythic SHALL be collapsible sections with the level in their header ("Lv 30"), Primary expanded and
the others collapsed. On Ability upgrades the two range groups SHALL stack, Total needed SHALL use two
columns, and the per-level table SHALL scroll horizontally inside its own box. Nothing else SHALL scroll
horizontally at 360px width.

#### Scenario: Mobile Details tab

- **WHEN** a visitor opens a MoW unit page below 768px
- **THEN** Primary is expanded, Secondary collapsed, and the tab bar stays visible while scrolling

#### Scenario: Mobile Ability upgrades

- **WHEN** a visitor opens Ability upgrades below 768px at 360px width
- **THEN** the range groups are stacked, totals are in two columns, and only the per-level table box
  scrolls horizontally

#### Scenario: Desktop layout

- **WHEN** the page is at least 768px wide
- **THEN** the Primary, Secondary and Mythic panels share a grid, and the two range groups are side by side

### Requirement: MoW page tours

The Machines of War list and the MoW unit page SHALL each have a page tour on desktop and mobile. The unit
page tour SHALL cover the header and values control, the tabs, an ability panel, and the Ability upgrades
range controls and totals. A step whose target is not on the page SHALL be left out.

#### Scenario: Tour on a MoW without rules text

- **WHEN** a visitor starts the unit page tour on Galatian
- **THEN** the tour runs, its ability step targets the Primary panel, and no step targets an absent element

### Requirement: Localized MoW pages

Every new visible string SHALL be localized in English, German, Spanish and French. MoW and ability names
SHALL come from the game-text namespaces, falling back to English when a language has no entry.

#### Scenario: Spanish visitor

- **WHEN** a visitor uses the app in Spanish
- **THEN** the tab labels, calculator labels and missing-text note are Spanish
