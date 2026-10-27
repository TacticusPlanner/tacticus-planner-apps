## MODIFIED Requirements

### Requirement: Collection lists every catalog unit in one list grouped by faction

The Collection page at `/my-game/collection` SHALL list every character and every Machine of War in the game catalog that matches the active search, filters and quick filter (every unit when none is active) in one list, grouped by faction. Each faction group SHALL contain that faction's matching characters and Machines of War together, and a faction with no matching unit SHALL NOT be shown. Faction groups SHALL be ordered by alliance in the game's canonical order (Imperial, Chaos, Xenos, then any other alliance), then by localized faction name, whatever sort is selected. Within a group, owned units SHALL come before unowned units; owned units SHALL be ordered by the selected sort (see "Collection sorts units within each faction"), whose default, Rarity, orders them by progression (rarity and stars) descending, then rank descending, then localized name; unowned units SHALL be ordered nearest to unlock first (the larger share of the unlock cost already collected; units without an unlock cost after those with one), then by localized name, under every sort. A unit SHALL appear at most once. The page SHALL show a summary of how many of the listed units are owned out of the listed total (for example "84 of 131 units owned"); while a search, filter or quick filter is active the summary SHALL say that it counts matching units only (for example "12 of 40 matching units owned"). While no roster is available the summary SHALL NOT be shown.

Assumption: a unit is owned exactly when it has a record in the synced `characters` or `mows` player data; the game API never returns a roster record for an unowned unit.

#### Scenario: Characters and Machines of War share their faction group

- **GIVEN** the player owns the Ultramarines characters Marneus Calgar and Titus and does not own the Ultramarines Machine of War, and no filter is active
- **WHEN** they open `/my-game/collection`
- **THEN** one Ultramarines group lists Calgar and Titus (owned, ordered by progression then rank) followed by the greyed-out Machine of War

#### Scenario: Summary counts owned units

- **GIVEN** the catalog contains 131 characters and Machines of War, the player's roster contains 84 of them, and no filter is active
- **WHEN** the page renders
- **THEN** the summary reads 84 of 131 units owned

#### Scenario: Summary counts the filtered set

- **GIVEN** the player owns 12 of the 40 Imperial units and filters by the Imperial alliance
- **WHEN** the page renders
- **THEN** the summary reads 12 of 40 matching units owned and only Imperial faction groups are shown

#### Scenario: Group order

- **WHEN** the page renders, under any sort
- **THEN** every Imperial faction group appears before every Chaos group, every Chaos group before every Xenos group, and groups within one alliance are ordered by their localized names

#### Scenario: Unowned units nearest to unlock come first

- **GIVEN** the player owns neither Calgar (75 of 400 shards) nor another Ultramarines character (300 of 400 shards)
- **WHEN** the page renders, under any sort
- **THEN** the character with 300 of 400 shards is listed before Calgar

### Requirement: Collection has a page tour

The Collection page SHALL register a page tour, startable from the page's tour control, that explains the toolbar (search, sort and filters), the quick filters, the faction groups, an owned tile's progression indicators, greyed-out unowned units, and that selecting a tile opens that unit's Library page, on both desktop and mobile. Tour steps SHALL target elements that exist in the rendered layout of each form; a step whose element is absent (the summary without a roster, an owned tile when the player owns no unit or none matches, an unowned tile when none is listed, any tile or faction group when the filters match nothing) SHALL be left out. Whichever tile steps remain SHALL still tell the player that a tile opens its Library page.

#### Scenario: Desktop tour

- **GIVEN** a desktop viewport
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the desktop layout, the steps include the toolbar and the quick filters, and a tile step says that a tile opens the unit's Library page

#### Scenario: Mobile tour

