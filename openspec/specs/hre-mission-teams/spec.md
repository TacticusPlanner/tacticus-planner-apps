# hre-mission-teams Specification

## Purpose

Suggests teams from the player's synced roster for the current HRE mission: a team per campaign for the objectives played by hand, and one team for each token mode the mission spends.

## Requirements

### Requirement: The mission's manual objectives share a team per campaign

When the current mission has open objectives that only progress in battles played by hand, the tab SHALL suggest, under the list of battles to fight by hand, one team for all of them per group of listed nodes whose campaigns allow the same allied factions, titled "Team for" and the group's campaigns. Each team SHALL hold only units of those factions, at most the group's largest deployment slot count, built in Power mode with the shared team engine, so it can deploy on every node of its group (Severyn, 2026-10). The team SHALL follow the strictest rule among those objectives, in this order:

1. **Featured hero** (`useAbilitiesFeatured`, `featuredDamage`): the featured hero leads the team when the player has unlocked them.
2. **Alliance** (`winWithAllianceLineup`, `useAbilitiesAlliance`, `killWithAlliance`): only units of the featured hero's alliance.
3. **Summon-free** (`winWithoutSummons`): excludes every unit with an ability that summons units, according to the ability rules text.
4. **Ranged** (`killWithRanged`): only units with a ranged attack.
5. **Melee** (`killWithMelee`): only units without a ranged attack, so every kill is a melee one; this is stricter than the objective, since ranged units can also attack in melee.
6. **Abilities** (`useAbilities`): the strongest units, and the card says every ability use counts.
7. **Strongest** (kills, damage, ability damage, a damage type, healing): the strongest units.

Severyn chose one combined team (2026-10): no mission's two objectives ask for teams that cannot be one, so the teams split only if a future mission's pair is incompatible. Teams hold characters only: Machines of War don't count toward ability uses.

#### Scenario: Nodes from two campaigns

- **GIVEN** the list holds Indomitus nodes (Imperial factions, 5 slots) and Octarius nodes (Orks, 4 slots)
- **THEN** a "Team for Indomitus" card holds only units of Indomitus's allied factions, and a "Team for Octarius" card holds up to 4 Orks

#### Scenario: All-Xenos mission

- **GIVEN** Zapspitta's mission 14, and a roster with 7 Xenos and 20 other units
- **THEN** the team holds the 5 strongest Xenos units

#### Scenario: Not enough units of the alliance

- **GIVEN** only 3 Xenos units in the roster
- **THEN** the team shows those 3, with the note "Only 3 Xenos units: the game needs a full all-Xenos team only if every slot is used". The team is not filled with other alliances

#### Scenario: Summon-free mission

- **GIVEN** mission 6, and Hollan in the roster (his Aberrant Hypermorph ability summons a unit)
- **THEN** Hollan is not in the team

#### Scenario: Melee kills

- **GIVEN** mission 19 with its melee kills open
- **THEN** each campaign team holds the strongest deployable units without a ranged attack

#### Scenario: Featured hero locked

- **GIVEN** mission 20 and Zapspitta not unlocked yet
- **THEN** no team is shown for that objective, and the tab says to unlock Zapspitta first

#### Scenario: Roster loading or failed

- **WHEN** the roster is loading
- **THEN** the team card shows a skeleton
- **WHEN** reading the roster fails
- **THEN** the team card shows a retry action

### Requirement: Every token objective gets a team for its mode

Every open `arenaBattles`, `salvageRuns`, `onslaught` or `guildRaids` objective SHALL get its own team card titled by its mode (Arena, Salvage Run, Onslaught, Guild Raid), following the rule of the mission's other open objective when that one is manual, so its battles count for both. A token objective open alone SHALL get the player's strongest units. An Onslaught team SHALL hold up to 8 units from one alliance, so fallen units can be replaced; the card SHALL count the units it holds and say there are no spares when fewer than 5 qualify.

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

### Requirement: Onslaught pools keep to one alliance

An Onslaught team SHALL hold up to 8 units, 5 to start and the rest to replace units that fall, all from the alliance with the most owned eligible units; a tie goes to the featured hero's alliance.

#### Scenario: Tie between alliances

- **GIVEN** 3 ranged Imperial and 3 ranged Xenos units owned, with a featured Xenos hero
- **THEN** the Onslaught team holds the 3 Xenos units

### Requirement: Tokens are kept for later missions

For an Arena, Salvage Run, Onslaught or Guild Raid team, the card SHALL say how many tokens of that mode the next later mission needs, and with synced tokens how many can be played now.

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

### Requirement: HRE teams take a running HSE into account

While a personal Home Screen Event runs and scores in a team's mode (the campaign for the campaign teams), the HRE mission team SHALL rank the units that score for it first, after the mission's own rule and preferences, and the card SHALL say how many of its units also score for it.

#### Scenario: Psyker Boost during mission 15

- **GIVEN** mission 15 and a running Psyker Boost
- **THEN** the Arena team is led by the player's Psykers
- **AND** the card says how many of its units score for Psyker Boost

#### Scenario: No HSE running

- **GIVEN** no Home Screen Event runs, or a Global one
- **THEN** the teams are the strongest units allowed by the mission's rule, with no HSE note

### Requirement: Onslaught tracks follow a running HSE

An Onslaught or Salvage Run team not already kept to one alliance SHALL keep to the alliance with the most of the running HSE's scoring units, then the most units.

#### Scenario: More Chaos Psykers than Imperial ones

- **GIVEN** a running Psyker Boost, 6 Imperial units with 4 Psykers and 5 Chaos Psykers
- **THEN** the Onslaught pool keeps to Chaos
