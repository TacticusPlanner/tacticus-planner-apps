## MODIFIED Requirements

### Requirement: Every token objective gets a team for its mode

Every open `arenaBattles`, `salvageRuns`, `onslaught` or `guildRaids` objective SHALL get its own team card titled by its mode (Arena, Salvage Run, Onslaught, Guild Raid), following the rule of the mission's other open objective when that one is manual, so its battles count for both. A token objective open alone SHALL get the player's strongest units. An Onslaught team is a pool (see "Onslaught pools keep to one alliance"); the card SHALL count the units it holds and say there are no spares when fewer than 5 qualify.

Besides those cards:

- **Ranged kills** SHALL also get an Onslaught pool while the mission has no open Arena objective (missions 9 and 18).
- **Any-unit ability uses** SHALL also get an Onslaught pool (missions 3 and 15).
- **Summon-free wins** (mission 6) SHALL get an Arena team only while the player's Arena tokens exceed what the next Arena mission needs; the wins those extra tokens can play SHALL be left out of the campaign list, and the rest SHALL be fought in the campaign.

#### Scenario: Mission 7

- **GIVEN** mission 7 with 0 / 2 Salvage Runs and 0 / 20 alliance ability uses
- **THEN** campaign teams and a Salvage Run team are shown, both of the featured hero's alliance

#### Scenario: Mission 7 after the Salvage Runs

- **GIVEN** mission 7 with 2 / 2 Salvage Runs and the ability uses open
- **THEN** only the campaign teams are shown, with the featured hero's alliance

#### Scenario: Mission 8

- **GIVEN** mission 8 with both objectives open
- **THEN** campaign teams and a Guild Raid team of the player's strongest units are shown

#### Scenario: Mission 9

- **GIVEN** mission 9, a featured Xenos hero, and 4 ranged Chaos, 3 ranged Imperial and 1 ranged Xenos units owned
- **THEN** the Onslaught card holds the 4 Chaos units, noting there are no spares

#### Scenario: Mission 4

- **GIVEN** mission 4 with its Arena battles and ranged kills open
- **THEN** the Arena card holds the 5 strongest ranged units of any alliance, and no Onslaught pool is shown

#### Scenario: Mission 15 with Arena battles open

- **GIVEN** mission 15 with 0 of 4 Arena battles and 0 of 150 ability uses
- **THEN** campaign teams, an Arena team and an Onslaught pool are shown

#### Scenario: Mission 6 Arena surplus

- **GIVEN** mission 6 with 0 / 10 summon-free wins and 7 Arena tokens, mission 10 needing 4
- **THEN** an Arena team without summoners is shown, and the campaign list covers the other 7 wins

#### Scenario: Mission 6 without surplus

- **GIVEN** mission 6 with 4 Arena tokens
- **THEN** no Arena team is shown, and the campaign list covers all 10 wins
