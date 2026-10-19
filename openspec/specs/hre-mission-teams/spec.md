# hre-mission-teams Specification

## Purpose

Suggests a team from the player's synced roster for HRE mission objectives that restrict the lineup or need the featured hero.

## Requirements

### Requirement: Lineup-restricted objectives get a team suggestion

When the current mission has a `winWithAllianceLineup`, `useAbilitiesAlliance`, `winWithoutSummons`, `killWithRanged`, `useAbilitiesFeatured` or `featuredDamage` objective below its target, the tab SHALL suggest one team from the synced roster for the first such objective, built in Power mode with the shared team engine. The rules are:

- **All-alliance lineup or alliance ability uses:** only units of the featured hero's alliance.
- **Summon-free:** excludes every unit with an ability that summons units, according to the ability rules text.
- **Ranged kills:** only units with a ranged attack.
- **Featured-hero objective:** the featured hero leads the team when the player has unlocked them.

#### Scenario: All-Xenos mission

- **GIVEN** Zapspitta's mission 14, and a roster with 7 Xenos and 20 other units
- **THEN** the team holds the 5 strongest Xenos units

#### Scenario: Not enough units of the alliance

- **GIVEN** only 3 Xenos units in the roster
- **THEN** the team shows those 3, with the note "Only 3 Xenos units: the game needs a full all-Xenos team only if every slot is used". The team is not filled with other alliances

#### Scenario: Summon-free mission

- **GIVEN** mission 6, and Hollan in the roster (his Aberrant Hypermorph ability summons a unit)
- **THEN** Hollan is not in the team

#### Scenario: Featured hero locked

- **GIVEN** mission 20 and Zapspitta not unlocked yet
- **THEN** no team is shown for that objective, and the tab says to unlock Zapspitta first

#### Scenario: Roster loading or failed

- **WHEN** the roster is loading
- **THEN** the team card shows a skeleton
- **WHEN** reading the roster fails
- **THEN** the team card shows a retry action

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

### Requirement: Onslaught pools keep to one alliance

An Onslaught team SHALL hold up to 8 units, 5 to start and the rest to replace units that fall, all from the alliance with the most owned eligible units; a tie goes to the featured hero's alliance.

#### Scenario: Tie between alliances

- **GIVEN** 3 ranged Imperial and 3 ranged Xenos units owned, with a featured Xenos hero
- **THEN** the Onslaught team holds the 3 Xenos units

### Requirement: Tokens are kept for later missions

For an Arena, Salvage Run or Onslaught team, the card SHALL say how many tokens of that mode the next later mission needs, and with synced tokens how many can be played now.

#### Scenario: Mission 6 Arena tokens

- **GIVEN** mission 6 and 7 Arena tokens synced
- **THEN** the card reads "Keep 4 Arena tokens for mission 10. With 7 now, play up to 3."

### Requirement: Support and damage-type preferences

While the current mission's `heal` objective is open, the team SHALL include the strongest eligible Healer or Mechanic, or say that the player owns none. While its `damageType` "Psychic" objective is open, eligible units that deal Psychic damage SHALL lead the team.

#### Scenario: Heal objective open

- **GIVEN** mission 6 with 0 / 2,500 healing and one non-summoning Healer owned
- **THEN** that Healer is in the team, with the note that it is there for the heal objective

#### Scenario: Psychic objective met

- **GIVEN** mission 9 with 7,500 / 7,500 Psychic damage
- **THEN** the ranged team is ordered by power only
