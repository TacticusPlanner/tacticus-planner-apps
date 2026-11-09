# player-collection Specification

## Purpose

Shows the player's whole unit collection on the My Game Collection page: every catalog character and Machine of War, grouped by faction, with each owned unit's synced progression and each unowned unit's shard progress, so a player can see at a glance what they own and how far each unit is.

## Requirements

### Requirement: Collection lists every catalog unit in one list grouped by faction

The Collection page at `/my-game/collection` SHALL list every character and every Machine of War in the game catalog that matches the active search, filters and quick filter (every unit when none is active) in one list. While faction grouping is on (the default), the list SHALL be grouped by faction; while it is off, the list follows "Faction grouping can be switched off", and the rules below for faction groups and their order do not apply, while the summary rules still do. Each faction group SHALL contain that faction's matching characters and Machines of War together, and a faction with no matching unit SHALL NOT be shown. Faction groups SHALL be ordered by alliance in the game's canonical order (Imperial, Chaos, Xenos, then any other alliance), then by localized faction name, whatever sort is selected. Within a group, owned units SHALL come before unowned units; owned units SHALL be ordered by the selected sort (see "Collection sorts units within each faction"), whose default, Rarity, orders them by progression (rarity and stars) descending, then rank descending, then localized name; unowned units SHALL be ordered nearest to unlock first (the larger share of the unlock cost already collected; units without an unlock cost after those with one), then by localized name, under every sort. A unit SHALL appear at most once. The page SHALL show a summary of how many of the listed units are owned out of the listed total (for example "84 of 131 units owned"); while a search, filter or quick filter is active the summary SHALL say that it counts matching units only (for example "12 of 40 matching units owned"). While no roster is available the summary SHALL NOT be shown.

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

### Requirement: Collection lays factions out as an aligned full-width grid

The Collection page SHALL use the full width of the content area, with no maximum-width cap, in every view. In the Cards view, faction groups SHALL be cards of equal width in a responsive grid that adds columns as the window widens, with cards in the same row sharing one height. Each faction card SHALL have a header bar in that faction's colour showing the faction icon, the localized faction name and the faction's owned/total unit count (the count is omitted while no roster is available). Inside a card, units SHALL sit in fixed slots so that portraits line up across cards: seven slots per row on desktop (at least 768px) and five per row on mobile (below 768px). A faction with more units than one row holds SHALL wrap to further rows inside its card. Every faction header colour SHALL give at least 4.5:1 contrast with the header text.

Assumption: no faction in the current catalog has more than seven characters and Machines of War combined, so on desktop every faction fits one row.

#### Scenario: Desktop faction card

- **GIVEN** a desktop viewport showing the Cards view and the player owns 4 of the 6 Blood Angels units
- **WHEN** the page renders
- **THEN** the Blood Angels card header shows the faction icon, "Blood Angels" and 4/6, and all six units sit on one row

#### Scenario: Mobile faction card

- **GIVEN** a mobile viewport showing the Cards view
- **WHEN** a faction with seven units renders
- **THEN** its card shows five units on the first row and two on the second, and the page does not scroll horizontally at 420px

#### Scenario: Cards align

- **GIVEN** a desktop viewport wide enough for several faction columns, showing the Cards view
- **WHEN** the page renders
- **THEN** all faction cards have the same width and cards in the same row have the same height

### Requirement: An owned unit tile shows its progression at a glance

Each owned unit SHALL be shown as a tile with a round portrait ringed in its current rarity's colour, its stars over the top edge of the portrait, and one shard count inside a shard crystal at the portrait's lower right: its regular shards below the first blue star, and its mythic shards (in the mythic crystal) from the first blue star on, since every further ascension costs mythic shards. Below the portrait the tile SHALL show the unit's localized name on one line (truncated with an ellipsis when too long), then a row of number boxes, then an equipment row. An owned character's tile SHALL show its rank badge at the portrait's lower left, number boxes for active ability level, XP level and passive ability level in that order, with the XP level visually distinct from the ability levels, and its three equipment slots, each filled slot showing the item's icon framed in the item's rarity colour with the item level, and an empty slot shown as an empty outline. An owned Machine of War's tile SHALL show number boxes for its primary and secondary ability levels on the sides of the row and SHALL NOT show rank, XP level or equipment; it SHALL keep the same tile height as a character tile. Tiles SHALL NOT show power or Blackstone value. Text on a tile SHALL be at least 12px, except the shard count inside the crystal, which MAY be smaller because the tile's accessible name also carries it. Every tile SHALL expose an accessible name that spells out the unit's name and progression, with its images hidden from assistive technology.

#### Scenario: Owned character tile

- **GIVEN** the synced roster has Titus at Legendary with four red stars, rank Gold 1, XP level 45, active ability 40, passive ability 38, three equipped items, 120 shards and 4 mythic shards
- **WHEN** the Collection page renders
- **THEN** Titus's tile shows a Legendary ring with four red stars, the Gold 1 rank badge, 120 in the shard crystal and no mythic count, the name Titus, number boxes 40, 45 and 38 (abilities either side of the XP level, as in game), and the three equipped items with their levels, and shows no power value

#### Scenario: Blue-star unit shows mythic shards only

- **GIVEN** the synced roster has a unit at Legendary with one blue star, 300 shards and 12 mythic shards
- **WHEN** the page renders
- **THEN** its tile shows 12 in the mythic shard crystal and does not show the 300 regular shards

#### Scenario: Owned Machine of War tile

- **GIVEN** the synced roster has a Machine of War with primary ability 30 and secondary ability 25
- **WHEN** the page renders
- **THEN** its tile shows its rarity ring and stars, number boxes 30 and 25, and its shards, shows no rank, XP level or equipment, and is as tall as the character tiles next to it

#### Scenario: Accessible name spells out progression

- **WHEN** assistive technology reads Titus's tile
- **THEN** it announces one tile naming Titus with his rarity, stars, rank, XP level, ability levels and shards

### Requirement: Collection tiles open the unit's Library page

