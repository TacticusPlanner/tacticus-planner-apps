# hre-mission-teams Specification

## Purpose

Suggests teams from the player's synced roster for the current HRE mission: a team per campaign for the objectives played by hand, one team for each token mode the mission spends, and one for each mode the player has tokens to spare in. Each team folds under the objective it serves.

## Requirements

### Requirement: The mission's manual objectives share a team per campaign

When the current mission has open objectives that only progress in battles played by hand, the tab SHALL suggest, under the list of battles to fight by hand (in that objective's "Fight by hand" fold), one team for all of them per group of listed nodes whose campaigns allow the same allied factions, titled "Team for" and the group's campaigns. Each team SHALL hold only units of those factions, at most the group's largest deployment slot count (a node without a slot count takes 5), built in Power mode with the shared team engine, so it can deploy on every node of its group (Severyn, 2026-10). When some of the group's nodes take fewer units, the card SHALL say to field its first units there, since the team is listed strongest first. The teams SHALL follow the listed nodes only: when no battle is listed (no energy left, or none passes the limits), no campaign team is shown. The team SHALL follow the strictest rule among those objectives, in this order:

1. **Featured hero** (`useAbilitiesFeatured`, `featuredDamage`): the featured hero leads the team when the player has unlocked them.
2. **Alliance** (`winWithAllianceLineup`, `useAbilitiesAlliance`, `killWithAlliance`): only units of the featured hero's alliance.
3. **Summon-free** (`winWithoutSummons`): follows the LRE "No Summons" rule (Severyn, 2026-11): excludes every unit whose catalog `summons` is `passive`, since those summon on their own. A unit whose active ability summons stays, and the card says not to use an ability that summons.
4. **Ranged** (`killWithRanged`): only units with a ranged attack.
5. **Melee** (`killWithMelee`): only units without a ranged attack, so every kill is a melee one; this is stricter than the objective, since ranged units can also attack in melee.
6. **Abilities** (`useAbilities`): the strongest units, and the card says every ability use counts.
7. **Strongest** (kills, damage, ability damage, a damage type, healing): the strongest units.

Severyn chose one combined team (2026-10): no mission's two objectives ask for teams that cannot be one, so the teams split only if a future mission's pair is incompatible. Teams hold characters only: Machines of War don't count toward ability uses.

#### Scenario: Nodes from two campaigns

- **GIVEN** the list holds Indomitus nodes (Imperial factions, 5 slots) and Octarius nodes (Orks, 4 slots)
- **THEN** a "Team for Indomitus" card holds only units of Indomitus's allied factions, and a "Team for Octarius" card holds up to 4 Orks

#### Scenario: Group with fewer slots on some nodes

- **GIVEN** a group of Indomitus nodes with 5 slots and one with 4
- **THEN** its card holds 5 units and says some battles deploy only 4 units, so field the first 4

#### Scenario: All-Xenos mission

- **GIVEN** Zapspitta's mission 14, and a roster with 7 Xenos and 20 other units
- **THEN** the team holds the 5 strongest Xenos units

#### Scenario: Not enough units of the alliance

- **GIVEN** only 3 Xenos units in the roster
- **THEN** the team shows those 3, with the note "Only 3 Xenos units: the game needs a full all-Xenos team only if every slot is used". The team is not filled with other alliances

#### Scenario: Summon-free mission

- **GIVEN** mission 6, a unit whose passive ability summons, and Hollan (his active Aberrant Hypermorph summons a unit)
- **THEN** the passive summoner is not in the team, Hollan may be, and the card says not to use an ability that summons

#### Scenario: Melee kills

- **GIVEN** mission 19 with its melee kills open
- **THEN** each campaign team holds the strongest deployable units without a ranged attack

#### Scenario: Featured hero locked

- **GIVEN** mission 20 and Zapspitta not unlocked yet
- **THEN** no team is shown for that objective, and the tab says to unlock Zapspitta or play them in an event that lends them

#### Scenario: Team kept below five

- **GIVEN** a melee campaign team of only 4 deployable units (issue 7, Fall of Cadia Mirror)
- **THEN** the card reads "Your 4 strongest melee units", never 5

#### Scenario: Roster loading or failed

- **WHEN** the roster is loading
- **THEN** the team card shows a skeleton
- **WHEN** reading the roster fails
- **THEN** the team card shows a retry action

### Requirement: Every token objective gets a team for its mode

Every open `arenaBattles`, `salvageRuns`, `onslaught` or `guildRaids` objective SHALL get its own team card titled by its mode (Arena, Salvage Run, Onslaught, Guild Raid), following the rule of the mission's other open objective when that one is manual, so its battles count for both. A token objective open alone SHALL get the player's strongest units. An Onslaught team is a pool (see "Onslaught pools keep to one alliance"); the card SHALL count the units it holds and say there are no spares when fewer than 5 qualify.

The team folds under its token objective as one row: the mode's token icon and name, "N battles" (the battles to go) and the team's portraits; it opens to the full team card.

#### Scenario: Token objective folded

- **GIVEN** mission 10 with 1 of 4 Arena battles
- **THEN** under the Arena objective a closed row shows the Arena token, "3 battles" and the team's portraits

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

- **GIVEN** mission 4 with its Arena battles and ranged kills open and no spare tokens
- **THEN** the Arena card holds the 5 strongest ranged units of any alliance, and no other token team is shown

### Requirement: Manual objectives get a team in every spare-token mode

Spare tokens SHALL be, per mode (Arena, Onslaught, Salvage Run), the synced tokens held now minus the battles of that mode the current mission (less its progress) and every later mission still need (Severyn, 2026-11). Regeneration during the event is not counted, so the count is a safe floor; the card SHALL say tokens refill. A mode with unknown tokens has none. While the current mission has an open manual objective, each mode with spare tokens that the mission does not already play for a token objective SHALL get a team for the manual objectives, with their rule and preferences, folded under the first manual objective after its "Fight by hand" fold. This replaces the earlier fixed Onslaught pool and the mission 6 Arena surplus rule.

- Modes SHALL come Onslaught, Salvage Run, then Arena for kills, damage, healing and ability uses, whose enemies come in waves; Arena first otherwise.
- The folded row SHALL show the token icon, "Up to N battles" (the spare) and the team's portraits. The card SHALL say why: "You hold 15 Arena tokens and the remaining missions need 12, so play up to 3 battles here."
- **Onslaught ability uses** (`useAbilities`, `useAbilitiesAlliance`): the team SHALL be the whole alliance, weakest first, with the hint to use each unit's ability, let it fall, and let the next one deploy.
- **Arena kills**: the card SHALL say to pick opponents with summoners, since their summons count as kills. **Arena faction kills** SHALL also say to fight only opponent teams with that faction, since Arena shows the opponent's team before the battle (Severyn, 2026-11).
- **Onslaught and Salvage Run** (spare or token objective) SHALL say these battles count for the mission but earn no event points: the HREs score points only in Campaign, Elite, Mirror, Campaign Event, Arena and Guild Raid battles.
- **Summon-free wins** (mission 6): the wins the spare Arena tokens can play SHALL be left out of the campaign list.

#### Scenario: Mission 2 during Faction Boost: World Eaters

- **GIVEN** mission 2 (defeat 10 enemies with Chaos units), 15 Arena tokens with 8 needed, and Faction Boost: World Eaters running
- **THEN** under the kill objective, after "Fight by hand", a closed Arena row shows "Up to 7 battles" with a Chaos team led by World Eaters
- **AND** the card says why, to pick opponents with summoners, that both events progress and that the boost gives +20% health, damage and armour there

#### Scenario: Mission 15 with spare Onslaught tokens

- **GIVEN** mission 15 with its Arena battles open and 3 Onslaught tokens, 0 needed later
- **THEN** campaign teams, the Arena team and an Onslaught team of the whole alliance, weakest first, are shown; the Onslaught card says it earns no event points

#### Scenario: Mission 6 with spare Arena tokens

- **GIVEN** mission 6 with 0 / 10 summon-free wins and 11 Arena tokens, the missions from 6 on needing 8
- **THEN** an Arena team without forced summoners shows "Up to 3 battles", and the campaign list covers the other 7 wins

#### Scenario: No spare tokens

- **GIVEN** tokens unknown, or held tokens at or below the remaining need
- **THEN** no spare-token team is shown

### Requirement: Onslaught pools keep to one alliance

An Onslaught team SHALL hold up to 8 units, 5 to start and the rest to replace units that fall (every unit of the alliance for ability uses on spare tokens), all from the alliance with the most owned eligible units; a tie goes to the featured hero's alliance.

#### Scenario: Tie between alliances

- **GIVEN** 3 ranged Imperial and 3 ranged Xenos units owned, with a featured Xenos hero
- **THEN** the Onslaught team holds the 3 Xenos units

### Requirement: Tokens are kept for later missions

For a token objective's Arena, Salvage Run, Onslaught or Guild Raid team, the card SHALL say how many tokens of that mode the next later mission needs, and with synced tokens how many can be played now. A spare-token team says its spare instead.

#### Scenario: Mission 4 Arena tokens

- **GIVEN** mission 4 and 7 Arena tokens synced
- **THEN** the Arena card reads "Keep 4 Arena tokens for mission 10. With 7 now, play up to 3."

### Requirement: Support and damage-type preferences

While the current mission's `heal` objective is open, the team SHALL include the strongest eligible Healer or Mechanic, or say that the player owns none. While its `damageType` "Psychic" objective is open, eligible units that deal Psychic damage SHALL lead the team.

#### Scenario: Heal objective open

- **GIVEN** mission 6 with 0 / 2,500 healing and one non-summoning Healer owned
- **THEN** that Healer is in the team, with the note that it is there for the heal objective

#### Scenario: Psychic objective met

- **GIVEN** mission 9 with 7,500 / 7,500 Psychic damage
- **THEN** the ranged team is ordered by power only

### Requirement: HRE teams take a running HSE into account

While a personal Home Screen Event runs and scores in a team's mode (the campaign for the campaign teams), the HRE mission team SHALL rank the units that score for it first, after the mission's own rule and preferences, and the card SHALL say how many of its units also score for it, and the event's stat boost in that mode when it has one. When several Home Screen Events run, each team SHALL take the personal one whose trackers score in its mode, never a Global one (issue 12: Global Blood Tithe ran beside Faction Boost: World Eaters).

#### Scenario: Psyker Boost during mission 15

- **GIVEN** mission 15 and a running Psyker Boost
- **THEN** the Arena team is led by the player's Psykers
- **AND** the card says how many of its units score for Psyker Boost

#### Scenario: A Global and a personal HSE at once

- **GIVEN** a Global event and Faction Boost: World Eaters both running
- **THEN** the Arena, Onslaught and Salvage Run teams follow Faction Boost, and the campaign teams follow neither (Faction Boost does not score in campaign battles)

#### Scenario: No HSE running

- **GIVEN** no Home Screen Event runs, or a Global one
- **THEN** the teams are the strongest units allowed by the mission's rule, with no HSE note

### Requirement: Onslaught tracks follow a running HSE

An Onslaught or Salvage Run team not already kept to one alliance SHALL keep to the alliance with the most of the running HSE's scoring units, then the most units.

#### Scenario: More Chaos Psykers than Imperial ones

- **GIVEN** a running Psyker Boost, 6 Imperial units with 4 Psykers and 5 Chaos Psykers
- **THEN** the Onslaught pool keeps to Chaos
