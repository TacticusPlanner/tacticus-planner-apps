# personal-teams Specification

## Purpose

Defines the Teams page where a signed-in player keeps reusable lineups for each game mode, and the team editor that applies each mode's rules while they build.

## Requirements

### Requirement: The Teams page lists the player's teams as cards or a table

The page at `/my-game/teams` SHALL list the player's teams in their saved order, in one of two layouts the player switches between: **Cards** (default) and **Table**. Both layouts SHALL share the header, toolbar, filters, grouping and drag reorder, and switching SHALL keep the filters and the scroll position. On a phone the layouts SHALL be **Cards** and a compact **List**, and a saved Table preference SHALL show as List. The layout SHALL be remembered on this device.

A card SHALL show the team's name, position, mode badges, what a Campaign or Incursion team is for ("Campaign: Indomitus", "Incursions: Rukkatrukk"), its core characters, then its flex units (characters and MoWs) and its core MoW, each group labelled, its notes (up to two lines), and its status chips. Portraits SHALL be 40px and wrap rather than shrink. A table row SHALL show the position, the name with its modes on a second line (for a Campaign or Incursion team, what it is for instead) and its notes on a third, truncated, one cell per core character slot (an empty slot drawn as a dashed outline), the flex units, the core MoW and the status chips stacked in one cell; a row with no status chips (no issue, shared unit or cap) SHALL leave the status cell empty. Units the player has not unlocked SHALL be marked as locked. Every card, table row and phone row SHALL show Edit and Delete as labelled icon buttons, with no "More actions" menu; Edit SHALL be the way into the editor, and, as on the Goals board, a tap elsewhere on a card or row SHALL open nothing. A card's name SHALL wrap to two lines rather than be cut short.

The page SHALL distinguish these states:

- Teams loading: a skeleton in the current layout, with the toolbar unavailable
- Teams failed to load: an error with a retry action, not the empty state
- No teams: "No teams yet." with one Create team action, and a secondary text link to the V1 import, whose back arrow returns to the Teams page
- Teams available but no synced roster: teams shown normally, without unit progression and without locked marks, plus a prompt to sync

#### Scenario: Flex units are separated

- **GIVEN** a team with 5 core and 2 flex characters, 1 core MoW and 1 flex MoW
- **WHEN** the page renders as cards
- **THEN** the card shows the 5 core characters, then a labelled flex group with the 2 characters and the flex MoW, and a labelled MoW group with the core MoW

#### Scenario: Table keeps empty slots

- **GIVEN** a team with 3 core characters and no issues
- **WHEN** the page renders as a table
- **THEN** its row shows 3 portraits and 2 dashed empty core slots, and its status cell is empty

#### Scenario: Layout is remembered

- **GIVEN** the player switched to Table and left the page
- **WHEN** they open Teams again on the same device
- **THEN** the teams are shown as a table

#### Scenario: Load failure is not an empty list

- **GIVEN** the teams request fails
- **WHEN** the page renders
- **THEN** it shows an error with Retry and does not show the empty state

#### Scenario: No synced roster

- **GIVEN** a player with teams and no synced roster
- **WHEN** the page renders
- **THEN** the teams are listed by unit portrait, no unit is marked locked, and a prompt offers to sync

### Requirement: The Teams page uses the page header and toolbar

The page SHALL use the app's page header: the title, the tour action and a one-line description. It SHALL have no Settings button. Its controls SHALL sit in one toolbar row that wraps when narrow:

- Find: a search over team names and the names of their units; the labelled Mode select; a "Needs fixes" quick-filter chip with the number of flagged teams, and a "Shared units" chip with the number of teams sharing a unit with another team of the same Guild War mode, each hidden while its number is 0
- View: "Group by" as a segmented control with None and Mode, and the layout as a segmented control
- Actions: the team count against the limit, then Create team as the filled button

The page has no "Filters" button: search, Mode and the two chips are its only filters.

