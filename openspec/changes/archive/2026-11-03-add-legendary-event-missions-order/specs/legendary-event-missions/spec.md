# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: A token's mission amount

For a tracked open mission, a won token SHALL add: for `defeatFaction`, the enemies of the mission's faction (or trait) across the battle's waves; for `defeatWithAlliance` and `defeatWithDamageType`, every enemy of the battle when the token progresses the mission (an estimate); for `damageType`, the battle's waves when it progresses the mission (an estimate); for `useAbilitiesWithAlliance`, one per non-reserve member of the alliance (an estimate); for `winWithoutTrait`, 1 when it progresses the mission. Untracked kinds have no amount.

#### Scenario: Faction count from waves

- **GIVEN** a battle whose waves hold 12 Orks and the open mission "Defeat 30 Orks"
- **WHEN** the mission amount of a token on that battle is computed
- **THEN** it is 12, not an estimate
