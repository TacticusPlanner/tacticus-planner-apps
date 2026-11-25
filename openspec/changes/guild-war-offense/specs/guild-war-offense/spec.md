## Purpose

Defines the Guild War pages in the Guild section: the attack target, the Offense tracker with its attack log, and the History tab.

## ADDED Requirements

### Requirement: Guild War pages are sign-in only and need no registered guild

The app SHALL serve `/guild/war/offense` and `/guild/war/history` to any signed-in user, whether or not they belong to a registered guild, and `/guild/war` SHALL redirect to `/guild/war/offense`. Both pages SHALL share one header (title, one line of description, Tour this page, and a Settings button) and page tabs listing Offense and History.

#### Scenario: No registered guild

- **GIVEN** a signed-in user whose guild is not registered
- **WHEN** they open `/guild/war/offense`
- **THEN** the Offense page renders, not the guild onboarding

### Requirement: The attack target is remembered on the device

Above the tabs the page SHALL show a Zone select (zones of the war's season, grouped by their tier at the war's battlefield level, each with its buff) and a Slot select (slots 1 to 5, each showing its rarity cap). The last picked zone and slot SHALL be stored in local storage and restored on the next visit and when switching tabs; they SHALL NOT be query parameters. A stored zone the season does not have, or a slot outside 1 to 5, SHALL be cleared. The rarity cap of the picked zone and slot SHALL be the cap every unit portrait on the page is shown at; with no zone picked, units SHALL be shown uncapped.

#### Scenario: Remembered target

- **GIVEN** the user picked Armoury, slot 3, and reloads the page
- **WHEN** Offense renders
- **THEN** Armoury and slot 3 are still picked and portraits are capped at that slot's rarity

### Requirement: Offense tracks the current war

Offense SHALL show, in order: a summary strip (tokens used of the season's `maxAttempts`, units left per rarity, attacks won and lost), the player's offense teams (teams with the `warOffense` mode) with those whose core units are all available first and blocked ones after with the reason naming a deployed unit, the available units with search and Filters, and the attack log newest first with an Undo per attack. Deployed units SHALL be the war's `deployedUnitIds`. A page action Start new war SHALL ask for confirmation, then start a new war with the current season and level, keeping the old one in History. With no current war the page SHALL show the same layout with zero tokens used, and the first logged attack SHALL start the war.

#### Scenario: A blocked team says why

- **GIVEN** an offense team whose core includes a deployed character
- **WHEN** Offense renders
- **THEN** the team is listed after the ready teams with a reason naming that character

### Requirement: Attacks are logged from a selection

Tapping units, or a team's Select, SHALL select them; while anything is selected a contextual bar SHALL show the count, Log attack and Clear. Log attack SHALL be disabled with a reason when the selection has no character, more than 5 characters, more than 1 MoW, a deployed unit, no zone picked, or no tokens left. The Log attack dialog (a bottom sheet on phones) SHALL show the lineup, zone and slot, an optional result (Won with 0, 1, 2 or more units lost, or Lost), and a collapsed optional Enemy details section with an enemy lineup builder over every catalog character and MoW (rarity and rank each, and whether it was killed or left damaged), the zone buffs active, and the map. Saving SHALL send the lineup with each unit's progression from the roster, clear the selection and show the attack in the log.

#### Scenario: Too many characters

- **GIVEN** 6 characters selected
- **WHEN** the contextual bar renders
- **THEN** Log attack is disabled with "Pick at most 5 characters"

### Requirement: History lists past wars

History SHALL list ended wars newest first, each showing its start date, season, battlefield level, tokens used and attacks won and lost, and expanding in place to its attacks (lineup as logged, zone and slot, rarity cap, result, and enemy details when entered). Above the list it SHALL show totals across the loaded wars: win rate by zone tier and by slot rarity, and the most used lineups. More wars SHALL load on demand.

#### Scenario: Empty history

- **GIVEN** a user with no ended war
- **WHEN** they open History
- **THEN** an empty state says wars appear here after Start new war