On a phone the first row SHALL hold the search, the View button (a sheet with Group by and the layout) and Create team as a labelled icon button, with the Mode select on the second row.

#### Scenario: Desktop toolbar

- **GIVEN** a viewport at 1440px with both navigation panels open
- **WHEN** the page renders
- **THEN** the toolbar shows search and Mode at the left, Group by and the layout after them, and the count and Create team at the far right

#### Scenario: Search matches units

- **GIVEN** a team named "Bravo" whose lineup includes Calgar
- **WHEN** the player searches "calgar"
- **THEN** Bravo is listed

#### Scenario: Quick-filter chip hidden at zero

- **GIVEN** no team has issues
- **WHEN** the page renders
- **THEN** no "Needs fixes" chip is shown

### Requirement: Teams can be filtered and grouped by mode

The Mode select SHALL offer All and each of the 7 game modes, each mode with its game icon in the list and in the closed select, defaulting to All, and SHALL show only teams with the chosen mode. Group by SHALL default to Mode. Grouped by Mode, the teams SHALL appear in one section per mode, in the order War Offense, War Defense, Guild Raid, Tournament Arena, Horde, Campaign, Incursion, skipping modes with no team; a team SHALL appear once, under the first of its modes in that order, and teams with no mode (an imported team can have none) SHALL appear last, in a No mode section. A section header SHALL name the mode and its team count; in War Offense and War Defense it SHALL note a unit of its teams that two teams of that mode use, counting every team as the shared chips do, not only the ones the filter shows. Grouped by None, the teams SHALL appear in one list in play order. The mode, the grouping and the layout SHALL be remembered on this device and SHALL render when storage is unavailable. Filters with no matching teams SHALL say so and offer to show all teams, clearing the search, the mode and the chips.

#### Scenario: Filter by Horde

- **GIVEN** teams with modes Horde, Guild Raid, and Horde and Guild Raid
- **WHEN** the player chooses Horde
- **THEN** the first and third teams are listed

#### Scenario: A team appears once when grouped