Every tile on the Collection page SHALL be a link to its unit's Library page: `/library/characters/<id>` for a character and `/library/machines-of-war/<id>` for a Machine of War, where `<id>` is the unit's catalog id. This SHALL hold for owned tiles, unowned tiles, and the greyed-out tiles shown while no roster is available (signed out, not synced, or roster read failure). The whole tile SHALL be the click and tap target, the full width of its slot. The link SHALL keep the tile's spelled-out accessible name and expose no other name, SHALL be reachable with the keyboard in DOM order (faction by faction, left to right) and activated with Enter, and SHALL show a visible focus indicator. Hovering a tile on a pointer device SHALL give visible feedback. Activating a tile SHALL open the unit page in the same tab, as a normal link that can also be opened in a new tab.

The opened page SHALL know it was opened from Collection (see the `character-unit-details` and `mow-unit-details` navigation requirements). That origin SHALL carry, for the opened unit's kind only, the units of that kind in the order Collection showed them (faction group by faction group, then the order within each group), and SHALL NOT appear in the URL.

#### Scenario: Opening an owned character

- **GIVEN** a signed-in player whose synced roster has Titus
- **WHEN** they click or tap Titus's tile
- **THEN** the browser navigates to `/library/characters/<Titus's id>` and the page shows Titus with the player's own progression

#### Scenario: Opening a Machine of War

- **WHEN** the user activates a Machine of War's tile, owned or not
- **THEN** the browser navigates to `/library/machines-of-war/<its id>`

#### Scenario: Opening an unowned unit

- **GIVEN** the player does not own Calgar
- **WHEN** they activate Calgar's greyed-out tile
- **THEN** the browser navigates to Calgar's Library page, which shows catalog values because the player has no Calgar

#### Scenario: Signed out

- **GIVEN** the user is not signed in and every tile is greyed out
- **WHEN** they activate a character's tile
- **THEN** the browser navigates to that character's Library page, which shows catalog data only

#### Scenario: Keyboard

- **WHEN** a keyboard user tabs through the page
- **THEN** focus moves through the tiles in DOM order with a visible focus indicator, each focused tile is announced as a link with the tile's spelled-out accessible name, and Enter opens its Library page

#### Scenario: Open in a new tab

- **WHEN** the user middle-clicks a tile or opens it with the browser's "open in new tab"
- **THEN** the unit's Library page opens in a new tab, and that page behaves as if opened from a link (back returns to its Library list)

### Requirement: An unowned unit tile is greyed out with its shard progress

A catalog unit that is not in the synced roster SHALL be shown with its portrait greyed out, a dashed neutral ring, a lock badge and its name in muted text, and SHALL NOT show stars, rank, the shard crystal, number boxes or equipment. An unowned character SHALL show the player's current shards for it out of the shards required to unlock it, together with a progress bar exposed as a progressbar to assistive technology. An unowned Machine of War SHALL show the player's current shard count alone, without a target or bar, because the catalog defines neither its initial rarity nor its unlock cost. Either kind SHALL show its mythic shards when the player has any. When the player's unowned-unit shard data is not available, the tile SHALL show no shard count rather than a count of zero. An unowned tile SHALL be as tall as an owned tile.

Assumptions:

- Shard and mythic-shard counts for an unowned unit come from the player's synced unowned-unit shard inventory; a unit missing from that inventory has 0 of each.
- The shards required to unlock a character come from the catalog's unlock shard cost for that character's initial rarity.
- The catalog carries no initial rarity or unlock shard cost for Machines of War.

#### Scenario: Unowned character with shards

- **GIVEN** the player does not own Calgar, has 75 Calgar shards, and the catalog unlock cost for Calgar's initial rarity is 400 shards
- **WHEN** the page renders
- **THEN** Calgar's tile is greyed out with a lock badge, shows 75 / 400 with a progress bar at about 19%, and shows no stars, rank, number boxes or equipment

#### Scenario: Unowned character with no shards

- **GIVEN** the shard inventory is synced and has no entry for an unowned character whose unlock cost is 400
- **WHEN** the page renders
- **THEN** that character's tile shows 0 / 400 with an empty progress bar

#### Scenario: Unowned Machine of War

- **GIVEN** the player does not own a Machine of War and has 30 of its shards
- **WHEN** the page renders
- **THEN** its tile is greyed out with a lock badge and shows 30 shards with no unlock target or bar

### Requirement: Without a roster every unit is shown greyed out with a prompt

A synced roster is available only once both the characters and the Machines of War data have synced; while either is missing the page SHALL treat the roster as not synced. When no synced roster is available, the page SHALL still list every catalog unit grouped and ordered as for unowned units, all greyed out with no shard counts, together with a prompt explaining why. In place of shard progress, a character's tile SHALL show the rarity it starts at (for example "Starts Epic"); a Machine of War's tile SHALL show nothing there. For an anonymous user the prompt SHALL invite them to sign in. For a signed-in user whose roster has not been synced yet, the prompt SHALL invite them to sync with Tacticus and offer the existing Sync with Tacticus action. Once a sync delivers the roster, the page SHALL show owned and unowned tiles without a reload.

#### Scenario: Anonymous user

- **GIVEN** the user is not signed in
- **WHEN** they open `/my-game/collection`
- **THEN** every catalog unit is listed greyed out by faction, characters show their starting rarity, no owned summary or faction owned counts are shown, and a prompt invites them to sign in

#### Scenario: Signed in but not synced

- **GIVEN** the user is signed in and their roster has not been synced
- **WHEN** they open the page
- **THEN** every unit is listed greyed out and a prompt invites them to sync with Tacticus, offering the Sync with Tacticus action

#### Scenario: Only part of the roster has synced

- **GIVEN** a signed-in user whose characters data has synced but whose Machines of War data has not
- **WHEN** they open the page
- **THEN** every unit is listed greyed out with the sync prompt, and no owned summary is shown

#### Scenario: Sync completes while the page is open

- **GIVEN** a signed-in user is on the page without a synced roster
- **WHEN** a sync with Tacticus completes and delivers their roster
- **THEN** the prompt disappears and the page shows their owned units and greyed-out unowned units without a page reload

### Requirement: Collection distinguishes loading and load failure

