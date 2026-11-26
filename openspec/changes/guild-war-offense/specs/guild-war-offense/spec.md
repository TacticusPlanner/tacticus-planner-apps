## Purpose

Defines the Guild War pages in the Guild section: the war's season and level, the Offense tracker with its attack log, and the History tab.

## ADDED Requirements

### Requirement: Guild War pages are sign-in only and need no registered guild

The app SHALL serve `/guild/war/offense` and `/guild/war/history` to any signed-in user, whether or not they belong to a registered guild, and `/guild/war` SHALL redirect to `/guild/war/offense`. Both pages SHALL share one header (title, one line of description and Tour this page) and page tabs listing Offense and History.

#### Scenario: No registered guild

- **GIVEN** a signed-in user whose guild is not registered
- **WHEN** they open `/guild/war/offense`
- **THEN** the Offense page renders, not the guild onboarding

### Requirement: The war's season and level

Above the tabs the page SHALL show the war's season as plain text. With no current war the season SHALL be the one the events calendar names for the running (else the next, else the latest) Guild War season through its `seasonConfigId`, else the first served season, at battlefield level 1. A season SHALL be shown by its calendar number ("Season 29": the calendar season running that config when the war started, or now with no war, else the next, else the latest). A season the calendar does not name SHALL be shown in an inline banner above the toolbar saying the war uses it. The battlefield level SHALL be picked in the Offense toolbar (see below); there SHALL be no Settings sheet. Battlefield level 0 (the game's "not taking part") SHALL NOT be offered; a war stored at level 0 still shows it.

#### Scenario: Calendar default

- **GIVEN** no current war and a calendar Guild War season naming `guildWarSeasonC`
- **WHEN** Offense renders
- **THEN** the line above the tabs reads "Season 29" for calendar season 29

#### Scenario: Season not on the calendar

- **GIVEN** a current war in a season the calendar does not name
- **WHEN** Offense renders
- **THEN** a banner above the toolbar says the war uses that season, and no Settings button shows

### Requirement: Offense tracks the current war

Offense SHALL show a toolbar with the battlefield level, the zone and the defenders' rarity (see below) and Start new war as its filled action, then, in order: a summary strip (tokens used of the season's `maxAttempts`, units left per rarity, attacks won and lost, and, once the war has attacks, an Attack log (N) button that scrolls to and focuses the log), the player's offense teams (teams with the `warOffense` mode, with All teams opening the Teams page and New team opening the team editor with War Offense picked; each card shows the core units and, after a divider, the flex units, the deployed ones dimmed) with those whose core units are all available first and blocked ones after with a reason naming every deployed core unit (three names, then "and N more"; a deployed flex unit does not block a team), the available units with search and Filters, and the attack log newest first with Edit and Delete per attack. Delete SHALL ask for confirmation. Edit SHALL open the attack in the Log attack dialog, where the zone and rarity can change too, and save it with the attack's revision; when another device changed the attack first, the dialog SHALL keep the player's changes and say so, and saving again SHALL save over the attack as it now stands. Deployed units SHALL be the war's `deployedUnitIds`. A page action Start new war SHALL ask for confirmation, then start a new war in the season the calendar names now (else the current one) at the current level when that season has it, keeping the old one in History, and SHALL clear the picked level and zone. With no current war the page SHALL show the same layout with zero tokens used, and the first logged attack SHALL start the war.

#### Scenario: A blocked team says why

- **GIVEN** an offense team whose core includes a deployed character
- **WHEN** Offense renders
- **THEN** the team is listed after the ready teams with a reason naming that character

#### Scenario: Several deployed units

- **GIVEN** an offense team whose core includes two deployed characters
- **WHEN** Offense renders
- **THEN** the reason names both characters ("A and B already attacked")

### Requirement: Attacks are logged from a selection

