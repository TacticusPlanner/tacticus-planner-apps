# legendary-event-missions Specification

## Purpose

Defines Legendary Event missions as typed requirements: their translated labels, which missions are open for suggestions in the current run, and when a planned token progresses a mission.

## Requirements

### Requirement: Missions are typed requirements with translated labels

The client SHALL read each served mission's `kind` and parameters and SHALL render its label from them through i18n (for example `defeatFaction` Necrons × 30 → "Defeat 30 Necrons"), falling back to the served `text` for a kind it does not know.

#### Scenario: Translated label

- **GIVEN** Uthar's regular mission index 1 is `{ kind: "defeatFaction", faction: "Necrons", count: 30 }`
- **WHEN** the drawer renders in German
- **THEN** its label is the German translation of "Defeat 30 Necrons"

### Requirement: Open missions of the current run

A mission is **open** for a run when it is not ticked Done for that run. The planner SHALL use the open regular missions of the current run, and its open premium missions only when Show paid options is on and the run plans the premium track (stored premium missions > 0). With no run in progress (event upcoming or between runs) the planner SHALL use the next run's open missions; with no run known there are no open missions for suggestions.

#### Scenario: Premium hidden

- **GIVEN** Show paid options is off
- **WHEN** open missions are computed
- **THEN** no premium mission is open for suggestions

#### Scenario: Upcoming event

- **GIVEN** an upcoming event whose run 1 has not started
- **WHEN** the Next token card is shown
- **THEN** it names the run 1 missions the Next token progresses

### Requirement: A token progresses a mission by battle and team

A planned token SHALL progress an open mission when:

- `defeatFaction`: an enemy in any wave of the token's battle belongs to the mission's faction;
- `defeatWithAlliance` or `useAbilitiesWithAlliance`: a non-reserve member of the token's team belongs to the alliance;
- `damageType` or `defeatWithDamageType`: a non-reserve member deals that damage type (the shared damage-type exclusions apply);
- `winWithoutTrait`: no non-reserve member has the trait;
- `anyBattle` and `winWithoutSummon`: always. The catalog tags summoned NPCs, not the characters that summon them, so a summoner cannot be told apart; both kinds are **untracked**.

#### Scenario: Faction from battle enemies

- **GIVEN** Uthar Beta battle 4 has AdMech enemies and the mission "Defeat 75 AdMechs" is open
- **WHEN** a token on Beta battle 4 is checked
- **THEN** it progresses that mission; a token on Alpha (Necrons only) does not

#### Scenario: Win without a trait

- **GIVEN** the open premium mission "Win 5 battles without deploying any Big Target characters" and team Melee with no Big Target member
- **WHEN** a Melee token is checked
- **THEN** it progresses the mission; a token of a team holding a Big Target member does not

#### Scenario: Reserve does not count

- **GIVEN** a team whose only Chaos unit is its reserve
- **WHEN** "Defeat 30 enemies with Chaos units" is checked for its token
- **THEN** the token does not progress it

### Requirement: A token's mission amount

For a tracked open mission, a won token SHALL add: for `defeatFaction`, the enemies of the mission's faction (or trait) across the battle's waves; for `defeatWithAlliance` and `defeatWithDamageType`, every enemy of the battle when the token progresses the mission (an estimate); for `damageType`, the battle's waves when it progresses the mission (an estimate); for `useAbilitiesWithAlliance`, one per non-reserve member of the alliance (an estimate); for `winWithoutTrait`, 1 when it progresses the mission. Untracked kinds have no amount.

#### Scenario: Faction count from waves

- **GIVEN** a battle whose waves hold 12 Orks and the open mission "Defeat 30 Orks"
- **WHEN** the mission amount of a token on that battle is computed
- **THEN** it is 12, not an estimate