- **GIVEN** a team with modes Guild Raid and Horde
- **WHEN** the page is grouped by Mode
- **THEN** the team appears only in the Guild Raid section, with a Horde badge (the section's own mode is not repeated)

#### Scenario: Mode is remembered on this device

- **GIVEN** the player chose War Offense and left the page
- **WHEN** they open Teams again on the same device
- **THEN** the Mode select reads War Offense and only War Offense teams are listed

#### Scenario: No match

- **GIVEN** no team has the Incursion mode
- **WHEN** the player chooses Incursion
- **THEN** the page says no team matches and offers to show all teams

### Requirement: Teams are reordered by dragging in place

As on the Goals board, every card, table row and phone row SHALL show the team's position number and a drag grip at its top left, in every layout and on a phone, with no separate reorder mode and no Reorder button. Dragging a team by its grip, with a pointer, touch or the keyboard (Space picks up, the arrow keys move, Space drops, Escape cancels), SHALL move it among the teams shown: under a mode filter, a search or a quick filter, or within a mode section when grouped, teams SHALL move only among the positions the shown teams hold. A move SHALL show immediately and SHALL revert with a message when the save fails. When the save is stale, the list SHALL reload and the player SHALL be told their move was not applied.

#### Scenario: Reorder under a filter

- **GIVEN** teams A (Horde), B (Guild Raid), and C (Horde), in that order, with the Horde filter active
- **WHEN** the player moves C above A
- **THEN** the full order is C, B, A

#### Scenario: Reorder within a mode section

- **GIVEN** the page grouped by Mode, with War Offense teams at positions 1, 3 and 5
- **WHEN** the player drags the team at position 3 before the one at position 1
- **THEN** the two swap positions 1 and 3, and no team outside the section moves

#### Scenario: Stale reorder

- **GIVEN** another device added a team
- **WHEN** the player reorders the list
- **THEN** the list reloads with the new team and says the move was not applied

### Requirement: Teams show their state as status chips

Each team SHALL show status chips, one fact per chip and never two in one: its saved rarity cap ("Epic cap"); each broken rule ("6 core (max 5)", "2 core MoW (max 1)"); each unit it shares with another team of the same Guild War mode ("Kharn shared"); and the number of its units under its saved cap ("2 under cap"). Chips SHALL be ordered cap, rule errors, then warnings. Rule errors SHALL use the destructive style with text meeting 4.5:1 contrast; shared and under-cap chips SHALL use the amber warning style. A flagged team SHALL also have a destructive border (cards) or tint (rows). Shared units SHALL count core and flex units, and only within War Offense or within War Defense: a unit can be in an offense team and a defense team, and in any number of teams of the other modes. A mode section's shared-unit note SHALL appear only in the two Guild War sections.

#### Scenario: Shared only within a Guild War mode

- **GIVEN** Calgar in a War Offense team, a War Defense team and a Horde team, and Titus in two Horde teams
- **WHEN** the page renders
- **THEN** no team shows a shared chip

#### Scenario: Shared within War Defense

- **GIVEN** Trajann in two War Defense teams
- **WHEN** the page renders
- **THEN** both teams show "Trajann shared"

### Requirement: Teams can be added, edited and deleted

Create team SHALL open an empty editor, and opening a team SHALL open the editor filled from that team. At 50 teams, Create team SHALL be unavailable with the limit stated beside it. Delete SHALL ask for confirmation, naming the team, and SHALL delete nothing until confirmed. The editor SHALL close only once a save succeeds, or when the player closes it, asking first when the draft has unsaved changes. After a failed save the draft SHALL stay. After a stale save the team SHALL reload, the draft SHALL stay, and the editor SHALL say the save was not applied.

#### Scenario: Limit reached

- **GIVEN** a player with 50 teams
- **WHEN** the page renders
- **THEN** Create team is unavailable and the toolbar says the limit of 50 is reached

#### Scenario: Unsaved changes

- **GIVEN** an editor with a changed name
- **WHEN** the player presses Escape
- **THEN** the editor asks to discard the changes, and Keep editing returns to the draft

#### Scenario: Stale save

- **GIVEN** the team was changed on another device
- **WHEN** the player saves it
- **THEN** the editor stays open with their draft and says the save was not applied

#### Scenario: Name already used

- **GIVEN** the server refuses a save with `teamNameTaken`
- **WHEN** the response arrives
- **THEN** the name field shows a translated message and the draft stays

### Requirement: The editor is a large dialog on desktop and a tabbed sheet on a phone

On desktop the editor SHALL open as a large centered dialog, nearly the full window height and at most 88rem wide, over the page, which keeps its scroll position. Its header SHALL hold the title ("Create team" or "Edit" and the team's name) and Close; then the name, the rarity cap and a Notes button that shows or hides the notes field in place; then the modes, each with its game icon, and the campaign or Incursion fields; then a lineup band whose character and MoW rows each scroll sideways, so a full lineup never grows taller; then the picker, which keeps room for about two rows of units, the dialog body scrolling when the window is too short; and a footer with the live lineup count (or, once a save is tried, what to fix), Cancel and Save. No overlay SHALL open on top of the editor except the discard confirmation. The picker SHALL show characters and MoWs as two columns side by side.

On a phone the editor SHALL be a bottom sheet with a header (name, Name and notes, Close), Modes and Cap buttons, and three tabs with live counts: Lineup, Characters and Machines of War. Its footer SHALL hold the lineup count on its own row, then Cancel and Save side by side. Every add or remove in the Characters or Machines of War tab SHALL show a short message saying where the unit went, with Undo restoring the previous lineup exactly.

#### Scenario: On desktop

- **GIVEN** a viewport at or above 768px
- **WHEN** the editor opens and the player scrolls the picker
- **THEN** it is a centered dialog, the lineup band stays in view, and the picker's Filters button opens its filters inline, in a column after the units, so the units stay in view

#### Scenario: On a phone

- **GIVEN** a viewport below 768px
- **WHEN** the editor opens
- **THEN** it is a bottom sheet with Lineup, Characters and Machines of War tabs, and the picker's Filters button opens its filters in a sheet

#### Scenario: Undo on a phone

- **GIVEN** a War Offense draft with 5 core characters, on the Characters tab
- **WHEN** the player adds a sixth character and chooses Undo
- **THEN** the message said it was added as flex, and Undo leaves the 5 core characters and no flex

### Requirement: The editor applies the rules of the selected modes

The editor SHALL evaluate the draft after every change, using the same rule codes as the API. Save SHALL stay available: trying it while any rule is broken SHALL save nothing and list each reason in the footer, and from then on the list SHALL follow the draft, each reason going away once fixed. Before a save is tried the reasons SHALL not be listed. A name SHALL be 3 to 40 characters and notes at most 300, with their limits shown. A team SHALL have at least one mode and at least 3 characters, in every mode; MoWs do not count. The modes SHALL be a multi-select toggle group. Rule behavior SHALL be:

| Mode                                       | Lineup behavior                                                                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| War Offense, War Defense, Tournament Arena | At most 5 core characters and 1 core MoW; flex units of either kind do not count. A mode is unavailable while the lineup exceeds this, said once under the modes as a warning with the fix |
| Guild Raid, Horde                          | No limit                                                                                                                                                                                   |
| Campaign                                   | Exclusive. No MoWs. Requires a campaign                                                                                                                                                    |
| Incursion                                  | Exclusive. No team MoW. Requires at least one Incursion                                                                                                                                    |

While Campaign or Incursion is selected every other mode SHALL be unavailable, and selecting either SHALL be unavailable while any other mode is selected; the reason SHALL be said once, under the modes, after the player tries such a mode, and SHALL always be the mode's description for screen readers. No rule SHALL fail silently.

Assumptions: the limits are the API's. Whether a unit is locked or unowned has no effect on any rule.

#### Scenario: Selecting War Offense with six core characters

- **GIVEN** a draft with 6 core characters
- **WHEN** the player looks at the modes
- **THEN** War Offense, War Defense and Tournament Arena are unavailable, and one warning under the modes says war teams allow 5 core characters and to make the others flex

#### Scenario: Campaign excludes other modes

- **GIVEN** a draft with Campaign selected
- **WHEN** the player tries Horde
- **THEN** Horde stays unselected and a note under the modes says Campaign teams cannot have other modes

### Requirement: Characters and MoWs can be core or flex

Every lineup unit, character or MoW, SHALL be core or flex, with flex units after core ones. Adding a character SHALL place it last in core while core has room under the selected modes' limit, and otherwise first in flex; adding a MoW SHALL place it in core while no core MoW is present in a War or Tournament Arena draft, and otherwise in flex. The editor SHALL say where an added unit went. Each lineup unit SHALL offer making it flex or core, moving it, and removing it, by mouse, keyboard and touch; the lineup's units SHALL also be drag-sortable within and across core and flex, on desktop and on a phone, with a Flex divider marking where flex begins; a team's only core character SHALL NOT offer Flex. A team keeps at least one core character: removing its last core character SHALL move the first flex character into core. Every MoW may be flex. The lineup SHALL show the team's MoWs whenever it has any, on desktop and on a phone, also an imported team's in a mode that takes none, so they can be removed. A team with no flex characters SHALL save a null `flexStartIndex`, and one with no flex MoWs a null `mowFlexStartIndex`.

#### Scenario: Make a character flex

- **GIVEN** a lineup of A, B and C, all core
- **WHEN** the player makes A flex
- **THEN** the core characters are B and C, and A is the first flex character

#### Scenario: A full core sends a new character to flex

- **GIVEN** a War Offense draft with 5 core characters
- **WHEN** the player adds a sixth
- **THEN** it is the first flex character, and the editor says it was added as flex

#### Scenario: A second MoW goes to flex

- **GIVEN** a War Defense draft with one core MoW
- **WHEN** the player adds another MoW
- **THEN** it is a flex MoW, and the team still satisfies every rule

### Requirement: Campaign teams start from their campaign

Selecting Campaign SHALL clear the draft's MoWs and hide the MoW picker. The player SHALL choose one of the non-Elite campaigns the catalog serves: Indomitus, Fall of Cadia, Octarius and Saim-Hann, each with its Mirror, and every event campaign (7 today, through Orks vs Blood Angels). Elite SHALL NOT be offered, because it is a difficulty of the same campaign. Choosing a campaign SHALL replace the lineup with its core characters, which the player SHALL NOT be able to remove or make flex while that campaign is selected. The picker SHALL list only characters of the campaign's allowed factions, and the editor SHALL state which factions those are. Clearing Campaign SHALL clear the chosen campaign.

#### Scenario: Choosing Indomitus

- **WHEN** the player chooses Indomitus
- **THEN** the lineup becomes Tigurius, the Eliminator Sergeant and the Inceptor Sergeant, and none of the three can be removed

#### Scenario: Changing campaign replaces the lineup

- **GIVEN** a Campaign draft on Indomitus with five characters
- **WHEN** the player chooses Octarius
- **THEN** the lineup becomes Octarius's core characters

### Requirement: Incursion teams are built around their Incursions

Selecting Incursion SHALL clear the draft's MoWs and hide the MoW picker. The player SHALL choose one or more MoWs whose Incursions the team is for. Once a MoW is chosen, only MoWs that keep at least one faction every chosen Incursion allows SHALL be offered, so the factions the picker lists are never empty. The picker SHALL list only characters of factions that every chosen Incursion allows, and the editor SHALL state which factions those are. Changing the chosen MoWs SHALL clear the lineup. Clearing Incursion SHALL clear the chosen MoWs.

Assumption: allowed factions are the `allowedFactions` of the served `incursions` record. `minUnitsOfGrandAllianceNeeded` is not applied.

#### Scenario: Picker follows the allowed factions

- **WHEN** the player chooses Rukkatrukk
- **THEN** the picker lists Ultramarines, Black Templars, Space Wolves, Dark Angels, Blood Angels and Custodes characters, and no Sisters of Battle

#### Scenario: Other Incursions narrow to compatible MoWs

- **GIVEN** Rukkatrukk is chosen
- **WHEN** the player opens the MoW choice
- **THEN** MoWs whose Incursions allow only Chaos factions are not offered

### Requirement: The picker finds units across the roster

The picker SHALL list catalog characters and MoWs that fit the selected modes, sorted by rank, then ability levels, then rarity, as fixed-size unit tiles showing the portrait (rarity frame and rank badge), the name and the two ability levels. A picked unit's tile SHALL be filled and carry a check mark, distinct from the focus ring. Each list SHALL be one Tab stop, with the arrow keys moving between tiles and Enter or Space adding or removing. The picker SHALL offer a name search and a "Filters" button, badged with the number of active filters, for rank range, rarity range, faction, alliance, trait, attack type, hits, movement, range and damage type. An "Owned only" filter chip, as on Collection and off by default, SHALL list only the units the player owns; without a synced roster it SHALL be unavailable and say why. MoWs SHALL honor the filters that apply to them: name, rarity, faction and alliance. Filters SHALL reset when the editor closes. A unit already in another team that shares a selected Guild War mode (War Offense, or War Defense) SHALL be flagged, by a mark on its tile that is also its accessible description, and SHALL stay selectable. Without a synced roster, every unit SHALL still be selectable. XP level SHALL NOT be shown on tiles.

#### Scenario: Unit used by another team

- **GIVEN** another War Offense team contains Calgar
- **WHEN** the player selects War Offense in the editor
- **THEN** Calgar is flagged as used in another team and can still be added

#### Scenario: Offense does not flag defense

- **GIVEN** only a War Defense team contains Calgar
- **WHEN** the player selects War Offense in the editor
- **THEN** Calgar is not flagged

#### Scenario: Different mode does not flag

- **GIVEN** only a Horde team contains Calgar
- **WHEN** the player selects War Offense in the editor
- **THEN** Calgar is not flagged

### Requirement: A team's rarity cap is saved and previews its lineup

The editor SHALL offer a rarity cap with None and the six rarities, saved with the team as `rarityCap` (None saves null). With a cap set, lineup and picker units SHALL show at that rarity, with rank, level, stars and ability levels capped as V1 does, and the lineup, not the picker, SHALL mark in amber what of each unit is under the cap's targets (rarity, rank, XP level, abilities), for example "Under Epic: rank, abilities". A unit at exactly the cap's rank SHALL NOT be under it, whatever upgrades it has applied. MoWs SHALL NOT be compared on XP level. The cap SHALL NOT affect any rule, and SHALL show on the team's card and row.

Assumptions: a Rarity's caps are V1's: Common is Iron 1, level 8, 2 stars; Uncommon is Bronze 1, level 17, 4 stars; Rare is Silver 1, level 26, 1 red star; Epic is Gold 1, level 35, 3 red stars; Legendary is Diamond 3, level 50, 1 blue star; Mythic is Adamantine 3, level 65, Mythic wings.

#### Scenario: Capped preview

- **GIVEN** a Legendary Diamond 3 unit at level 50 with abilities 50 and 20
- **WHEN** the player sets the cap to Epic
- **THEN** the unit shows as Epic with abilities 35 and 20, its lineup row says "Under Epic: abilities" with 20 in amber, and its picker tile shows no under-cap mark

#### Scenario: The cap is saved

- **GIVEN** a team saved with the cap at Epic
- **WHEN** the player reopens it
- **THEN** the cap reads Epic and the card shows "Epic cap"

### Requirement: Teams that break a rule are flagged and fixed in the editor

A team with `issues` SHALL show error status chips and a translated reason for each issue code, never a raw code. Each reason SHALL say how to fix it in the editor, for example "Make 1 character flex". The flag SHALL not prevent deleting, reordering or filtering. Opening it in the editor SHALL show the draft as imported and mark the lineup units concerned; as for any draft, trying to save before every rule is satisfied SHALL save nothing and list the broken rules with their fixes in the footer. For `factionNotAllowed`, `coreCharacterMissing`, `tooManyCoreCharacters` and `tooManyCoreMows`, the editor SHALL mark the lineup units concerned, so the player does not have to find them.

#### Scenario: Imported team with two core MoWs

- **GIVEN** a War Offense team with issue `tooManyCoreMows`
- **WHEN** the player opens the page
- **THEN** the team shows a "2 core MoW (max 1)" chip, and opening it marks the second core MoW, and trying to save lists the reason with its fix and saves nothing

#### Scenario: Characters outside the allowed factions are marked

- **GIVEN** an imported Incursion team for Rukkatrukk with one Sisters of Battle character and issue `factionNotAllowed`
- **WHEN** the player opens it in the editor
- **THEN** that character is marked as not allowed, and once it is removed the team saves

### Requirement: The Teams page has a tour

The page SHALL register a tour covering the Mode select and grouping, Create team, a team and reordering, in both layouts, on desktop and on a phone. When no team exists, the tour SHALL skip steps that need a team.

#### Scenario: Tour on an empty list

- **GIVEN** a player with no teams
- **WHEN** they start the tour
- **THEN** it completes without a step pointing at a missing team
