# legendary-event-clear-estimates Specification

## Purpose

Defines how the planner estimates how many battles of a Legendary Event lane a team, or a single unit, clears: effective power from combat power and curated efficiency coefficients, the comparison with catalog battle power through a calibrated ratio, the margin shown with it, calibration, and behaviour when inputs are missing.

## ADDED Requirements

### Requirement: Clear depth is estimated from effective power and battle power

The planner SHALL compute, for a lane:

- a unit's **effective power** = its combat power (`@workspace/game-domain` `characterCombatPower` from the synced rank, progression, applied upgrade count and active/passive ability levels) × its coefficient from `lre-clear-estimate.unitCoefficients` (1.0 when not listed); 0 when the unit is not owned;
- a team's **effective power** E = the sum of its non-reserve members' effective power;
- the **estimated depth** = the largest n such that for every battle k from 1 to n, E ≥ `powerRatio` × (battle k's catalog `power`), and 0 when battle 1 already fails;
- the **margin above** = E ÷ (`powerRatio` × battle n's power) − 1 (none when n is 0) and the **shortfall to next** = 1 − E ÷ (`powerRatio` × battle n+1's power) (none when n is the lane's last battle), each shown as a whole percent;
- a unit's **estimated clears** = the estimated depth for an effective power of 5 × the unit's effective power.

All estimates are counts of battles on that lane, anchored to the unit's current synced progression, never to a goal target. Estimates SHALL be recalculated whenever the roster, the plan or the dataset changes, and SHALL NOT be written to the API.

Assumptions:

- Battles on a lane are played in order and get harder with their number; a team that cannot clear battle k does not clear later ones.
- Combat power (V1's formula) ranks characters' strength well enough to compare with catalog battle power through one ratio; equipment, synergy and objective difficulty are not modelled.
- MoWs are not team members.
- `disallowedFactions` of a battle never excludes a member already allowed on the lane (true for every current event).

#### Scenario: Worked example, team on Uthar Alpha

- **GIVEN** `powerRatio` 0.5, coefficient 1.2 for `ultraTigurius` and none for the others, and a team on `votanUthar` Alpha of `ultraCalgar`, `ultraTigurius`, `ultraTitus`, `ultraApothecary` and `ultraEliminatorSgt`, each owned at Gold1, Epic:RedOneStar, 3 upgrades applied, active 20, passive 15 (combat power 8,792 each)
- **WHEN** the estimate is computed
- **THEN** effective powers are 8,792 × 4 and 8,792 × 1.2 = 10,550.4, so E = 35,168 + 10,550.4 = 45,718.4
- **AND** the thresholds 0.5 × power for Alpha battles 1–7 (1,018; 3,055; 8,199; 20,703; 40,586; 75,787; 134,603) are 509; 1,527.5; 4,099.5; 10,351.5; 20,293; 37,893.5; 67,301.5
- **AND** E reaches battles 1–6 and not 7, so the estimated depth is 6, the margin above is 45,718.4 ÷ 37,893.5 − 1 = 21% and the shortfall to battle 7 is 1 − 45,718.4 ÷ 67,301.5 = 32%

#### Scenario: Partial team

- **GIVEN** the same lane and ratio and a team of only `ultraCalgar`, `ultraTitus` and `ultraApothecary` at 8,792 each
- **WHEN** the estimate is computed
- **THEN** E = 26,376, which reaches battle 5 (20,293) and not 6 (37,893.5), so the depth is 5

#### Scenario: Locked member adds nothing

- **GIVEN** the five-unit team above where `ultraTitus` is not owned
- **WHEN** the estimate is computed
- **THEN** E = 36,926.4, which reaches battle 5 and not 6, so the depth is 5 and the card notes one locked member not counted

#### Scenario: Unit estimate

- **GIVEN** `ultraTigurius` as above
- **WHEN** its estimated clears are computed on Uthar Alpha
- **THEN** 5 × 10,550.4 = 52,752 reaches battle 6 (37,893.5) and not 7 (67,301.5), so it shows 6

#### Scenario: Not enough for battle 1

- **GIVEN** a team whose E is below `powerRatio` × battle 1's power
- **WHEN** the estimate is computed
- **THEN** the depth is 0 with no margin above, and the shortfall to battle 1 is shown

### Requirement: The power ratio is calibrated from manual depths

The planner SHALL provide a calibration that takes samples (a lane's battle powers, a team's members with their synced progression, and the team's manual depth d ≥ 1) and returns the median, over samples, of the geometric mean of E ÷ (battle d+1's power) and E ÷ (battle d's power), using E with every coefficient at 1.0 and the upper bound alone when d is the lane's last battle; samples with a locked member SHALL be skipped. It SHALL also return the number of samples used and the interquartile range. Estimates SHALL be labelled "uncalibrated" while the dataset's `calibration.sampleCount` is 0.

#### Scenario: Calibration of two samples

- **GIVEN** sample A with E = 45,718.4 and manual depth 6 on Uthar Alpha (bounds 45,718.4 ÷ 134,603 = 0.3397 and 45,718.4 ÷ 75,787 = 0.6032, geometric mean 0.4527), and sample B with E = 26,376 and depth 5 (bounds 26,376 ÷ 75,787 = 0.3480 and 26,376 ÷ 40,586 = 0.6499, geometric mean 0.4756)
- **WHEN** the calibration runs
- **THEN** it returns a ratio of 0.4641 (the median of 0.4527 and 0.4756) and a sample count of 2

#### Scenario: Uncalibrated label

- **GIVEN** the dataset's `calibration.sampleCount` is 0
- **WHEN** an estimate is shown
- **THEN** its "estimated" tag carries "uncalibrated" in its tooltip

### Requirement: Estimates degrade by data state

When the `lre-clear-estimate` dataset is absent or failed to load, no estimate SHALL be shown anywhere and team depths SHALL behave exactly as manual-only depths. While the dataset or the lane's battle powers are loading, no estimate SHALL be shown and leaderboard rows SHALL show a placeholder dash. When the roster could not be read, no estimate SHALL be shown and the existing "roster not synced" note applies. A unit that is not owned SHALL show "—" for its estimated clears.

#### Scenario: Dataset absent

- **GIVEN** the catalog has no `lre-clear-estimate` dataset
- **WHEN** the event page renders
- **THEN** team cards show their manual depth or "Set depth", and leaderboard rows show no Clears figure

#### Scenario: Locked unit on the leaderboard

- **WHEN** a unit that is not owned is listed on a lane leaderboard
- **THEN** its Clears figure reads "—"