The toolbar SHALL pick the attack target: a Battlefield level select (the season's played levels; picking a level other than the war's saves it over the war's revision, creating the war when there is none), a Zone select (the zone kinds of the war's season grouped by their tier at the war's level, each with its game picture and buff badge; copies of a kind, such as the three Frontlines, are one choice named without a number, as the game shows them, and send the first copy's id) and the defenders' rarity (one choice per distinct cap of the zone's slots, defaulting to the one last picked, else the highest; it needs a picked level and zone). The level and zone SHALL be picked once per war and kept on this device (local storage) for that war only: picks made in another war, or cleared by Start new war, read as not picked. The rarity SHALL be kept on this device across wars and dropped when the zone lacks it. The rarity SHALL cap the available units and the offense teams; with no rarity picked units show at their own progression. The available units SHALL have a name search and a Filters control (form size) whose panel starts with an Owned only switch (on by default) and a Show deployed switch, then the team picker's filter fields; its badge SHALL count every filter that is on, Owned only included. The characters SHALL show the first 30 on desktop and 12 on phones, then a Show all (N) button, and the expanded list SHALL end with Show less; a search or any filter SHALL show every match. Every Machine of War SHALL show. With Show deployed on, the deployed units SHALL show in a Deployed section below a divider, dimmed, not pickable, each flagged with the zone it attacked. Tapping units SHALL select them. A team's Select SHALL select its core units, then its flex units that have not attacked while the attack has room, and SHALL expand the characters list when it picks a character; at most 5 characters and 1 Machine of War can be selected, and once a kind is full its other tiles SHALL be blocked with a tooltip saying why ("5 characters picked"). While anything is selected a contextual bar SHALL show the picked units' portraits at the cap, the count, an amber Under cap (N) chip for units whose rank is at or below the rank cap of the rarity below the defenders' and a muted Over cap (N) chip for units whose rank is at or above the rank cap of the rarity above (Common Iron 1, Uncommon Bronze 1, Rare Silver 1, Epic Gold 1, Legendary Diamond 3, Mythic Adamantine 1; a Machine of War is judged by its rarity), each listing its units in a hint, an amber "No Machine of War · N available" reminder when characters but no MoW are picked and owned undeployed MoWs exist (it scrolls to the MoW list and does not block logging), Clear selection, Log with details, Lost and Won. Won and Lost SHALL log the attack at once with that result; Log with details SHALL open the Log attack dialog. All three SHALL be disabled with a reason when the selection has no character, more than 5 characters, more than 1 MoW, a deployed unit, no tokens left, no level picked, or no zone picked. The Log attack dialog (a bottom sheet on phones) SHALL let the zone and rarity change (for a new attack the toolbar's zone and rarity change with them), the lineup at that cap; a result (Won or Lost, with trophy and skull icons) that starts as Won for a new attack and can be cleared, and lineup units that, while a result is set, are tapped to mark them lost (the rows stay, disabled, with no result, so the dialog keeps its height); an optional note of at most 200 characters; and a collapsed optional Enemy details section that grows with its content, with an enemy lineup builder over every catalog character and MoW (rarity and rank each with their icons, offering nothing above the defenders' rarity or its rank cap, a new enemy starting at the defenders' rarity, its highest rank for that rarity and Killed; a character can be marked killed or left damaged, a MoW has no outcome), the zone buffs active, each explained in the game's words (the attacked zone's own buff starts ticked; the list offers that buff, the ticked ones and the buffs other zones give beyond themselves, or every zone-given buff with no zone), and the map, picked by its board picture from the season's map pool, each board opening large with previous, next and Pick this map. Logging SHALL send the first slot of the zone holding the chosen rarity, the lineup with each unit's progression from the roster, the lost units and the trimmed note, then clear the selection and show the attack in the log. Each logged attack SHALL show its zone picture, zone and defenders' rarity, result, lineup with lost units greyed out, the enemy units and buffs (each explaining itself in a tooltip) when entered, the map when known, and the note. The Guild War token icon SHALL accompany every token count.

#### Scenario: Selection limit

- **GIVEN** 5 characters selected
- **WHEN** the user taps a sixth character
- **THEN** it is not selected, and its tile says "5 characters picked"

#### Scenario: A new war needs a level and zone

- **GIVEN** the player just started a new war
- **WHEN** they select a character
- **THEN** Won, Lost and Log with details are disabled with "Pick a battlefield level" until a level is picked, then "Pick a zone to attack" until a zone is picked

#### Scenario: Over cap by rank

- **GIVEN** the defenders' rarity is Rare
- **WHEN** a Gold 1 character and a Silver 3 character are selected
- **THEN** an Over cap (1) chip shows for the Gold 1 character only

#### Scenario: Zone buff starts ticked

- **GIVEN** a zone whose own buff is Armoury
- **WHEN** the user opens Enemy details in Log with details
- **THEN** Armoury is ticked, and buffs other zones give only to themselves are not offered

#### Scenario: Quick log

- **GIVEN** a zone and rarity picked and a valid selection
- **WHEN** the user taps Won
- **THEN** the attack is logged as won at that zone and rarity, the selection clears and the attack leads the log

### Requirement: History lists past wars

History SHALL list ended wars newest first, each showing its start date, season, battlefield level, tokens used and attacks won and lost, and expanding in place to its attacks, shown as in the attack log with Edit (an ended war's attacks can be corrected, not deleted). Above the list it SHALL show totals across the loaded wars: attacks, won, lost and units lost; win rate by zone tier, by zone (copies of a kind counted as one) and by defender rarity; the most used characters with their win rate; the lineups used more than once with their win rate; and the enemy characters met most in lost attacks. More wars SHALL load on demand.

#### Scenario: Empty history

- **GIVEN** a user with no ended war
- **WHEN** they open History
- **THEN** an empty state says wars appear here after Start new war
