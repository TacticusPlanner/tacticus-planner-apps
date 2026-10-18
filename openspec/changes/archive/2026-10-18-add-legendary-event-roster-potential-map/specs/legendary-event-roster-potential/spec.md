# Spec Delta

## ADDED Requirements

### Requirement: Roster potential per lane

For a lane, the planner SHALL compute, client side and never stored:

- the **defeat-all potential depth**: the Stage 5 estimated depth (`legendary-event-clear-estimates`) of a team made of the five owned units the lane allows with the highest effective power (fewer when fewer are owned), and 0 when fewer than three are owned;
- for each of the lane's objectives, its **objective potential depth**: the same over the owned allowed units that satisfy that objective, and 0 when fewer than three exist;
- the **potential points left**: the lane's reachable points (`legendary-event-upgrade-impact`) for one synthetic team per objective, each covering only that objective with its objective potential depth, plus one covering no objective with the defeat-all potential depth;
- the **falls-behind battle**: the first battle beyond the defeat-all potential depth (none when the lane's last battle is reached), and the objectives whose potential depth is 0.

Figures are counts of battles and event points, anchored to the synced roster and progress. When clear estimates are unavailable (power data missing or failed) the potential SHALL be unavailable for the lane.

Assumptions:

- A team needs at least three characters (`legendary-event-team-size`); MoWs are not members.
- Each objective is scored by whichever team clears it, so each row is estimated on its own; the potential is an upper bound, not one team that clears every objective.
- Unit eligibility and objective matching read static catalog data only.

#### Scenario: Worked example on Uthar Alpha

- **GIVEN** `votanUthar` Alpha (18 battles, `battlesPoints` 29, 31, 35, 39, 41, 43, 45, 47, 47, 49, 47, 53, 51, 59, 59, 57, 61, 59; `defeatAll` 30; objectives Ultramarines 75, Resilient 95, Max 2 Hits 50, Melee 65, Piercing 90; 8,994 points at most), synced Alpha progress with battle 1's defeat-all and Ultramarines cleared at kill and high score 29 and battle 2's defeat-all cleared at 31 (249 points earned), `powerRatio` 1.2
- **AND** the roster owns only `ultraCalgar`, `ultraTigurius`, `ultraTitus`, `ultraApothecary` and `ultraEliminatorSgt` as in the clear estimates' worked example (E = 102,229.4), all Ultramarines; the Apothecary, Calgar, Tigurius and the Eliminator satisfy Max 2 Hits (E = 80,346.4); Calgar, Titus and the Apothecary satisfy Melee (E = 68,311); none satisfies Resilient or Piercing
- **WHEN** the potential is computed
- **THEN** the defeat-all and Ultramarines potential depths are 6, Max 2 Hits' and Melee's are 5, and Resilient's and Piercing's are 0
- **AND** the potential points left are 1,386 (battles 1 to 6), of 8,745 points left on the lane
- **AND** the falls-behind battle is 7 and the uncovered objectives are Resilient and Piercing

#### Scenario: Too few units for an objective

- **GIVEN** a lane where only two owned allowed units satisfy Flying
- **WHEN** the potential is computed
- **THEN** Flying's potential depth is 0 and Flying is listed as uncovered

#### Scenario: Nothing owned

- **GIVEN** the roster owns no unit the lane allows
- **WHEN** the potential is computed
- **THEN** every depth is 0, the potential points left are 0 and the falls-behind battle is 1

#### Scenario: Estimates unavailable

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** the potential is computed
- **THEN** it is unavailable for every lane

### Requirement: Potential mini map

The Lane overview card SHALL show a **Roster potential** map: one column per battle in order and six rows (defeat-all, then the lane's objectives in catalog order), each row labelled by its objective icon. Each cell SHALL show one state, in this precedence:

1. **Cleared**: the synced progress shows the cell cleared;
2. **Teams reach**: a saved team of the lane whose covered objectives include the row (any team for defeat-all) has a depth greater than the battle index, by the reachable-points depth rule;
3. **Roster can reach**: the row's potential depth is greater than the battle index;
4. **Out of reach**.

States SHALL be distinguishable without colour (cleared filled, teams reach outlined, roster can reach hatched, out of reach empty) and a legend SHALL name them. Each column SHALL have an accessible label and tooltip naming the battle, its battle points and each row's state ("Battle 3 · 35 points · Ultramarines: teams reach · Resilient: out of reach"). Above the map one line SHALL read "Roster reaches battle D · P of L points left" (D the defeat-all potential depth; "Roster can't win battle 1" when 0), and a second line "Falls behind at battle F" with "· no unit for O1, O2" when objectives are uncovered, or "Roster can reach every battle" when there is no falls-behind battle.

While the roster or estimates load the map SHALL show a skeleton of its grid; when the potential is unavailable it SHALL show the grid with only Cleared cells and the line "Roster potential needs clear estimates".

#### Scenario: Map on the worked example

- **GIVEN** the worked example and one saved Alpha team Melee (Calgar, Titus, Apothecary, covering Ultramarines and Melee, depth 5)
- **WHEN** the Alpha Lane overview renders
- **THEN** the lines read "Roster reaches battle 6 · 1,386 of 8,745 points left" and "Falls behind at battle 7 · no unit for Resilient, Piercing"
- **AND** battle 1's defeat-all and Ultramarines cells are Cleared and its Melee cell is Teams reach; battles 2 to 5 have Ultramarines and Melee as Teams reach and Max 2 Hits as Roster can reach; battle 6 has defeat-all and Ultramarines as Roster can reach and Melee as Out of reach; every cell from battle 7 on, and every Resilient and Piercing cell, is Out of reach

#### Scenario: Desktop layout

- **WHEN** the event's lane tab renders at or above 768px
- **THEN** the map fills the lane card's width with all 18 columns visible, the legend sits under it in one line, and hovering a column shows its tooltip

#### Scenario: Mobile layout

- **WHEN** the lane tab renders below 768px
- **THEN** the map fits the card width with no horizontal scroll, battle numbers show every third column, and tapping a column shows its label in a popover

### Requirement: Overview lane summary shows roster reach

The Overview tab's lane summary SHALL add, per lane, "Roster reaches battle D" from the defeat-all potential depth, or nothing when the potential is unavailable.

#### Scenario: Overview line

- **WHEN** the worked example's Overview renders
- **THEN** Alpha's summary row includes "Roster reaches battle 6"
