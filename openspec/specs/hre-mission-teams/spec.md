# hre-mission-teams Specification

## Purpose

Suggests a team from the player's synced roster for HRE mission objectives that restrict the lineup or need the featured hero.

## Requirements

### Requirement: Lineup-restricted objectives get a team suggestion

When the current mission has a `winWithAllianceLineup`, `winWithoutSummons`, `useAbilitiesFeatured` or `featuredDamage` objective below its target, the tab SHALL suggest one 5-unit team from the synced roster, built in Power mode with the shared team engine. The rules are:

- **All-alliance lineup:** only units of the featured hero's alliance.
- **Summon-free:** excludes every unit with an ability that summons units, according to the ability rules text.
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