While the game catalog is loading, the page SHALL show placeholder faction cards (skeletons that do not animate when the user prefers reduced motion), marked busy for assistive technology, and SHALL NOT show the no-roster prompt or any unit tile. If the game catalog fails to load, the page SHALL show an error with a retry action instead of an empty list. If the catalog loads but the player's roster fails to load for a signed-in user, the page SHALL show the catalog greyed out as in the no-roster state, with an error message and retry instead of the sync prompt.

#### Scenario: Catalog loading

- **WHEN** the page opens before the game catalog is available
- **THEN** placeholder faction cards are shown, marked busy, and no unit tiles or prompts are shown

#### Scenario: Catalog failure

- **GIVEN** the game catalog fails to load
- **WHEN** the page renders
- **THEN** an error with a retry action is shown and no empty list is presented as if the catalog had no units

#### Scenario: Roster read failure

- **GIVEN** a signed-in user, the catalog loads, and reading their roster fails
- **WHEN** the page renders
- **THEN** every unit is shown greyed out with an error message and a retry action, not the sync prompt

### Requirement: Collection has a page tour

The Collection page SHALL register a page tour, startable from the page's tour control, on both desktop and mobile. The tour SHALL explain:

- the toolbar (search, sort and filters);
- the view switch and the Group by faction and Hide unowned switches;
- the quick filters;
- the faction groups;
- an owned unit's progression indicators;
- greyed-out unowned units;
- that selecting a unit opens that unit's Library page.

While faction grouping is off there are no faction groups, so the faction step SHALL be left out; the unit steps still target tiles or rows.

The faction and unit steps SHALL target the view currently shown: a faction card and tiles in the Cards view, a faction section and rows in the Roster view. In the Roster view on mobile, the unit step SHALL say that tapping a row expands it and that the expanded row opens the Library page.

Tour steps SHALL target elements that exist in the rendered layout of each form. A step whose element is absent SHALL be left out:

- the summary, when no roster is available;
- the owned unit, when the player owns no unit or none matches;
- the unowned unit, when none is listed (including while unowned units are hidden);
- any unit or faction group, when the filters match nothing.

Whichever unit steps remain SHALL still tell the player how a unit opens its Library page.

#### Scenario: Desktop tour

- **GIVEN** a desktop viewport showing the Cards view
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the desktop layout, the steps include the toolbar, the view switch and the quick filters, and a tile step says that a tile opens the unit's Library page

#### Scenario: Mobile tour

