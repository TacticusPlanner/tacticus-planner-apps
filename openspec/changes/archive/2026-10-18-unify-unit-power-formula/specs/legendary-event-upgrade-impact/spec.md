## MODIFIED Requirements

### Requirement: Upgrade impact per lane

For each lane, the planner SHALL evaluate every next step of every distinct non-reserve member of the lane's teams:

1. Re-estimate each team of the lane holding that unit with the unit at its stepped state (Stage 5 calculation).
2. Set that team's depth after the step to `min(battleCount, depthBefore + (estimateAfter − estimateBefore))`, reading a missing estimate as 0. The estimate delta also moves a stored depth.
3. Set the step's **gain** to the lane's reachable points after the step minus before.

Steps with a gain of 0 SHALL be dropped. The rest SHALL be ordered by gain descending, then by the number of battles newly reached descending, then by localized unit name. Each row SHALL carry the unit, the step, each affected team's depth before and after, and the gain in event points. Upgrade impact is anchored to the synced roster plus one step, never to Goals Preview, and SHALL be recomputed whenever the roster, the plan, the synced progress or the estimates change.

Power in every re-estimate is the `character-combat-power` estimate of the unit at its stepped state, with its synced equipped items (none for a unit being unlocked).

#### Scenario: Worked example, one step reaches the next battle

- **GIVEN** `powerRatio` 1.2, `ultraTigurius` in a horde-mode tier with multiplier 1.2, the reachable-points worked example, and team **Four** = `ultraCalgar`, `ultraTigurius`, `ultraTitus`, `ultraApothecary` (Incisus) with no stored depth. Calgar, Titus and Incisus are owned at Gold1, Epic:RedOneStar, slots 0 to 2 applied, active 20, passive 15, no items (power 21,675, 21,883 and 24,753). Tigurius is at Gold1, Epic:RedTwoStars, with the same slots and levels (power 18,557, effective 22,268.4)
- **WHEN** upgrade impact is computed for Alpha
- **THEN** Four's effective power is 21,675 + 21,883 + 24,753 + 22,268.4 = 90,579.4, which reaches battle 5 (threshold 48,703.2) and not battle 6 (90,944.4), so its depth is 5 and the lane has 620 reachable points
- **AND** no member has a Rank step (each is at Gold1, the Epic cap)
- **AND** Tigurius's Ascension to Epic:RedThreeStars (power 20,569, effective 24,682.8) makes Four's effective power 92,993.8, which reaches battle 6 and not battle 7 (161,523.6), so Four's depth becomes 6 and battle 6 adds 43 + 43 + 30 + 75 = 191: gain +191
- **AND** Calgar's Ascension to Epic:RedTwoStars (power 24,155) makes Four's effective power 93,059.4, depth 6, gain +191. Titus's (24,419, for 93,115.4) and Incisus's (27,662, for 93,488.4) give the same
- **AND** the list shows four rows of +191, each "Four: battle 5 → 6", ordered Calgar, Incisus, Tigurius, Titus

#### Scenario: A stored depth moves by the estimate delta

- **GIVEN** the worked example where Four has a stored depth of 4 for the current run
- **WHEN** upgrade impact is computed
- **THEN** reachable points before are 0 + 75 + 175 + 183 = 433; Tigurius's step raises Four's estimate from 5 to 6, so its depth becomes 4 + 1 = 5, battle 5 adds 187, and the row reads "+187, Four: battle 4 → 5"

#### Scenario: A battle another team already reaches adds nothing

- **GIVEN** the worked example plus team **Melee** (Calgar, Titus, Incisus; covering Ultramarines and Melee; stored depth 6)
- **WHEN** upgrade impact is computed
- **THEN** Tigurius's step lifts Four to battle 6, which Melee already reaches with Ultramarines covered, so its gain is 0; Calgar's step leaves Melee's estimate at 5 (24,155 + 21,883 + 24,753 = 70,791 is below 90,944.4), so Melee's depth stays 6 and the gain is 0
- **AND** no row is listed

#### Scenario: Unlocking a member that does not reach a new battle

- **GIVEN** team **Five** = Calgar, Tigurius (Epic:RedOneStar, power 16,672, effective 20,006.4), Titus, Incisus and Certus, where Certus is not owned, so its effective power is 88,317.4 and its depth 5
- **WHEN** upgrade impact is computed
- **THEN** unlocking Certus adds his base power 45, for 88,362.4, still below battle 6's 90,944.4, so no Unlock row is listed
