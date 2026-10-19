## MODIFIED Requirements

### Requirement: The team is suggested for the mode the mission points to

The team card SHALL be titled by where the team plays:

- **Salvage Run** while the mission's `salvageRuns` objective is open (mission 7), with the featured hero's alliance.
- **Arena** for a summon-free objective (mission 6), and for ranged kills while the mission's `arenaBattles` objective is open (mission 4).
- **Onslaught** for ranged kills otherwise (missions 9 and 18): up to 8 units from one alliance, so fallen units can be replaced. The card SHALL count the units it holds, and say there are no spares when fewer than 5 qualify.
- **Mission team** (campaign battles) otherwise.

#### Scenario: Mission 6

- **GIVEN** mission 6 with both objectives open
- **THEN** the card is titled "Arena team" and holds no summoner

#### Scenario: Mission 7 after the Salvage Runs

- **GIVEN** mission 7 with 2 / 2 Salvage Runs and the ability uses open
- **THEN** the card is titled "Mission team" with the featured hero's alliance

#### Scenario: Mission 9

- **GIVEN** mission 9, a featured Xenos hero, and 4 ranged Chaos, 3 ranged Imperial and 1 ranged Xenos units owned
- **THEN** the card is titled "Onslaught team" and holds the 4 Chaos units, noting there are no spares

#### Scenario: Mission 4

- **GIVEN** mission 4 with its Arena battles and ranged kills open
- **THEN** the card is titled "Arena team" and holds the 5 strongest ranged units of any alliance