- **GIVEN** a mobile viewport showing the Cards view
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the mobile layout (the toolbar's Filters button, not the closed filter sheet), the steps include the view select and the quick filters, and a tile step says that a tile opens the unit's Library page

#### Scenario: Desktop tour in the Roster view

- **GIVEN** a desktop viewport showing the Roster view with owned and unowned units listed
- **WHEN** the user starts the page tour
- **THEN** the faction step highlights a roster section, the unit steps highlight roster rows, and a unit step says that a row opens the unit's Library page

#### Scenario: Mobile tour in the Roster view

- **GIVEN** a mobile viewport showing the Roster view
- **WHEN** the user starts the page tour
- **THEN** the unit steps highlight roster rows, and a unit step says that tapping a row expands it and the expanded row opens the unit's Library page

#### Scenario: Tour without owned units

- **GIVEN** the user is signed out, so every unit is greyed out and the owned-unit step is left out
- **WHEN** they start the page tour
- **THEN** the unowned-unit step still says how a unit opens its Library page

#### Scenario: Tour with unowned units hidden

- **GIVEN** Hide unowned is on
- **WHEN** the user starts the page tour
- **THEN** the unowned-unit step is left out and the owned-unit step says how a unit opens its Library page

#### Scenario: Tour with grouping off

- **GIVEN** Group by faction is off
- **WHEN** the user starts the page tour
- **THEN** the faction step is left out and the unit steps highlight a tile (Cards) or a row (Roster)

#### Scenario: Tour with no matching units

- **GIVEN** the active filters match no unit
- **WHEN** the user starts the page tour
- **THEN** the tour covers the toolbar, the view switch and the quick filters and leaves out the faction and unit steps

### Requirement: Collection has a toolbar with search, sort, filters and quick filters

The Collection page SHALL show a toolbar above the faction groups whenever the catalog has loaded. The toolbar SHALL contain:

- a name search;
- a Sort control;
- a Filters control;
- the view switch;
- the Hide unowned switch;
- the Group by faction switch;
- a row of quick-filter chips.

The toolbar SHALL show how many filters are active. The search, each standalone filter that is set, and the quick filter each count as one. A range with a lowest and a highest end counts as one. The view, the faction grouping and Hide unowned do not count. While any filter is active, the toolbar SHALL offer a Clear filters action that removes the search, every standalone filter and the quick filter in one step, and leaves the sort, the view, the faction grouping and Hide unowned unchanged.

The quick-filter chips SHALL be a single-select group: selecting a chip selects that quick filter, and selecting the selected chip again clears it.

While the catalog is loading or has failed to load, the toolbar SHALL NOT be shown.

On desktop (at least 768px):

- the search, Sort, Filters, view switch, Group by faction switch and Hide unowned switch SHALL sit on one row, wrapping onto a further row when the window is too narrow, without truncating their labels;
- the Filters control SHALL expand and collapse the standalone filter controls inline below that row, opening expanded when a standalone filter is already active;
- the quick-filter chips SHALL sit below, wrapping onto further rows rather than scrolling horizontally.

On mobile (below 768px):

- the search SHALL take the full width, with the Sort and Filters controls below it, then the view select at full width, with the Group by faction and Hide unowned switches below it;
- the Filters control SHALL open the standalone filter controls in a bottom sheet with its own Clear filters action and a Done action that closes it;
- the quick-filter chips SHALL wrap below the toolbar;
- the page SHALL NOT scroll horizontally at 420px.

#### Scenario: Active filter count and clear

- **GIVEN** the user has searched "ti", set the Imperial alliance filter and selected the Need to level quick filter, with sort Rank and the Roster view
- **WHEN** they look at the toolbar
- **THEN** it reports 3 active filters, and Clear filters empties the search, removes the alliance filter and the quick filter, lists every unit again, and keeps sort Rank and the Roster view

#### Scenario: Quick filter chips are single-select

- **GIVEN** the Can ascend chip is selected
- **WHEN** the user selects the Need to level chip, then selects it again
- **THEN** first only Need to level is selected, then no quick filter is selected

#### Scenario: Desktop toolbar

- **GIVEN** a desktop viewport and no active standalone filter
- **WHEN** the page renders and the user then activates the Filters control
- **THEN** search, Sort, Filters, the view switch and the Group by faction and Hide unowned switches share the toolbar row with the standalone filters collapsed, and activating Filters shows them inline below the row without covering the faction groups

#### Scenario: Mobile toolbar

- **GIVEN** a mobile viewport at 420px
- **WHEN** the user activates the Filters control, sets a rarity filter and selects Done
- **THEN** a bottom sheet with the standalone filters opens, Done closes it, the list shows only units of that rarity, the Filters control shows 1 active filter, the view select and the Group by faction and Hide unowned switches are visible below Sort and Filters, and the page does not scroll horizontally

### Requirement: Collection sorts units within each faction

The Sort control SHALL offer Rarity (the default), Rank, Abilities, Shards and Power. The selected sort SHALL order owned units within each faction group; every sort SHALL keep owned units before unowned units, keep unowned units nearest to unlock first, and keep the faction group order. Ties under any sort SHALL fall back to the Rarity order (progression descending, then rank descending), then localized name.

- **Rarity:** progression (rarity, then stars) descending, then rank descending.
- **Rank:** rank descending; owned Machines of War, which have no rank, after the owned characters of their group.
- **Abilities:** the sum of the unit's two ability levels (active plus passive for a character, primary plus secondary for a Machine of War) descending.
- **Shards:** owned units at or past one blue star (Legendary one blue star and every Mythic step) first, ordered by mythic shards descending; then the remaining owned units ordered by shards descending.
- **Power:** the unit's in-game power, equipped items included, descending; characters and Machines of War are ordered together. An owned unit whose power cannot be computed (its game data is missing) SHALL follow the owned units whose power is known. While the power data is still loading under this sort, the page SHALL show its loading placeholders rather than the list in another order.

Blackstone value and faction-total sorts SHALL NOT be offered.

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

#### Scenario: Sort by power

- **GIVEN** an Ultramarines group where the player owns Calgar (power 3,400), the Ultramarines Machine of War (power 2,000), Titus (power 1,200) and Tigurius, whose power cannot be computed
- **WHEN** the user selects sort Power
- **THEN** the group lists Calgar, the Machine of War, Titus, then Tigurius, then the unowned units

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
- **Rank range:** a lowest and a highest rank (inclusive, either end optional); only owned characters can match while it is set. A range whose lowest rank is above its highest is read with its ends swapped.
- **Stars range:** a lowest and a highest progression step (rarity and stars, inclusive, either end optional); only owned units, characters and Machines of War, can match while it is set. A range set backwards is read with its ends swapped.
- **Unit kind:** characters, Machines of War, or all.

There is no Ownership filter: hiding unowned units is the toolbar's Hide unowned switch, a display setting (see "Hide unowned shows or hides units the player does not own"), and listing only unowned units is not offered.

The Filters control SHALL also offer these combat filters, ported from V1's characters page. They read only the catalog, so they apply to owned and unowned characters alike and work without a roster. A Machine of War, which has none of these properties, SHALL NOT match while any of them is set. Each control offers only the values that occur in the catalog.

- **Attack type:** melee or ranged, or any. Melee matches a character with no ranged attack; ranged matches a character with one.
- **Hits:** a lowest and a highest number of hits per attack (inclusive, either end optional). With attack type melee the melee hit count must be in range; with ranged, the ranged hit count; with neither, either count.
- **Movement:** one movement value; a character matches when its movement equals it.
- **Range:** a lowest and a highest attack range (inclusive, either end optional); a character with no ranged attack never matches while it is set.
- **Damage types:** any number of damage types, each shown with its icon; a character matches when every picked type is among the damage types of its melee attack, ranged attack, active ability and passive ability.
- **Traits:** any number of traits, each shown with its icon; a character matches when it has every picked trait. Mechanical is also met by Living Metal, as in V1.
- **Shard source:** any number of shard sources (the campaign types Standard, Elite, Mirror, Elite Mirror and Extremis, and "not in a campaign"); a character matches when its shards drop in at least one picked campaign type, or, for "not in a campaign", when they drop in none.

Assumption: a character's damage types come from the catalog's melee and ranged damage and its ability damage lists. Some characters' ability damage is not in the served data yet, so for them only attack damage counts.

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

#### Scenario: Rank range set backwards

- **GIVEN** the lowest rank is set to Diamond 3 and the highest to Gold 1
- **WHEN** the list updates
- **THEN** the same characters are listed as for Gold 1 to Diamond 3, and the two selects show Gold 1 to Diamond 3

#### Scenario: Hits with an attack type

- **GIVEN** two characters: A with 4 melee hits and no ranged attack, B with 1 melee hit and 3 ranged hits
- **WHEN** hits is set to 3 to 4, first with no attack type, then with attack type ranged
- **THEN** first both are listed (A on melee hits, B on ranged hits), then only B

#### Scenario: Damage types and traits need every picked value

- **GIVEN** character A deals Bolter and Psychic damage and has Psyker and Flying, character B deals Bolter damage and has Psyker
- **WHEN** damage types Bolter and Psychic are picked, then cleared and traits Psyker and Flying are picked
- **THEN** only A is listed both times

#### Scenario: Mechanical matches Living Metal

- **GIVEN** a Necron character with the Living Metal trait and no Mechanical trait
- **WHEN** the Mechanical trait is picked
- **THEN** that character is listed

#### Scenario: Combat filters leave out Machines of War

- **GIVEN** the attack type filter is set to melee and the user is signed out
- **WHEN** the list updates
- **THEN** greyed-out characters without a ranged attack are listed and no Machine of War is

#### Scenario: Shard source

- **GIVEN** character A's shards drop in Elite and Mirror battles, character B's in no campaign
- **WHEN** the user picks Mirror, then instead picks "not in a campaign"
- **THEN** first A is listed and B is not, then B is listed and A is not

#### Scenario: Faction with no match is hidden

- **GIVEN** the search matches only Ultramarines units
- **WHEN** the list updates
- **THEN** only the Ultramarines faction group is shown, and its header count shows owned out of the matching Ultramarines units

#### Scenario: No unit matches

- **GIVEN** the filters match no unit
- **WHEN** the list updates
- **THEN** the page shows an empty state saying no unit matches the filters, with a Clear filters action, instead of a blank area; the summary is not shown

### Requirement: Collection quick filters follow defined progression rules

The quick filters SHALL be Ready to rank up, Need to ascend, Can promote, Can ascend, Need to level, Blue star ready, Missing equipment and Abilities behind level. A quick filter SHALL match only owned units and SHALL be evaluated for each unit on its own, against the player's whole synced inventory (the same items count toward every unit). Each SHALL follow exactly the rule below; "maximum rank for its rarity" is Iron 1 for Common, Bronze 1 for Uncommon, Silver 1 for Rare, Gold 1 for Epic, Diamond 3 for Legendary and Adamantine 2 for Mythic, and "level cap for its rarity" is 8, 17, 26, 35, 50 and 60 respectively.

- **Need to ascend** (V1 rule extended to Mythic): an owned character whose rank equals the maximum rank for its rarity and that still has an ascension step ahead (every unit except one at Mythic wings). A Mythic character at Adamantine 2 below Mythic wings matches. Machines of War never match.
- **Need to level** (V1 rule, with V2's caps): an owned character that does not need to ascend and whose XP level is below the level cap for its rarity. Machines of War never match.
- **Can promote** (new in V2; V1 has no such filter): an owned character or Machine of War whose next step on the ascension ladder stays within its current rarity (one more star, or the next Mythic step) and whose held shards, mythic shards and ascension orbs cover that one step's cost. A unit on its rarity's last step (Common two stars, Uncommon four stars, Rare red one star, Epic red three stars, Legendary one blue star) never matches, since its next step is an ascension (see Can ascend); a unit at Mythic wings never matches.
- **Can ascend** (V1 rule extended to Mythic, with orbs): an owned character or Machine of War with an ascension step ahead whose held shards, mythic shards and ascension orbs all cover the ascension cost from its current step up to and including the target step. Below Mythic the target is the first step of the next rarity; for a Mythic unit it is the next Mythic step (two blue stars, three blue stars, then Mythic wings). A unit at Mythic wings never matches.
- **Blue star ready** (V1 rule, with orbs): an owned character or Machine of War below Legendary one blue star (and not Mythic) whose held shards and ascension orbs cover the ascension cost from its current step up to and including Legendary one blue star.
- **Missing equipment** (new in V2): an owned character with fewer equipped items than the equipment slots the catalog gives it. Machines of War never match.
- **Abilities behind level** (new in V2): an owned character with an active or passive ability level below its XP level, which is the cap on ability levels. Machines of War never match.
- **Ready to rank up** (new in V2; V1 has no such filter): an owned character below the maximum rank for its rarity, for which the player's upgrade inventory covers every base material needed by the upgrades of its current rank that are not applied yet. Each needed upgrade and each owned upgrade is broken down through its crafting recipe (recursively) into base materials before they are compared, so an already-crafted upgrade counts toward its materials. A character with all six slots of its current rank applied matches; a character whose current rank has no upgrade list in the catalog does not, since nothing could be checked. XP level is not checked.

Assumptions:

- Ascension cost per step is the catalog's ascension cost ladder (the shards, mythic shards and ascension orbs, with the orbs' rarity, needed to reach each step from the previous one); the cost of a path is the sum over the steps after the current one up to and including the target step, with orbs summed separately per orb rarity. At the time of writing that ladder is: Epic red two stars 65 shards; Epic red three stars 85 shards; Legendary red three stars 100 shards and 10 Legendary orbs; Legendary red four stars 150 shards and 10 Legendary orbs; Legendary red five stars 250 shards and 15 Legendary orbs; Legendary one blue star 500 shards and 20 Legendary orbs; Mythic one blue star 20 mythic shards and 10 Mythic orbs; Mythic two blue stars 30 mythic shards and 10 Mythic orbs; Mythic three blue stars 50 mythic shards and 15 Mythic orbs; Mythic wings 100 mythic shards and 25 Mythic orbs.
- Ascension orbs are spent from the player's synced orb inventory of the unit's own alliance (Imperial, Chaos or Xenos), at the rarity each step names.
- Machines of War ascend along the same ladder as characters and spend orbs of their alliance (as in V1).
- A Mythic character's maximum rank (Adamantine 2) does not change between Mythic steps; a Mythic character at Adamantine 2 is still listed by Need to ascend until it reaches Mythic wings.
- Applied upgrades of the current rank come from the synced roster's applied upgrade slots; the upgrades of every rank below the current one are applied.

#### Scenario: Can promote — worked example

- **GIVEN** an Imperial unit is owned at Legendary red three stars with 150 shards, and the player holds 10 Imperial Legendary orbs
- **WHEN** the Can promote quick filter is selected
- **THEN** the next step, Legendary red four stars, costs 150 shards and 10 Legendary orbs; both are covered and the unit is listed; with 9 Imperial Legendary orbs it is not; a unit at Epic red three stars is never listed, however many shards it holds

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

#### Scenario: Missing equipment and Abilities behind level

- **GIVEN** owned character A at XP level 45 with abilities 45 and 40 and two of its three equipment slots filled, and owned character B at XP level 30 with abilities 30 and 30 and every slot filled
- **WHEN** Missing equipment is selected, then Abilities behind level
- **THEN** both times only A is listed

#### Scenario: Quick filters skip unowned units

- **GIVEN** the player does not own Calgar but holds enough Calgar shards to cover the ascension cost from his starting step
- **WHEN** the Can ascend quick filter is selected
- **THEN** Calgar is not listed

### Requirement: Roster-dependent controls are disabled without the data they need

While no synced roster is available (signed out, not synced, only part of the roster synced, or roster read failure), the rank range filter, the stars range filter, the Hide unowned switch and every quick filter SHALL be shown disabled with a short explanation that they need a synced roster, and SHALL NOT narrow the list even if their values are present in the URL; the name search, alliance, faction, rarity, unit kind, combat and shard source filters and the Sort control SHALL keep working. While the player's upgrade inventory has not synced or could not be read, the Ready to rank up chip SHALL be disabled with an explanation that it needs the synced inventory. While the player's general inventory (which holds the ascension orbs) has not synced or could not be read, the Can ascend and Blue star ready chips SHALL be disabled with the same explanation. Once the missing data arrives, the controls SHALL become available and any of their values held in the URL SHALL apply without a reload. While the data a quick filter needs (ascension costs, upgrade recipes, inventory) is still loading, its chip SHALL be disabled, so selecting it never replaces the toolbar with loading placeholders. When a quick filter already in the URL is waiting for that data, the page SHALL show the loading placeholders rather than an unfiltered or empty list. If that catalog data fails to load, only the quick filters that need it SHALL be disabled, with an explanation that their data could not be loaded and a control to try loading it again, and the rest of the page SHALL keep working.

#### Scenario: Quick-filter catalog data fails to load

- **GIVEN** the game catalog's unit data loads but its upgrade recipes fail to load
- **WHEN** the page renders
- **THEN** the units are listed, Ready to rank up is disabled with an explanation that its data could not be loaded and a Try again control, and the other quick filters are available

#### Scenario: Signed out

- **GIVEN** the user is not signed in
- **WHEN** they open the toolbar's filters
- **THEN** rank range, Hide unowned and every quick filter are disabled with an explanation, and search, alliance, faction, rarity and unit kind still narrow the greyed-out list

#### Scenario: Roster-dependent value in a shared link

- **GIVEN** a signed-out user opens a link to `/my-game/collection` that carries the Can ascend quick filter and the Imperial alliance filter
- **WHEN** the page renders
- **THEN** the Imperial filter applies, Can ascend is shown disabled and does not narrow the list

#### Scenario: Inventory not synced

- **GIVEN** a signed-in user whose roster has synced but whose upgrade inventory has not
- **WHEN** they look at the quick filters
- **THEN** Ready to rank up is disabled with an explanation and the other quick filters are available

### Requirement: Collection toolbar state lives in the URL and the sort is remembered

The search text, every standalone filter, the quick filter and the sort SHALL be held in the page URL's query parameters, so that reload, Back and a shared link restore them.

- A value equal to its default (empty search, unset filter, no quick filter) SHALL NOT appear in the URL.
- Changing them SHALL replace the current history entry rather than add one.

Invalid query values SHALL be handled as follows:

- An invalid value SHALL be dropped from the URL and treated as unset. This covers an unknown faction, rarity, rank, progression step, damage type, trait, shard source, quick filter or sort, and a number the catalog does not offer.
- In a list of factions, rarities, damage types, traits or shard sources, only the unknown items SHALL be dropped, and the valid ones SHALL still apply.
- A range set backwards SHALL be rewritten in the URL with its ends swapped.

The search SHALL update the URL once typing pauses, without delaying or dropping typed characters.

The sort the user last selected SHALL also be remembered in this browser and SHALL apply when the URL carries no sort. The default sort, Rarity, applies when neither does.

The view is held and remembered the same way (see "Collection view is remembered").

Search, filters and quick filter SHALL NOT be remembered beyond the URL: opening `/my-game/collection` without query parameters shows every unit.

Hide unowned SHALL be held as `owned=owned`. Unlike the sort, view and grouping, it SHALL NOT be remembered in the browser: it applies only while the URL carries it.

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

#### Scenario: Unknown faction in a shared link

- **GIVEN** the URL's faction list carries two known factions and one unknown faction id
- **WHEN** the page renders
- **THEN** the unknown id is removed from the URL and the two known factions still apply

#### Scenario: Hidden unowned units in a shared link

- **GIVEN** a signed-in user with a synced roster opens a link carrying `owned=owned`
- **WHEN** the page renders
- **THEN** only owned units are listed and Hide unowned is on

### Requirement: Collection switches between the Cards and Roster views

The Collection toolbar SHALL offer a view switch with two views: Cards, the default, and Roster.

- Both views SHALL show the same units in the same order: the same search, filters, quick filter, sort and faction grouping setting.
- Switching views SHALL keep every other toolbar value unchanged.
- The view switch SHALL be shown whenever the toolbar is shown, including while no roster is available.

The view switch takes a different form per layout:

- On desktop (at least 768px) it SHALL be the site's segmented mode control: one joined, labelled single-choice control with one option per view, exposed to assistive technology as a radio group with the selected view checked.
- On mobile (below 768px) it SHALL be a select whose accessible name includes the selected view.

Clear filters SHALL NOT change the view. The selected view SHALL NOT count as an active filter.

#### Scenario: Switching to Roster keeps the filters

- **GIVEN** the Cards view with the Imperial alliance filter and sort Rank
- **WHEN** the user selects Roster
- **THEN** the Roster view lists the same Imperial units in the same faction and unit order, the alliance filter and sort Rank stay applied, and the active filter count is unchanged

#### Scenario: Clear filters keeps the view

- **GIVEN** the Roster view with a search and the Need to level quick filter
- **WHEN** the user selects Clear filters
- **THEN** the search and quick filter are removed and the Roster view is still shown

#### Scenario: Desktop view switch

- **GIVEN** a desktop viewport showing the Cards view
- **WHEN** assistive technology reads the toolbar
- **THEN** it announces a View radio group with Cards checked and Roster not checked

#### Scenario: Mobile view switch

- **GIVEN** a mobile viewport at 420px
- **WHEN** the user opens the view select and picks Roster
- **THEN** the Roster view is shown, the select names Roster as the current view, and the page does not scroll horizontally

#### Scenario: Signed out

- **GIVEN** the user is not signed in
- **WHEN** they select Roster
- **THEN** every catalog unit is shown as a greyed-out roster row grouped by faction, under the sign-in prompt

### Requirement: Hide unowned shows or hides units the player does not own

The Collection toolbar SHALL show a Hide unowned switch. It hides units the player does not own and is a display setting, not a filter. It replaces the former Ownership filter, which is removed from the Filters panel, and is held in the URL as `owned=owned`.

- Turning it on SHALL hide unowned units; turning it off SHALL show them again.
- A link carrying the former `owned=unowned` value SHALL have that value removed from the URL and ignored.
- While it is on, only owned units SHALL be listed, and a faction with no owned unit SHALL NOT be shown.
- Hiding unowned units SHALL NOT count as an active filter:
  - it SHALL NOT bring up the Clear filters action;
  - Clear filters SHALL leave it on;
  - the summary and the faction owned/total counts SHALL still include the hidden units, and the summary SHALL NOT call the units "matching" because of it.
- When units match but Hide unowned hides all of them, the summary SHALL still be shown and the page SHALL NOT use the no-match empty state. It SHALL say that Hide unowned is hiding the units and offer an action that shows unowned units. Clear filters SHALL be offered there only while a filter is active.
- Like the site's other on/off toolbar options, it SHALL be a switch with a visible label, exposed to assistive technology as a switch that is on or off.

While no synced roster is available, the switch SHALL be off and disabled, with a short explanation next to it that it needs a synced roster.

#### Scenario: Hiding unowned units

- **GIVEN** a synced roster with 84 of 131 units owned and no active filter
- **WHEN** the user turns Hide unowned on
- **THEN** only owned units are listed, the summary still reads 84 of 131 units owned, the Filters control reports no active filter, and no Clear filters action is shown

#### Scenario: Hide unowned hides every matching unit

- **GIVEN** a synced roster with no owned unit and no active filter
- **WHEN** the user turns Hide unowned on
- **THEN** the summary still reads 0 of 131 units owned, the page says Hide unowned is hiding these units, no Clear filters action is shown, and selecting Show unowned units turns Hide unowned off and lists every unit

#### Scenario: Hide unowned hides everything the search finds

- **GIVEN** Hide unowned is on and the search matches only unowned units
- **WHEN** the page renders
- **THEN** it offers both Show unowned units and Clear filters, not the no-match empty state

#### Scenario: Clear filters keeps unowned units hidden

- **GIVEN** Hide unowned is on and the Imperial alliance filter is set
- **WHEN** the user selects Clear filters
- **THEN** the alliance filter is removed, Hide unowned stays on, and only owned units are listed

#### Scenario: Old link with Not owned

- **GIVEN** a link to `/my-game/collection?owned=unowned`
- **WHEN** the page renders
- **THEN** `owned` is removed from the URL, every unit is listed, and Hide unowned is off

#### Scenario: Toggle without a roster

- **GIVEN** the user is signed out
- **WHEN** they look at the toolbar
- **THEN** Hide unowned is off and disabled, with an explanation next to it that it needs a synced roster, and every greyed-out unit is listed

### Requirement: Faction grouping can be switched off

The Collection toolbar SHALL offer a Group by faction toggle, on by default, that applies to both views.

- While it is on, units SHALL be grouped by faction as specified in "Collection lists every catalog unit in one list grouped by faction".
- While it is off, the page SHALL list every matching unit in one list with no faction groups or faction headers:
  - owned units SHALL come first, ordered by the selected sort across all factions, with ties broken by the Rarity order and then by localized name, as within a faction;
  - unowned units SHALL follow, nearest to unlock first and then by localized name, under every sort;
  - in the Cards view the units SHALL sit in one aligned full-width grid of tiles; in the Roster view they SHALL sit in one list of rows flowing in columns at least 420px wide, in reading order from left to right, then down.
- While it is off, every tile and row SHALL show the unit's faction icon, and its accessible name SHALL include the localized faction name.
- The summary, the active filter count, Clear filters and the no-match empty state SHALL behave the same whether grouping is on or off.
- The toggle SHALL NOT count as an active filter, and Clear filters SHALL NOT change it.
- Like the site's other on/off toolbar options, it SHALL be a switch with a visible "Group by faction" label, exposed to assistive technology as a switch that is on while grouping is on.
- It SHALL work without a roster: without one every unit is unowned, so the list is ordered nearest to unlock first, then by localized name.
- A unit opened from the ungrouped list SHALL carry the Collection origin in the order shown (see "Collection tiles open the unit's Library page").

#### Scenario: Ungrouped by rank across factions

- **GIVEN** the player owns Calgar (Ultramarines) at Diamond 1, Haarken (Black Legion) at Gold 3 and Titus (Ultramarines) at Gold 1, and does not own Bellator (Ultramarines, 200 of 400 shards)
- **WHEN** they switch Group by faction off with sort Rank
- **THEN** the list reads Calgar, Haarken, Titus, then Bellator, with no faction headers, and each tile shows its faction icon

#### Scenario: Ungrouped Roster

- **GIVEN** a desktop viewport showing the Roster view with grouping off
- **WHEN** the page renders
- **THEN** the rows flow in equal columns with no faction section headers, each row shows the unit's faction icon, and its accessible name includes the faction name

#### Scenario: Grouping is kept by Clear filters and view switching

- **GIVEN** grouping is off with the Imperial alliance filter in the Cards view
- **WHEN** the user switches to Roster and then selects Clear filters
- **THEN** the Roster view lists every unit ungrouped, and the Group by faction toggle still reads off

#### Scenario: Opening a unit from the ungrouped list

- **GIVEN** grouping is off and the list shows Calgar, Haarken, then Titus
- **WHEN** the user opens Haarken
- **THEN** the unit page's previous and next units are Calgar and Titus

### Requirement: The Roster view lists units as dense rows grouped by faction

While faction grouping is on, the Roster view SHALL show each listed faction group as a section with the same header bar as the Cards view: the faction colour, the faction icon, the localized faction name and, when a roster is available, the owned/total count. Sections SHALL flow in a responsive grid of equal-width columns, each at least 420px wide or the full content width when that is narrower. Inside a section, each listed unit SHALL be one row, in the group's order. While grouping is off, the rows follow "Faction grouping can be switched off"; everything below applies to each row either way. The page SHALL NOT scroll horizontally at 420px.

An owned unit's row SHALL show, in order:

- its round portrait ringed in its rarity colour;
- its localized name, on one line and truncated with an ellipsis when too long;
- for a character, its rank as the game's rank badge image;
- its stars as a star icon with the star count;
- for a character, its XP level;
- its two ability levels: active and passive for a character, primary and secondary for a Machine of War;
- for a character, its three equipment slots, each filled slot showing the item framed in its rarity colour with the item level and each empty slot as an empty outline.

A Machine of War's row SHALL leave the rank, XP level and equipment positions empty so its columns line up with character rows.

An unowned unit's row SHALL show its greyed-out portrait with a dashed ring, its name in muted text and, in place of the stats, what its Cards tile shows in the same place:

- the player's shards out of the unlock cost, with a progress bar exposed as a progressbar;
- the shard count alone for a Machine of War;
- the starting rarity when no shard data is available;
- nothing for a Machine of War when no shard data is available.

Every row SHALL expose the same spelled-out accessible name as the unit's Cards tile, with its images hidden from assistive technology. Text in a row SHALL be at least 12px.

#### Scenario: Owned character row

- **GIVEN** the synced roster has Titus at Legendary with four red stars, rank Gold 1, XP level 45, active ability 40, passive ability 38 and three equipped items
- **WHEN** the Roster view renders on desktop
- **THEN** Titus's row shows a Legendary-ringed portrait, the name Titus, the Gold 1 badge image, a red star with 4, level 45, 40 and 38, and the three items with their levels, on one row

#### Scenario: Machine of War row lines up

- **GIVEN** the Ultramarines section lists owned characters and an owned Machine of War with abilities 30 and 25
- **WHEN** the Roster view renders
- **THEN** the Machine of War row shows its stars, 30 and 25, leaves the rank, level and equipment positions empty, and its ability numbers sit in the same columns as the characters' ability numbers

#### Scenario: Unowned character row

- **GIVEN** the player does not own Calgar and has 75 of the 400 shards needed to unlock him
- **WHEN** the Roster view renders
- **THEN** Calgar's row is greyed out with his name in muted text and shows 75 / 400 with a progress bar at about 19%, and no stars, rank, level, abilities or equipment

#### Scenario: Columns follow the width

- **GIVEN** a desktop viewport whose content area is 1400px wide
- **WHEN** the Roster view renders
- **THEN** faction sections flow in three equal columns; at 420px they stack in one column

### Requirement: Roster rows open the unit's Library page

Each Roster row SHALL lead to the same Library page, and carry the same Collection origin, as the unit's Cards tile, for owned, unowned and no-roster rows alike. The origin holds Collection's order of that unit kind and SHALL NOT appear in the URL.

How a row opens the page depends on the layout:

- **Desktop (at least 768px):**
  - each row SHALL be 44px tall;
  - the whole row SHALL be the link, opening in the same tab as a normal link that can also be opened in a new tab;
  - the row SHALL be reachable with the keyboard in DOM order and SHALL show a visible focus indicator;
  - hovering the row SHALL give visible feedback.
- **Mobile (below 768px):**
  - each row SHALL be 48px tall and show the portrait, name, rank badge, stars and XP level;
  - the ability levels, equipment and shard count of an owned unit move into the expanded part;
  - tapping a row SHALL expand it in place, and tapping it again SHALL collapse it;
  - at most one row SHALL be expanded at a time;
  - the expansion control SHALL expose its expanded state to assistive technology;
  - an expanded owned row SHALL show the ability levels, equipment and shard count (mythic shards from one blue star on, as on the Cards tile);
  - an unowned row's expanded part SHALL show its unlock progress;
  - every expanded row SHALL show a link that opens the unit's Library page.

#### Scenario: Desktop row opens the unit page

- **GIVEN** a desktop viewport showing the Roster view
- **WHEN** the user clicks Titus's row
- **THEN** the browser navigates to `/library/characters/<Titus's id>`, and the unit page's back button reads Collection and its prev/next walk the characters in Roster order

#### Scenario: Desktop keyboard

- **WHEN** a keyboard user tabs through the Roster view on desktop
- **THEN** focus moves through the rows in DOM order with a visible indicator, each row is announced as a link with the unit's spelled-out name, and Enter opens its Library page

#### Scenario: Mobile row expands

- **GIVEN** a mobile viewport showing the Roster view
- **WHEN** the user taps Titus's row
- **THEN** the row expands in place to show his ability levels, equipment, shard count and an open-unit link, with no navigation; tapping Calgar's row then collapses Titus's row and expands Calgar's

#### Scenario: Mobile opens the unit page from the expanded row

- **GIVEN** Titus's row is expanded on mobile
- **WHEN** the user taps its open-unit link
- **THEN** the browser navigates to Titus's Library page with the Collection origin

### Requirement: Collection view is remembered

The selected view SHALL be held in the page URL's `view` query parameter, and the faction grouping setting in its `group` query parameter (`group=none` while grouping is off). Both follow the same rules:

- The default (Cards; grouping on) SHALL NOT appear in the URL.
- Changing it SHALL replace the current history entry rather than add one.
- An unknown value SHALL be removed from the URL and treated as unset.
- The value the user last selected SHALL be remembered in this browser and SHALL apply when the URL carries none. The default applies when neither does.
- Following a link to Collection that carries a value SHALL show it without changing the remembered one; the remembered value changes only when the user selects one.

#### Scenario: Reload keeps the view

- **GIVEN** the user has selected Roster
- **WHEN** they reload the page
- **THEN** the Roster view is shown

#### Scenario: Remembered view on a fresh visit

- **GIVEN** the user last selected Roster and later opens `/my-game/collection` from the navigation, with no query parameters
- **WHEN** the page renders
- **THEN** the Roster view is shown and no filter is active

#### Scenario: Remembered grouping on a fresh visit

- **GIVEN** the user last switched Group by faction off and later opens `/my-game/collection` with no query parameters
- **WHEN** the page renders
- **THEN** the units are listed ungrouped and no filter is active

#### Scenario: Unknown view in the URL

- **GIVEN** the URL carries `view=gallery`
- **WHEN** the page renders
- **THEN** `view` is removed from the URL and the remembered view (Cards when none) is shown
