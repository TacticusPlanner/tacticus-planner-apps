## Purpose

Defines the Guild War pages in the Guild section: the war's season and level, the Offense tracker with its attack log, and the History tab.

## ADDED Requirements

### Requirement: Guild War pages are sign-in only and need no registered guild

The app SHALL serve `/guild/war/offense` and `/guild/war/history` to any signed-in user, whether or not they belong to a registered guild, and `/guild/war` SHALL redirect to `/guild/war/offense`. Both pages SHALL share one header (title, one line of description, Tour this page, and a Settings button) and page tabs listing Offense and History.

#### Scenario: No registered guild

- **GIVEN** a signed-in user whose guild is not registered
- **WHEN** they open `/guild/war/offense`
- **THEN** the Offense page renders, not the guild onboarding

### Requirement: The war's season and level are shown and set in Settings

Above the tabs the page SHALL show the war's season and battlefield level as plain text; the header's Settings button SHALL be the one way to change them. With no current war the season SHALL be the one the events calendar names for the running (else the next, else the latest) Guild War season through its `seasonConfigId`, else the first served season, at battlefield level 1. Battlefield level 0 (the game's "not taking part") SHALL NOT be offered; a war stored at level 0 still shows it. A season SHALL be shown by its calendar number ("Season 29": the calendar season running that config when the war started, or now with no war, else the next, else the latest); Settings SHALL show it read-only. Only a season the calendar does not name SHALL show its config letter and stay selectable in Settings until the war has attacks (then disabled with a note saying to start a new war); the level stays editable.

#### Scenario: Calendar default

- **GIVEN** no current war and a calendar Guild War season naming `guildWarSeasonC`
- **WHEN** Offense renders
- **THEN** the summary reads "Season 29 · Battlefield level 1" for calendar season 29

#### Scenario: Season kept under attacks

- **GIVEN** a current war with one attack in a season the calendar does not name
- **WHEN** the user opens Settings
- **THEN** the season select is disabled and the level select is not

### Requirement: Offense tracks the current war

Offense SHALL show a toolbar with the zone and the defenders' rarity (see below) and Start new war as its filled action, then, in order: a summary strip (tokens used of the season's `maxAttempts`, units left per rarity, attacks won and lost), the player's offense teams (teams with the `warOffense` mode, with New team opening the team editor with War Offense picked) with those whose core units are all available first and blocked ones after with the reason naming a deployed unit, the available units with search and Filters, and the attack log newest first with Edit and Delete per attack. Delete SHALL ask for confirmation. Edit SHALL open the attack in the Log attack dialog, where the zone and rarity can change too, and save it with the attack's revision; when another device changed the attack first, the dialog SHALL keep the player's changes and say so, and saving again SHALL save over the attack as it now stands. Deployed units SHALL be the war's `deployedUnitIds`. A page action Start new war SHALL ask for confirmation, then start a new war in the season the calendar names now (else the current one) at the current level when that season has it, keeping the old one in History. With no current war the page SHALL show the same layout with zero tokens used, and the first logged attack SHALL start the war.

#### Scenario: A blocked team says why

- **GIVEN** an offense team whose core includes a deployed character
- **WHEN** Offense renders
- **THEN** the team is listed after the ready teams with a reason naming that character

### Requirement: Attacks are logged from a selection

The toolbar SHALL pick the attack target: a Zone select (the zone kinds of the war's season grouped by their tier at the war's level, each with its game picture and buff badge; copies of a kind, such as the three Frontlines, are one choice named without a number, as the game shows them, and send the first copy's id) and the defenders' rarity (one choice per distinct cap of the zone's slots, defaulting to the highest). Both SHALL be kept on this device (local storage) and dropped when the season or zone lacks them. The rarity SHALL cap the available units and the offense teams; with no zone picked units show at their own progression. Tapping units, or a team's Select, SHALL select them; while anything is selected a contextual bar SHALL show the count, Clear selection, Log with details, Lost and Won. Won and Lost SHALL log the attack at once with that result; Log with details SHALL open the Log attack dialog. All three SHALL be disabled with a reason when the selection has no character, more than 5 characters, more than 1 MoW, a deployed unit, no tokens left, or no zone picked. The Log attack dialog (a bottom sheet on phones) SHALL show the zone and rarity read-only, the lineup at that cap; an optional result (Won or Lost) after which tapping lineup units marks them lost; an optional note of at most 200 characters; and a collapsed optional Enemy details section that grows with its content, with an enemy lineup builder over every catalog character and MoW (rarity and rank each with their icons, a new enemy starting at the defenders' rarity, its highest rank for that rarity and Killed; a character can be marked killed or left damaged, a MoW has no outcome), the zone buffs active, each explained in the game's words, and the map. Logging SHALL send the first slot of the zone holding the chosen rarity, the lineup with each unit's progression from the roster, the lost units and the trimmed note, then clear the selection and show the attack in the log. Each logged attack SHALL show its zone picture, zone and defenders' rarity, result, lineup with lost units greyed out, the enemy units and buffs (each explaining itself in a tooltip) when entered, the map when known, and the note. The Guild War token icon SHALL accompany every token count.

#### Scenario: Too many characters

- **GIVEN** 6 characters selected
- **WHEN** the contextual bar renders
- **THEN** Won, Lost and Log with details are disabled with "Pick at most 5 characters"

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
