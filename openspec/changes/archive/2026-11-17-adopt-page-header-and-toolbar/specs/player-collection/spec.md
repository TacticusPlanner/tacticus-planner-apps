## RENAMED Requirements

- FROM: `### Requirement: Hide unowned shows or hides units the player does not own`
- TO: `### Requirement: Owned only shows or hides units the player does not own`

## MODIFIED Requirements

### Requirement: Collection has a page tour

The Collection page SHALL register a page tour, startable from the page's tour control, on both desktop and mobile. The tour SHALL explain:

- the toolbar (search, sort and filters);
- the View controls (Layout, Group by and Sort) and the Owned only chip;
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
- **THEN** each step highlights an element visible on the desktop layout, the steps include the toolbar, the View controls and the quick filters, and a tile step says that a tile opens the unit's Library page

#### Scenario: Mobile tour

- **GIVEN** a mobile viewport showing the Cards view
- **WHEN** the user starts the page tour
- **THEN** each step highlights an element visible on the mobile layout (the toolbar's Filters button, not the closed filter sheet), the steps include the toolbar's View button and the quick filters, and a tile step says that a tile opens the unit's Library page

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

- **GIVEN** Owned only is on
- **WHEN** the user starts the page tour
- **THEN** the unowned-unit step is left out and the owned-unit step says how a unit opens its Library page

#### Scenario: Tour with grouping off

- **GIVEN** Group by is None
- **WHEN** the user starts the page tour
- **THEN** the faction step is left out and the unit steps highlight a tile (Cards) or a row (Roster)

#### Scenario: Tour with no matching units

- **GIVEN** the active filters match no unit
- **WHEN** the user starts the page tour
- **THEN** the tour covers the toolbar, the View controls and the quick filters and leaves out the faction and unit steps

### Requirement: Collection has a toolbar with search, sort, filters and quick filters

The Collection page SHALL show the page toolbar (`app-page-layout`) above the faction groups whenever the catalog has loaded. The toolbar SHALL contain:

- in its Find slot: a name search, a Filters control and, while any filter is active, a Clear filters action;
- in its View slot: the Layout control (see "Collection switches between the Cards and Roster views"), Group by (see "Faction grouping can be switched off") and a Sort control;
- on its chip row: the Owned only chip, then the quick-filter chips.

The toolbar SHALL show how many filters are active. The search, each standalone filter that is set, and the quick filter each count as one. A range with a lowest and a highest end counts as one. The layout, the grouping and Owned only do not count. Clear filters SHALL remove the search, every standalone filter and the quick filter in one step, and leave the sort, the layout, the grouping and Owned only unchanged.

The quick-filter chips SHALL be a single-select group: selecting a chip selects that quick filter, and selecting the selected chip again clears it.

While the catalog is loading or has failed to load, the toolbar SHALL NOT be shown.

On desktop (at least 768px):

- Find SHALL lead the first row and the View controls SHALL sit at its right end; when the window is too narrow the View controls SHALL wrap under Find, still at the right, without truncating their labels;
- the Filters control SHALL expand and collapse the standalone filter controls inline below the toolbar, opening expanded when a standalone filter is already active;
- the chip row SHALL wrap onto further rows rather than scroll horizontally.

On mobile (below 768px):

- the search and the Filters control SHALL fill the first row, with the toolbar's View button at its right; the View button SHALL open a "View options" sheet holding Layout, Group by and Sort, stacked and full width, closed by Done;
- the Filters control SHALL open the standalone filter controls in a bottom sheet with its own Clear filters action and a Done action that closes it;
- the chip row SHALL scroll sideways in one line;
- the page SHALL NOT scroll horizontally at 420px.

#### Scenario: Active filter count and clear

- **GIVEN** the user has searched "ti", set the Imperial alliance filter and selected the Need to level quick filter, with sort Rank and the Roster layout
- **WHEN** they look at the toolbar
- **THEN** it reports 3 active filters, and Clear filters empties the search, removes the alliance filter and the quick filter, lists every unit again, and keeps sort Rank and the Roster layout

#### Scenario: Quick filter chips are single-select

- **GIVEN** the Can ascend chip is selected
- **WHEN** the user selects the Need to level chip, then selects it again
- **THEN** first only Need to level is selected, then no quick filter is selected

#### Scenario: Desktop toolbar

- **GIVEN** a desktop viewport and no active standalone filter
- **WHEN** the page renders and the user then activates the Filters control
- **THEN** search and Filters lead the toolbar row, Layout, Group by and Sort sit at its right end, Owned only leads the chip row, and activating Filters shows the standalone filters inline below the toolbar without covering the faction groups

#### Scenario: Mobile toolbar

- **GIVEN** a mobile viewport at 420px
- **WHEN** the user activates the Filters control, sets a rarity filter and selects Done, then taps View
- **THEN** a bottom sheet with the standalone filters opens, Done closes it, the list shows only units of that rarity, the Filters control shows 1 active filter, the View sheet holds Layout, Group by and Sort, and the page does not scroll horizontally

### Requirement: Collection standalone filters narrow the list

The Filters control SHALL offer these standalone filters; every set filter SHALL apply together with the others, with the search and with the quick filter (a unit is listed only when it matches all of them):

- **Name search:** a unit matches when its localized name or its catalog (English) name contains the search text, ignoring case and diacritics; surrounding whitespace is ignored and empty text matches every unit.
- **Alliance:** one of the game's alliances, or any.
- **Faction:** any number of factions, each shown with its icon; a unit matches when its faction is one of them.
- **Rarity:** any number of rarities; an owned unit matches on its current rarity, an unowned character on the rarity it starts at, and an unowned Machine of War (which has no starting rarity in the catalog) never matches while this filter is set.
- **Rank range:** a lowest and a highest rank (inclusive, either end optional); only owned characters can match while it is set. A range whose lowest rank is above its highest is read with its ends swapped.
- **Stars range:** a lowest and a highest progression step (rarity and stars, inclusive, either end optional); only owned units, characters and Machines of War, can match while it is set. A range set backwards is read with its ends swapped.
- **Unit kind:** characters, Machines of War, or all.

There is no Ownership filter: hiding unowned units is the toolbar's Owned only chip, a display setting (see "Owned only shows or hides units the player does not own"), and listing only unowned units is not offered.

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

### Requirement: Roster-dependent controls are disabled without the data they need

While no synced roster is available (signed out, not synced, only part of the roster synced, or roster read failure), the rank range filter, the stars range filter, the Owned only chip and every quick filter SHALL be shown disabled with a short explanation that they need a synced roster, and SHALL NOT narrow the list even if their values are present in the URL; the name search, alliance, faction, rarity, unit kind, combat and shard source filters and the Sort control SHALL keep working. While the player's upgrade inventory has not synced or could not be read, the Ready to rank up chip SHALL be disabled with an explanation that it needs the synced inventory. While the player's general inventory (which holds the ascension orbs) has not synced or could not be read, the Can ascend and Blue star ready chips SHALL be disabled with the same explanation. Once the missing data arrives, the controls SHALL become available and any of their values held in the URL SHALL apply without a reload. While the data a quick filter needs (ascension costs, upgrade recipes, inventory) is still loading, its chip SHALL be disabled, so selecting it never replaces the toolbar with loading placeholders. When a quick filter already in the URL is waiting for that data, the page SHALL show the loading placeholders rather than an unfiltered or empty list. If that catalog data fails to load, only the quick filters that need it SHALL be disabled, with an explanation that their data could not be loaded and a control to try loading it again, and the rest of the page SHALL keep working.

#### Scenario: Quick-filter catalog data fails to load

- **GIVEN** the game catalog's unit data loads but its upgrade recipes fail to load
- **WHEN** the page renders
- **THEN** the units are listed, Ready to rank up is disabled with an explanation that its data could not be loaded and a Try again control, and the other quick filters are available

#### Scenario: Signed out

- **GIVEN** the user is not signed in
- **WHEN** they open the toolbar's filters
- **THEN** rank range, Owned only and every quick filter are disabled with an explanation, and search, alliance, faction, rarity and unit kind still narrow the greyed-out list

#### Scenario: Roster-dependent value in a shared link

- **GIVEN** a signed-out user opens a link to `/my-game/collection` that carries the Can ascend quick filter and the Imperial alliance filter
- **WHEN** the page renders
- **THEN** the Imperial filter applies, Can ascend is shown disabled and does not narrow the list

#### Scenario: Inventory not synced

- **GIVEN** a signed-in user whose roster has synced but whose upgrade inventory has not
- **WHEN** they look at the quick filters
- **THEN** Ready to rank up is disabled with an explanation and the other quick filters are available

### Requirement: Collection toolbar state lives in the URL and the sort is remembered

The search text, every standalone filter and the sort SHALL be held in the page URL's query parameters, so that reload, Back and a shared link restore them.

- A value equal to its default (empty search, unset filter) SHALL NOT appear in the URL.
- Changing them SHALL replace the current history entry rather than add one.

Invalid query values SHALL be handled as follows:

- An invalid value SHALL be dropped from the URL and treated as unset. This covers an unknown faction, rarity, rank, progression step, kind, damage type, trait, shard source or sort, and a number the catalog does not offer.
- In a list of factions, rarities, damage types, traits or shard sources, only the unknown items SHALL be dropped, and the valid ones SHALL still apply.
- A range set backwards SHALL be rewritten in the URL with its ends swapped.

The search SHALL update the URL once typing pauses, without delaying or dropping typed characters.

The sort the user last selected SHALL also be remembered in this browser and SHALL apply when the URL carries no sort. The default sort, Rarity, applies when neither does.

The view is held and remembered the same way (see "Collection view is remembered").

The quick filter SHALL be remembered per device (in this browser's storage) instead of the URL: selecting or clearing a chip, or Clear filters, SHALL NOT change the URL, and opening `/my-game/collection` again on the same device shows the last quick filter chosen there. The URL SHALL NOT carry the quick filter, and an unknown stored value is treated as none.

Search and filters SHALL NOT be remembered beyond the URL: opening `/my-game/collection` without query parameters shows every unit that matches the remembered quick filter (every unit when none is remembered).

Owned only SHALL be held as `owned=owned`. Unlike the sort, layout and grouping, it SHALL NOT be remembered in the browser: it applies only while the URL carries it.

#### Scenario: Reload keeps the view

- **GIVEN** the user has set the Xenos alliance filter, the Can ascend quick filter and sort Shards
- **WHEN** they reload the page
- **THEN** the same filter, quick filter and sort are applied; the quick filter comes from this device, not the URL

#### Scenario: Remembered sort on a fresh visit

- **GIVEN** the user last selected sort Rank and the Need to level quick filter, and later opens `/my-game/collection` from the navigation, with no query parameters
- **WHEN** the page renders
- **THEN** sort Rank and the Need to level quick filter are applied and no other filter is active

#### Scenario: Invalid value in the URL

- **GIVEN** the URL carries an unknown kind value
- **WHEN** the page renders
- **THEN** that value is removed from the URL and no kind filter is applied

#### Scenario: Unknown faction in a shared link

- **GIVEN** the URL's faction list carries two known factions and one unknown faction id
- **WHEN** the page renders
- **THEN** the unknown id is removed from the URL and the two known factions still apply

#### Scenario: Hidden unowned units in a shared link

- **GIVEN** a signed-in user with a synced roster opens a link carrying `owned=owned`
- **WHEN** the page renders
- **THEN** only owned units are listed and Owned only is on

### Requirement: Collection switches between the Cards and Roster views

The Collection toolbar SHALL offer a Layout control with two views: Cards, the default, and Roster.

- Both views SHALL show the same units in the same order: the same search, filters, quick filter, sort and faction grouping setting.
- Switching views SHALL keep every other toolbar value unchanged.
- The Layout control SHALL be shown whenever the toolbar is shown, including while no roster is available.

At every width it SHALL be the shared labelled segmented control "Layout", exposed to assistive technology as a radio group with the selected view checked: in the toolbar's View slot on desktop (at least 768px), and in the toolbar's View sheet on mobile (below 768px), where it is full width.

Clear filters SHALL NOT change the view. The selected view SHALL NOT count as an active filter.

#### Scenario: Switching to Roster keeps the filters

- **GIVEN** the Cards view with the Imperial alliance filter and sort Rank
- **WHEN** the user selects Roster
- **THEN** the Roster view lists the same Imperial units in the same faction and unit order, the alliance filter and sort Rank stay applied, and the active filter count is unchanged

#### Scenario: Clear filters keeps the view

- **GIVEN** the Roster view with a search and the Need to level quick filter
- **WHEN** the user selects Clear filters
- **THEN** the search and quick filter are removed and the Roster view is still shown

#### Scenario: Desktop Layout control

- **GIVEN** a desktop viewport showing the Cards view
- **WHEN** assistive technology reads the toolbar
- **THEN** it announces a Layout radio group with Cards checked and Roster not checked

#### Scenario: Mobile Layout control

- **GIVEN** a mobile viewport at 420px
- **WHEN** the user taps View and picks Roster in the Layout control
- **THEN** the Roster view is shown, Roster is checked in the sheet, and the page does not scroll horizontally

#### Scenario: Signed out

- **GIVEN** the user is not signed in
- **WHEN** they select Roster
- **THEN** every catalog unit is shown as a greyed-out roster row grouped by faction, under the sign-in prompt

### Requirement: Owned only shows or hides units the player does not own

The Collection toolbar SHALL show an **Owned only** chip, leading its chip row. It hides units the player does not own and is a display setting, not a filter. It replaces the former Ownership filter, which is removed from the Filters panel, and is held in the URL as `owned=owned`.

- Turning it on SHALL hide unowned units; turning it off SHALL show them again.
- A link carrying the former `owned=unowned` value SHALL have that value removed from the URL and ignored.
- While it is on, only owned units SHALL be listed, and a faction with no owned unit SHALL NOT be shown.
- Owned only SHALL NOT count as an active filter:
  - it SHALL NOT bring up the Clear filters action;
  - Clear filters SHALL leave it on;
  - the summary and the faction owned/total counts SHALL still include the hidden units, and the summary SHALL NOT call the units "matching" because of it.
- When units match but Owned only hides all of them, the summary SHALL still be shown and the page SHALL NOT use the no-match empty state. It SHALL say that Owned only is hiding the units and offer an action that shows unowned units. Clear filters SHALL be offered there only while a filter is active.
- It SHALL look like the quick-filter chips but sit apart from their single-select group, and be exposed to assistive technology as a toggle button that is pressed while on.

While no synced roster is available, the chip SHALL be off and disabled, with an explanation (its tooltip and accessible description) that it needs a synced roster.

#### Scenario: Hiding unowned units

- **GIVEN** a synced roster with 84 of 131 units owned and no active filter
- **WHEN** the user turns Owned only on
- **THEN** only owned units are listed, the summary still reads 84 of 131 units owned, the Filters control reports no active filter, and no Clear filters action is shown

#### Scenario: Owned only hides every matching unit

- **GIVEN** a synced roster with no owned unit and no active filter
- **WHEN** the user turns Owned only on
- **THEN** the summary still reads 0 of 131 units owned, the page says Owned only is hiding these units, no Clear filters action is shown, and selecting Show unowned units turns Owned only off and lists every unit

#### Scenario: Owned only hides everything the search finds

- **GIVEN** Owned only is on and the search matches only unowned units
- **WHEN** the page renders
- **THEN** it offers both Show unowned units and Clear filters, not the no-match empty state

#### Scenario: Clear filters keeps unowned units hidden

- **GIVEN** Owned only is on and the Imperial alliance filter is set
- **WHEN** the user selects Clear filters
- **THEN** the alliance filter is removed, Owned only stays on, and only owned units are listed

#### Scenario: Old link with Not owned

- **GIVEN** a link to `/my-game/collection?owned=unowned`
- **WHEN** the page renders
- **THEN** `owned` is removed from the URL, every unit is listed, and Owned only is off

#### Scenario: Chip without a roster

- **GIVEN** the user is signed out
- **WHEN** they look at the toolbar
- **THEN** Owned only is off and disabled, its description says it needs a synced roster, and every greyed-out unit is listed

### Requirement: Faction grouping can be switched off

The Collection toolbar SHALL offer Group by, the shared labelled segmented control with the options **None** and **Faction**, Faction by default, that applies to both views.

- While it is Faction, units SHALL be grouped by faction as specified in "Collection lists every catalog unit in one list grouped by faction".
- While it is None, the page SHALL list every matching unit in one list with no faction groups or faction headers:
  - owned units SHALL come first, ordered by the selected sort across all factions, with ties broken by the Rarity order and then by localized name, as within a faction;
  - unowned units SHALL follow, nearest to unlock first and then by localized name, under every sort;
  - in the Cards view the units SHALL sit in one aligned full-width grid of tiles; in the Roster view they SHALL sit in one list of rows flowing in columns at least 420px wide, in reading order from left to right, then down.
- While it is None, every tile and row SHALL show the unit's faction icon, and its accessible name SHALL include the localized faction name.
- The summary, the active filter count, Clear filters and the no-match empty state SHALL behave the same whether grouping is on or off.
- Group by SHALL NOT count as an active filter, and Clear filters SHALL NOT change it.
- It SHALL be labelled "Group by" and be exposed to assistive technology as a radio group with the selected option checked, the same control the Goals and Dailies > Raids toolbars use.
- It SHALL work without a roster: without one every unit is unowned, so the list is ordered nearest to unlock first, then by localized name.
- A unit opened from the ungrouped list SHALL carry the Collection origin in the order shown (see "Collection tiles open the unit's Library page").

#### Scenario: Ungrouped by rank across factions

- **GIVEN** the player owns Calgar (Ultramarines) at Diamond 1, Haarken (Black Legion) at Gold 3 and Titus (Ultramarines) at Gold 1, and does not own Bellator (Ultramarines, 200 of 400 shards)
- **WHEN** they pick Group by None with sort Rank
- **THEN** the list reads Calgar, Haarken, Titus, then Bellator, with no faction headers, and each tile shows its faction icon

#### Scenario: Ungrouped Roster

- **GIVEN** a desktop viewport showing the Roster view with grouping off
- **WHEN** the page renders
- **THEN** the rows flow in equal columns with no faction section headers, each row shows the unit's faction icon, and its accessible name includes the faction name

#### Scenario: Grouping is kept by Clear filters and view switching

- **GIVEN** grouping is off with the Imperial alliance filter in the Cards view
- **WHEN** the user switches to Roster and then selects Clear filters
- **THEN** the Roster view lists every unit ungrouped, and Group by still reads None

#### Scenario: Opening a unit from the ungrouped list

- **GIVEN** grouping is off and the list shows Calgar, Haarken, then Titus
- **WHEN** the user opens Haarken
- **THEN** the unit page's previous and next units are Calgar and Titus

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

- **GIVEN** the user last picked Group by None and later opens `/my-game/collection` with no query parameters
- **WHEN** the page renders
- **THEN** the units are listed ungrouped and no filter is active

#### Scenario: Unknown view in the URL

- **GIVEN** the URL carries `view=gallery`
- **WHEN** the page renders
- **THEN** `view` is removed from the URL and the remembered view (Cards when none) is shown
