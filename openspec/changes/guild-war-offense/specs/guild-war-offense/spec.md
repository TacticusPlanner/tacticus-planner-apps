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

Above the tabs the page SHALL show the war's season and battlefield level; tapping it SHALL open Settings, as the header's Settings button does. With no current war the season SHALL be the one the events calendar names for the current (else the latest started, else the next) Guild War season through its `seasonConfigId`, else the first served season, at battlefield level 5. Once the war has attacks, Settings SHALL keep its season (the select is disabled with a note saying to start a new war); the level stays editable.

#### Scenario: Calendar default

- **GIVEN** no current war and a calendar Guild War season naming `guildWarSeasonC`
- **WHEN** Offense renders
- **THEN** the summary reads "Season C · Battlefield level 5"

#### Scenario: Season kept under attacks

- **GIVEN** a current war with one attack
- **WHEN** the user opens Settings
- **THEN** the season select is disabled and the level select is not

### Requirement: Offense tracks the current war

Offense SHALL show, in order: a summary strip (tokens used of the season's `maxAttempts`, units left per rarity, attacks won and lost), the player's offense teams (teams with the `warOffense` mode) with those whose core units are all available first and blocked ones after with the reason naming a deployed unit, the available units with search and Filters, and the attack log newest first with an Undo per attack. Deployed units SHALL be the war's `deployedUnitIds`. A page action Start new war SHALL ask for confirmation, then start a new war with the current season and level, keeping the old one in History. With no current war the page SHALL show the same layout with zero tokens used, and the first logged attack SHALL start the war.

#### Scenario: A blocked team says why

- **GIVEN** an offense team whose core includes a deployed character
- **WHEN** Offense renders
- **THEN** the team is listed after the ready teams with a reason naming that character

### Requirement: Attacks are logged from a selection

Tapping units, or a team's Select, SHALL select them; while anything is selected a contextual bar SHALL show the count, Log attack and Clear. Log attack SHALL be disabled with a reason when the selection has no character, more than 5 characters, more than 1 MoW, a deployed unit, or no tokens left. Units on the page SHALL show at their own progression. The Log attack dialog (a bottom sheet on phones) SHALL show a Zone select (zones of the war's season grouped by their tier at the war's level, each with its game picture and buff badge), starting on the zone last logged on this device (local storage, cleared when the season lacks it); the defenders' rarity, one choice per distinct cap of the zone's slots, starting on the lowest cap the lineup's highest rarity fits under, else the highest; the lineup at that cap; an optional result (Won or Lost) after which tapping lineup units marks them lost; an optional note of at most 200 characters; and a collapsed optional Enemy details section with an enemy lineup builder over every catalog character and MoW (rarity and rank each, and whether it was killed or left damaged), the zone buffs active, and the map. Saving SHALL need a zone, SHALL send the first slot holding the chosen rarity, the lineup with each unit's progression from the roster, the lost units and the trimmed note, then clear the selection and show the attack in the log. Each logged attack SHALL show its zone picture, zone and defenders' rarity, result, lineup with lost units greyed out, the enemy units and buffs when entered, and the note. The Guild War token icon SHALL accompany every token count.

#### Scenario: Too many characters

- **GIVEN** 6 characters selected
- **WHEN** the contextual bar renders
- **THEN** Log attack is disabled with "Pick at most 5 characters"

### Requirement: History lists past wars

History SHALL list ended wars newest first, each showing its start date, season, battlefield level, tokens used and attacks won and lost, and expanding in place to its attacks, shown as in the attack log. Above the list it SHALL show totals across the loaded wars: attacks, won, lost and units lost; win rate by zone tier, by zone and by defender rarity; the most used characters with their win rate; the lineups used more than once with their win rate; and the enemy characters met most in lost attacks. More wars SHALL load on demand.

#### Scenario: Empty history

- **GIVEN** a user with no ended war
- **WHEN** they open History
- **THEN** an empty state says wars appear here after Start new war
