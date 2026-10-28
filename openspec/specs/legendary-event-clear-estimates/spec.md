# legendary-event-clear-estimates Specification

## Purpose

Defines how the planner estimates how many battles of a Legendary Event lane a team, or a single unit, clears: effective power from combat power and curated horde-mode tier multipliers, the comparison with catalog battle power through a calibrated ratio, the margin shown with it, calibration, and behaviour when inputs are missing.

## Requirements

### Requirement: Clear depth is estimated from effective power and battle power

The planner SHALL compute, for a lane:

- a unit's **power** = its `character-combat-power` estimate (the game's power formula) from the synced rank, progression, applied slots at the current rank, active and passive ability levels and equipped items; 0 when the unit is not owned;
- a unit's **effective power** = its power × its multiplier from the `horde-mode-tiers` dataset (its own override, else its tier's; 1.0 when the character is untiered, its tier is not defined and it has no override, or the dataset is absent);
- a team's **effective power** E = the sum of its non-reserve members' effective power;
- the **estimated depth** = the largest n such that for every battle k from 1 to n, E ≥ `powerRatio` × (battle k's catalog `power`), and 0 when battle 1 already fails;
- the **margin above** = E ÷ (`powerRatio` × battle n's power) − 1 (none when n is 0) and the **shortfall to next** = 1 − E ÷ (`powerRatio` × battle n+1's power) (none when n is the lane's last battle), each shown as a whole percent;
- a unit's **estimated clears** = the estimated depth for an effective power of 5 × the unit's effective power.

Battle power SHALL be the battle's catalog `power` (the game's own figure), not a sum of NPC power. All estimates are counts of battles on that lane, anchored to the unit's current synced progression, never to a goal target. Estimates SHALL be recalculated whenever the roster, the plan or the datasets change, and SHALL NOT be written to the API. When the `unit-power` dataset is absent or failed to load, or a member has no power data, no estimate SHALL be shown for the teams and units it affects, and their depths SHALL behave as manual-only depths.

Assumptions:

- Battles on a lane are played in order and get harder with their number; a team that cannot clear battle k does not clear later ones.
- Unit power and battle power are both the game's power score, so the web app's power ratio is 1 until calibrated (still labelled uncalibrated). Synergy and objective difficulty are not modelled; equipment is, through unit power.
- MoWs are not team members.
- `disallowedFactions` of a battle never excludes a member already allowed on the lane (true for every current event).

#### Scenario: Worked example, team on Uthar Alpha

- **GIVEN** `powerRatio` 1.2, `ultraTigurius` in a horde-mode tier with multiplier 1.2 and the others untiered, and a team on `votanUthar` Alpha of `ultraCalgar`, `ultraTigurius`, `ultraTitus`, `ultraApothecary` and `ultraEliminatorSgt`, each owned at Gold1, Epic:RedOneStar, slots 0 to 2 applied, active 20, passive 15, no items. Their powers are 21,675, 16,672 (the `character-combat-power` worked example), 21,883, 24,753 and 13,912
- **WHEN** the estimate is computed
- **THEN** Tigurius's effective power is 16,672 × 1.2 = 20,006.4, so E = 21,675 + 20,006.4 + 21,883 + 24,753 + 13,912 = 102,229.4
- **AND** the thresholds 1.2 × power for Alpha battles 1 to 7 (1,018; 3,055; 8,199; 20,703; 40,586; 75,787; 134,603) are 1,221.6; 3,666; 9,838.8; 24,843.6; 48,703.2; 90,944.4; 161,523.6
- **AND** E reaches battles 1 to 6 and not 7, so the estimated depth is 6, the margin above is 102,229.4 ÷ 90,944.4 − 1 = 12% and the shortfall to battle 7 is 1 − 102,229.4 ÷ 161,523.6 = 37%

#### Scenario: Partial team

- **GIVEN** the same lane and ratio and a team of only `ultraCalgar`, `ultraTitus` and `ultraApothecary` as above
- **WHEN** the estimate is computed
- **THEN** E = 21,675 + 21,883 + 24,753 = 68,311, which reaches battle 5 (48,703.2) and not 6 (90,944.4), so the depth is 5

#### Scenario: Locked member adds nothing

- **GIVEN** the five-unit team above where `ultraTitus` is not owned
- **WHEN** the estimate is computed
- **THEN** E = 80,346.4, which reaches battle 5 and not 6, so the depth is 5 and the card notes one locked member not counted

#### Scenario: Unit estimate

- **GIVEN** `ultraTigurius` as above
- **WHEN** its estimated clears are computed on Uthar Alpha
- **THEN** 5 × 20,006.4 = 100,032 reaches battle 6 (90,944.4) and not 7 (161,523.6), so it shows 6

#### Scenario: Equipment raises the estimate

- **GIVEN** the Tigurius unit estimate above, now with `I_Crit_C001` at level 3 equipped (power 16,809)
- **WHEN** its estimated clears are computed
- **THEN** 5 × 16,809 × 1.2 = 100,854 still reaches battle 6 and not 7, so it shows 6, with a larger margin above battle 6 (11%, up from 10%)

#### Scenario: Not enough for battle 1

- **GIVEN** a team whose E is below `powerRatio` × battle 1's power
- **WHEN** the estimate is computed
- **THEN** the depth is 0 with no margin above, and the shortfall to battle 1 is shown

#### Scenario: Power data unavailable

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** the lane renders
- **THEN** no team or unit estimate is shown, leaderboard rows show no Clears figure, and team depths behave as manual-only depths

### Requirement: The power ratio is calibrated from manual depths

The planner SHALL provide a calibration that takes samples (a lane's battle powers, a team's members with their synced progression, and the team's manual depth d ≥ 1) and returns the median, over samples, of the geometric mean of E ÷ (battle d+1's power) and E ÷ (battle d's power), using E with every multiplier at 1.0 and the upper bound alone when d is the lane's last battle; samples with a locked member SHALL be skipped. It SHALL also return the number of samples used and the interquartile range. Estimates SHALL be labelled "uncalibrated" while the web app's power ratio is marked uncalibrated.

#### Scenario: Calibration of two samples

- **GIVEN** sample A with E = 45,718.4 and manual depth 6 on Uthar Alpha (bounds 45,718.4 ÷ 134,603 = 0.3397 and 45,718.4 ÷ 75,787 = 0.6032, geometric mean 0.4527), and sample B with E = 26,376 and depth 5 (bounds 26,376 ÷ 75,787 = 0.3480 and 26,376 ÷ 40,586 = 0.6499, geometric mean 0.4756)
- **WHEN** the calibration runs
- **THEN** it returns a ratio of 0.4641 (the median of 0.4527 and 0.4756) and a sample count of 2

#### Scenario: Uncalibrated label

- **GIVEN** the power ratio is marked uncalibrated
- **WHEN** an estimate is shown
- **THEN** its "estimated" tag carries "uncalibrated" in its tooltip

### Requirement: Estimates degrade by data state

When the `horde-mode-tiers` dataset is absent, estimates SHALL still be shown with every character untiered. When it failed to load, no estimate SHALL be shown anywhere and team depths SHALL behave exactly as manual-only depths. While the dataset or the lane's battle powers are loading, or when the roster could not be read, no estimate SHALL be shown. Each surface's rendering of these states (leaderboard: `legendary-event-eligibility`) is specified with that surface.

#### Scenario: Tier list failed to load

- **GIVEN** the `horde-mode-tiers` read fails
- **WHEN** the event page renders
- **THEN** team cards show their manual depth or "Set depth", and leaderboard rows show no Clears figure

#### Scenario: Tier list absent

- **GIVEN** the catalog has no `horde-mode-tiers` dataset
- **WHEN** the event page renders
- **THEN** estimates show, computed with every character untiered (multiplier 1.0)

### Requirement: An equipped relic sets the horde-mode multiplier

Wherever a unit's horde-mode multiplier is used (effective power, estimated clears, goals preview, team suggestions, upgrade impact), the multiplier SHALL be the highest `relics[].multiplier` of that character in `horde-mode-tiers` whose `equipmentId` is among the unit's synced `equippedItems`, and otherwise its base multiplier (its own override, else its tier's, else 1.0). This refines the multiplier in "Clear depth is estimated from effective power and battle power". A unit the roster does not hold uses its base multiplier, and its power is 0 regardless.

Assumptions:

- A relic counts at any relic level.
- Goals do not change equipment, so a goals preview uses the synced relic state.

#### Scenario: Worked example, relic equipped

- **GIVEN** `tauCrisis` with base multiplier 1.92 and relic `R_Crit_Dw02AdvancedBurstCannon` at 1.98, and a synced Re'vas with power 20,000 and that relic in `equippedItems`
- **WHEN** her effective power is computed
- **THEN** it is 20,000 × 1.98 = 39,600, and her estimated-clears effective power is 5 × 39,600 = 198,000

#### Scenario: Relic not equipped

- **GIVEN** the same Re'vas at power 20,000 without the relic equipped
- **WHEN** her effective power is computed
- **THEN** it is 20,000 × 1.92 = 38,400