- **GIVEN** a mobile viewport
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the mobile layout (the toolbar's Filters button, not the closed filter sheet), the steps include the quick filters, and a tile step says that a tile opens the unit's Library page

#### Scenario: Tour without owned units

- **GIVEN** the user is signed out, so every tile is greyed out and the owned-tile step is left out
- **WHEN** they start the page tour
- **THEN** the unowned-tile step still says that selecting a tile opens the unit's Library page

#### Scenario: Tour with no matching units

- **GIVEN** the active filters match no unit
- **WHEN** the user starts the page tour
- **THEN** the tour covers the toolbar and quick filters and leaves out the faction and tile steps

## ADDED Requirements

### Requirement: Collection has a toolbar with search, sort, filters and quick filters

The Collection page SHALL show a toolbar above the faction groups whenever the catalog has loaded, with a name search, a Sort control, a Filters control and a row of quick-filter chips. The toolbar SHALL show how many filters are active (search, each standalone filter that is set, and the quick filter each count as one), and while any is active it SHALL offer a Clear filters action that removes the search, every standalone filter and the quick filter in one step and leaves the sort unchanged. The quick-filter chips SHALL be a single-select group: selecting a chip selects that quick filter, selecting the selected chip again clears it. While the catalog is loading or has failed to load, the toolbar SHALL NOT be shown.

On desktop (at least 768px) the search, Sort and Filters controls SHALL sit on one row; the Filters control SHALL expand and collapse the standalone filter controls inline below that row, opening expanded when a standalone filter is already active; the quick-filter chips SHALL sit below, wrapping onto further rows rather than scrolling horizontally.

On mobile (below 768px) the search SHALL take the full width with the Sort and Filters controls below it; the Filters control SHALL open the standalone filter controls in a bottom sheet with its own Clear filters action and a Done action that closes it; the quick-filter chips SHALL wrap below the toolbar; the page SHALL NOT scroll horizontally at 420px.

#### Scenario: Active filter count and clear

- **GIVEN** the user has searched "ti", set the Imperial alliance filter and selected the Need to level quick filter, with sort Rank
- **WHEN** they look at the toolbar
- **THEN** it reports 3 active filters, and Clear filters empties the search, removes the alliance filter and the quick filter, lists every unit again, and keeps sort Rank

#### Scenario: Quick filter chips are single-select

- **GIVEN** the Can ascend chip is selected
- **WHEN** the user selects the Need to level chip, then selects it again
- **THEN** first only Need to level is selected, then no quick filter is selected

#### Scenario: Desktop toolbar

- **GIVEN** a desktop viewport and no active standalone filter
- **WHEN** the page renders and the user then activates the Filters control
- **THEN** search, Sort and Filters share one row with the standalone filters collapsed, and activating Filters shows them inline below the row without covering the faction groups

#### Scenario: Mobile toolbar

- **GIVEN** a mobile viewport at 420px
- **WHEN** the user activates the Filters control, sets a rarity filter and selects Done
- **THEN** a bottom sheet with the standalone filters opens, Done closes it, the list shows only units of that rarity, the Filters control shows 1 active filter, and the page does not scroll horizontally

### Requirement: Collection sorts units within each faction

The Sort control SHALL offer Rarity (the default), Rank, Abilities and Shards. The selected sort SHALL order owned units within each faction group; every sort SHALL keep owned units before unowned units, keep unowned units nearest to unlock first, and keep the faction group order. Ties under any sort SHALL fall back to the Rarity order (progression descending, then rank descending), then localized name.

- **Rarity:** progression (rarity, then stars) descending, then rank descending.
- **Rank:** rank descending; owned Machines of War, which have no rank, after the owned characters of their group.
- **Abilities:** the sum of the unit's two ability levels (active plus passive for a character, primary plus secondary for a Machine of War) descending.
- **Shards:** owned units at or past one blue star (Legendary one blue star and every Mythic step) first, ordered by mythic shards descending; then the remaining owned units ordered by shards descending.

Power, Blackstone value and faction-total sorts SHALL NOT be offered.

#### Scenario: Sort by rank

- **GIVEN** an Ultramarines group where the player owns Titus at Gold 1, Calgar at Diamond 1 and the Ultramarines Machine of War, and does not own one character
- **WHEN** the user selects sort Rank
- **THEN** the group lists Calgar, Titus, the Machine of War, then the unowned character

#### Scenario: Sort by abilities

- **GIVEN** owned units in one faction with active/passive (or primary/secondary) levels 40/38 (sum 78), 50/20 (sum 70) and 45/33 (sum 78), the two 78s at Legendary red four stars and Epic red three stars respectively
- **WHEN** the user selects sort Abilities
- **THEN** the order is the Legendary 78, the Epic 78 (tie broken by progression), then the 70

#### Scenario: Sort by shards across the blue-star boundary

- **GIVEN** owned units in one faction: A at Legendary red five stars with 480 shards, B at Legendary one blue star with 12 mythic shards and 300 shards, C at Mythic two blue stars with 40 mythic shards
- **WHEN** the user selects sort Shards
- **THEN** the order is C (40 mythic), B (12 mythic), A (480 shards), because units at or past one blue star sort by mythic shards ahead of those below it

#### Scenario: Unowned order is fixed

- **GIVEN** a faction with two unowned characters at 300 of 400 and 75 of 400 shards
- **WHEN** the user switches between every sort option
- **THEN** both stay after the owned units, the 300-shard character first

### Requirement: Collection standalone filters narrow the list

The Filters control SHALL offer these standalone filters; every set filter SHALL apply together with the others, with the search and with the quick filter (a unit is listed only when it matches all of them):

- **Name search:** a unit matches when its localized name or its catalog (English) name contains the search text, ignoring case and diacritics; surrounding whitespace is ignored and empty text matches every unit.
- **Alliance:** one of the game's alliances, or any.
- **Faction:** any number of factions, each shown with its icon; a unit matches when its faction is one of them.
- **Rarity:** any number of rarities; an owned unit matches on its current rarity, an unowned character on the rarity it starts at, and an unowned Machine of War (which has no starting rarity in the catalog) never matches while this filter is set.
- **Rank range:** a lowest and a highest rank (inclusive, either end optional); only owned characters can match while it is set.
- **Ownership:** owned, not owned, or all.
- **Unit kind:** characters, Machines of War, or all.

#### Scenario: Search by localized name

- **GIVEN** the UI language is German and the user types the German name of a character in any letter case
- **WHEN** the list updates
- **THEN** that character is listed and units whose localized and catalog names do not contain the text are not

#### Scenario: Filters combine

- **GIVEN** the Imperial alliance filter, the Legendary rarity filter and the Machines of War kind filter are set
- **WHEN** the list updates
- **THEN** only Imperial Machines of War the player owns at Legendary are listed, because unowned Machines of War have no starting rarity

#### Scenario: Rank range

- **GIVEN** the rank range is Gold 1 to Diamond 3
- **WHEN** the list updates
- **THEN** only owned characters at a rank from Gold 1 through Diamond 3 are listed; no Machine of War and no unowned unit is listed

#### Scenario: Faction with no match is hidden

- **GIVEN** the search matches only Ultramarines units
- **WHEN** the list updates
- **THEN** only the Ultramarines faction group is shown, and its header count shows owned out of the matching Ultramarines units

#### Scenario: No unit matches

- **GIVEN** the filters match no unit
- **WHEN** the list updates
- **THEN** the page shows an empty state saying no unit matches the filters, with a Clear filters action, instead of a blank area; the summary is not shown

### Requirement: Collection quick filters follow defined progression rules

The quick filters SHALL be Ready to rank up, Need to ascend, Can ascend, Need to level and Blue star ready. A quick filter SHALL match only owned units and SHALL be evaluated for each unit on its own, against the player's whole synced inventory (the same items count toward every unit). Each SHALL follow exactly the rule below; "maximum rank for its rarity" is Iron 1 for Common, Bronze 1 for Uncommon, Silver 1 for Rare, Gold 1 for Epic, Diamond 3 for Legendary and Adamantine 2 for Mythic, and "level cap for its rarity" is 8, 17, 26, 35, 50 and 60 respectively.

- **Need to ascend** (V1 rule extended to Mythic): an owned character whose rank equals the maximum rank for its rarity and that still has an ascension step ahead (every unit except one at Mythic wings). A Mythic character at Adamantine 2 below Mythic wings matches. Machines of War never match.
- **Need to level** (V1 rule, with V2's caps): an owned character that does not need to ascend and whose XP level is below the level cap for its rarity. Machines of War never match.
- **Can ascend** (V1 rule extended to Mythic, with orbs): an owned character or Machine of War with an ascension step ahead whose held shards, mythic shards and ascension orbs all cover the ascension cost from its current step up to and including the target step. Below Mythic the target is the first step of the next rarity; for a Mythic unit it is the next Mythic step (two blue stars, three blue stars, then Mythic wings). A unit at Mythic wings never matches.
- **Blue star ready** (V1 rule, with orbs): an owned character or Machine of War below Legendary one blue star (and not Mythic) whose held shards and ascension orbs cover the ascension cost from its current step up to and including Legendary one blue star.
- **Ready to rank up** (new in V2; V1 has no such filter): an owned character below the maximum rank for its rarity, for which the player's upgrade inventory covers every base material needed by the upgrades of its current rank that are not applied yet. Each needed upgrade and each owned upgrade is broken down through its crafting recipe (recursively) into base materials before they are compared, so an already-crafted upgrade counts toward its materials. A character with all six slots of its current rank applied matches. XP level is not checked.

Assumptions:

- Ascension cost per step is the catalog's ascension cost ladder (the shards, mythic shards and ascension orbs, with the orbs' rarity, needed to reach each step from the previous one); the cost of a path is the sum over the steps after the current one up to and including the target step, with orbs summed separately per orb rarity. At the time of writing that ladder is: Epic red two stars 65 shards; Epic red three stars 85 shards; Legendary red three stars 100 shards and 10 Legendary orbs; Legendary red four stars 150 shards and 10 Legendary orbs; Legendary red five stars 250 shards and 15 Legendary orbs; Legendary one blue star 500 shards and 20 Legendary orbs; Mythic one blue star 20 mythic shards and 10 Mythic orbs; Mythic two blue stars 30 mythic shards and 10 Mythic orbs; Mythic three blue stars 50 mythic shards and 15 Mythic orbs; Mythic wings 100 mythic shards and 25 Mythic orbs.
- Ascension orbs are spent from the player's synced orb inventory of the unit's own alliance (Imperial, Chaos or Xenos), at the rarity each step names.
- Machines of War ascend along the same ladder as characters and spend orbs of their alliance (as in V1).
- A Mythic character's maximum rank (Adamantine 2) does not change between Mythic steps; a Mythic character at Adamantine 2 is still listed by Need to ascend until it reaches Mythic wings.
- Applied upgrades of the current rank come from the synced roster's applied upgrade slots; the upgrades of every rank below the current one are applied.

#### Scenario: Can ascend — worked example

- **GIVEN** Titus (Imperial) is owned at Epic red one star with 260 shards, and the player holds 10 Imperial Legendary orbs
- **WHEN** the Can ascend quick filter is selected
- **THEN** the cost to Legendary red three stars is 65 (Epic red two stars) + 85 (Epic red three stars) + 100 (Legendary red three stars) = 250 shards and 0 + 0 + 10 = 10 Imperial Legendary orbs; 260 ≥ 250 and 10 ≥ 10, so Titus is listed; with 240 shards, or with 9 Imperial Legendary orbs, he is not

#### Scenario: Can ascend from Legendary needs mythic shards and both orb rarities

- **GIVEN** an Imperial unit is owned at Legendary red four stars with 800 shards and 15 mythic shards, and the player holds 40 Imperial Legendary orbs and 10 Imperial Mythic orbs
- **WHEN** the Can ascend quick filter is selected
- **THEN** the path to Mythic one blue star costs 250 + 500 = 750 shards, 20 mythic shards, 15 + 20 = 35 Legendary orbs and 10 Mythic orbs; shards (800 ≥ 750) and orbs (40 ≥ 35, 10 ≥ 10) are covered but 15 < 20 mythic shards, so the unit is not listed

#### Scenario: Can ascend within Mythic

- **GIVEN** a Xenos unit is owned at Mythic one blue star with 35 mythic shards, and the player holds 10 Xenos Mythic orbs
- **WHEN** the Can ascend quick filter is selected
- **THEN** the next step, Mythic two blue stars, costs 30 mythic shards and 10 Mythic orbs; 35 ≥ 30 and 10 ≥ 10, so the unit is listed; a unit at Mythic wings is never listed

#### Scenario: Orbs of another alliance do not count

- **GIVEN** an Imperial unit at Epic red one star with 260 shards, and the player holds 50 Chaos Legendary orbs and no Imperial Legendary orbs
- **WHEN** the Can ascend quick filter is selected
- **THEN** the unit is not listed

#### Scenario: Blue star ready — worked example

- **GIVEN** a Chaos unit is owned at Legendary red three stars with 900 shards, and the player holds 45 Chaos Legendary orbs
- **WHEN** the Blue star ready quick filter is selected
- **THEN** the cost to Legendary one blue star is 150 + 250 + 500 = 900 shards and 10 + 15 + 20 = 45 Legendary orbs; both are covered and the unit is listed; with 44 Chaos Legendary orbs it is not; a unit already at Legendary one blue star or Mythic is never listed

#### Scenario: Need to ascend and Need to level

- **GIVEN** two owned Epic characters: one at Gold 1 with XP level 35, one at Silver 3 with XP level 30
- **WHEN** Need to ascend is selected, then Need to level
- **THEN** Need to ascend lists the Gold 1 character (Gold 1 is the Epic maximum) and not the other; Need to level lists the Silver 3 character (30 < 35, the Epic level cap) and not the Gold 1 one, which needs to ascend

#### Scenario: Need to ascend at Mythic

- **GIVEN** two owned Mythic characters at Adamantine 2: one at two blue stars, one at Mythic wings
- **WHEN** Need to ascend is selected
- **THEN** the two-blue-star character is listed and the Mythic wings character is not

#### Scenario: Ready to rank up — worked example

- **GIVEN** Arjac is owned at Legendary red three stars and Silver 1 (below Diamond 3, the Legendary maximum) with slots 1–4 of Silver 1 applied, so the unapplied upgrades are Ice Troll Hide (crafted from 9 Beast Hide) and Ceramite Sheet (crafted from 6 Subdermal Plating, 6 Ceramite Lump and 1 crafted upgrade made of 6 Fine Purity Seal)
- **AND** the player's inventory holds 1 Ice Troll Hide, 6 Subdermal Plating, 6 Ceramite Lump and 6 Fine Purity Seal
- **WHEN** the Ready to rank up quick filter is selected
- **THEN** the needed base materials are 9 Beast Hide, 6 Subdermal Plating, 6 Ceramite Lump and 6 Fine Purity Seal; the owned base materials are 9 Beast Hide (from the crafted Ice Troll Hide), 6, 6 and 6; every need is covered and Arjac is listed; with 5 Fine Purity Seal he is not

#### Scenario: Quick filters skip unowned units

- **GIVEN** the player does not own Calgar but holds enough Calgar shards to cover the ascension cost from his starting step
- **WHEN** the Can ascend quick filter is selected
- **THEN** Calgar is not listed

### Requirement: Roster-dependent controls are disabled without the data they need

While no synced roster is available (signed out, not synced, only part of the roster synced, or roster read failure), the rank range filter, the ownership filter and every quick filter SHALL be shown disabled with a short explanation that they need a synced roster, and SHALL NOT narrow the list even if their values are present in the URL; the name search, alliance, faction, rarity and unit kind filters and the Sort control SHALL keep working. While the player's upgrade inventory has not synced or could not be read, the Ready to rank up chip SHALL be disabled with an explanation that it needs the synced inventory. While the player's general inventory (which holds the ascension orbs) has not synced or could not be read, the Can ascend and Blue star ready chips SHALL be disabled with the same explanation. Once the missing data arrives, the controls SHALL become available and any of their values held in the URL SHALL apply without a reload. While the catalog data a selected quick filter needs (ascension costs, upgrade recipes) is still loading, the page SHALL show the loading placeholders rather than an unfiltered or empty list. If that catalog data fails to load, only the quick filters that need it SHALL be disabled, with an explanation that their data could not be loaded, and the rest of the page SHALL keep working.

#### Scenario: Quick-filter catalog data fails to load

- **GIVEN** the game catalog's unit data loads but its upgrade recipes fail to load
- **WHEN** the page renders
- **THEN** the units are listed, Ready to rank up is disabled with an explanation that its data could not be loaded, and the other quick filters are available

#### Scenario: Signed out

- **GIVEN** the user is not signed in
- **WHEN** they open the toolbar's filters
- **THEN** rank range, ownership and every quick filter are disabled with an explanation, and search, alliance, faction, rarity and unit kind still narrow the greyed-out list

#### Scenario: Roster-dependent value in a shared link

- **GIVEN** a signed-out user opens a link to `/my-game/collection` that carries the Can ascend quick filter and the Imperial alliance filter
- **WHEN** the page renders
- **THEN** the Imperial filter applies, Can ascend is shown disabled and does not narrow the list

#### Scenario: Inventory not synced

- **GIVEN** a signed-in user whose roster has synced but whose upgrade inventory has not
- **WHEN** they look at the quick filters
- **THEN** Ready to rank up is disabled with an explanation and the other quick filters are available

### Requirement: Collection toolbar state lives in the URL and the sort is remembered

The search text, every standalone filter, the quick filter and the sort SHALL be held in the page URL's query parameters, so that reload, Back and a shared link restore them; a value equal to its default (empty search, unset filter, no quick filter) SHALL NOT appear in the URL. Changing them SHALL replace the current history entry rather than add one. A query value that is not valid (an unknown faction, rarity, rank, quick filter or sort) SHALL be dropped from the URL and treated as unset. The sort the user last selected SHALL also be remembered in this browser and SHALL apply when the URL carries no sort; the default sort, Rarity, applies when neither does. Search, filters and quick filter SHALL NOT be remembered beyond the URL: opening `/my-game/collection` without query parameters shows every unit.

#### Scenario: Reload keeps the view

- **GIVEN** the user has set the Xenos alliance filter, the Can ascend quick filter and sort Shards
- **WHEN** they reload the page
- **THEN** the same filter, quick filter and sort are applied

#### Scenario: Remembered sort on a fresh visit

- **GIVEN** the user last selected sort Rank and later opens `/my-game/collection` from the navigation, with no query parameters
- **WHEN** the page renders
- **THEN** sort Rank is applied and no filter is active

#### Scenario: Invalid value in the URL

- **GIVEN** the URL carries an unknown quick filter value
- **WHEN** the page renders
- **THEN** that value is removed from the URL and no quick filter is applied
