# Spec Delta

## Purpose

Estimates whether the player's roster clears each Quest Event battle, with and without the bonus objectives, and projects the quest's final points, crates and featured-hero shards from those estimates and the scores already entered.

## ADDED Requirements

### Requirement: Battle power is the game's figure, else computed from NPCs

A battle's **power** B SHALL be its served `power` when not null, as LE uses catalog power. Otherwise it SHALL be the sum, over its served enemies whose NPC is not a loot object, of `count` × `npcPower` of that NPC at its `ladderIndex` row (the row resolution of `legendary-event-battle-preview`). When `power` is null and an enemy's id is unknown or its index is past its ladder, B SHALL be unknown and the battle SHALL show "No estimate: enemy data incomplete".

Assumptions:

- Battle difficulty is the enemies' summed power; board, pickups and AI are not modelled.

#### Scenario: Recorded power wins

- **GIVEN** Nubari battle 4 with served `power` 1,183
- **THEN** B = 1,183, whatever its NPC sum

#### Scenario: Two enemy groups

- **GIVEN** a battle with `power` null with FlayedOne ×3 at a row of power 400 and Warrior ×4 at a row of power 350
- **THEN** B = 3 × 400 + 4 × 350 = 2,600

### Requirement: The estimate with objectives is always shown

For each battle with a known B, the planner SHALL take the team of `quest-event-teams` and its total capped power E, and compute, with `powerRatio` r:

- **clears** when E ≥ r × B;
- the **margin** = E ÷ (r × B) − 1, as a whole percent;
- **marginal** when it clears with a margin under 15%;
- the **points if cleared** = the battle's maximum minus the scores of its unreachable objectives.

The battle row SHALL show a verdict ("Clears", "Close", or "Doesn't clear") with accessible text, and the detail SHALL show E, r × B, the margin and the points.

Assumptions:

- A clear is assumed at 3 medals and 100 Lightning Victory points, with every reachable objective met, including `NoDamageTakenByAnyHero`.
- r is 1.0 until calibrated, and estimates are labelled "uncalibrated".

#### Scenario: Comfortable clear

- **GIVEN** r 1.0, B 50,000 and E 60,000 on a battle worth 500 with no unreachable objective
- **THEN** it clears with a 20% margin for 500 points, and no second estimate shows

#### Scenario: Marginal clear

- **GIVEN** B 50,000 and E 54,000
- **THEN** it clears with an 8% margin, is marked "Close", and the second estimate shows

### Requirement: The estimate without objectives shows only when needed

When the first estimate does not clear or is marginal, the planner SHALL build a second team with the same selector under the hard rules only (allowed factions, cap, featured hero), ignoring every objective filter, and show it only when its members differ from the first team. It SHALL show clear or not, its margin and its points: 300 + 100 + the scores of the objectives that team happens to meet (as badged in `quest-event-teams`) + the `NoDamageTakenByAnyHero` scores. It SHALL name each objective it gives up and the units that break it ("needs Ahriman, excluded by No Psyker units"). When the first estimate clears comfortably, the second SHALL NOT be computed or shown.

#### Scenario: Trade-off

- **GIVEN** a 500-point battle with `NotTrait` Psyker where the first team does not clear, and the second team with Ahriman clears
- **THEN** the detail shows "Without objectives: clears for 400 instead of 500 · needs Ahriman, excluded by No Psyker units"

#### Scenario: Same team

- **GIVEN** the hard-rules team is the same as the objective team
- **THEN** no second estimate shows

### Requirement: When neither clears, the shortfall and the cap gap are shown

When neither estimate clears, the detail SHALL show the shortfall of the better one, 1 − E ÷ (r × B), as a whole percent, and list that team's members below the tier cap with the capped power they would gain at the cap, largest gain first, up to 3.

#### Scenario: Shortfall

- **GIVEN** the better E is 40,000 and r × B is 50,000
- **THEN** the detail shows "20% short" and up to 3 members below the cap with their gains

### Requirement: The projection combines entered scores and estimates

For each battle, the **projected points** SHALL be the entered points when the battle has at least 1 medal entered; else the first estimate's points when it clears; else the second estimate's points when it clears; else 0. **Projected medals** SHALL be the entered medals, or 3 for a battle projected as cleared, or 0. The summary SHALL add "Projected: {total} / {max} · {crates} of 17 crates", and the rewards card SHALL add projected shards (projected medals × the bundle multiplier), both labelled "estimate" and "uncalibrated" while r is the default. Estimates and the projection SHALL be recalculated live and never written to storage or the API.

#### Scenario: Mixed

- **GIVEN** battles 1 to 10 entered for 4,600 points and 28 medals, battles 11 to 15 clearing with objectives for 2,500, battle 16 clearing only without objectives for 400, and battle 17 not clearing
- **THEN** the projection is 7,500 points with 28 + 18 = 46 medals, and 46 projected shards without the bundle

### Requirement: The power ratio can be calibrated from samples

The planner SHALL provide `calibrateQuestPowerRatio(samples)`, where a sample is `{ E, B, cleared }`. Nubari's recorded powers against their NPC sums SHALL also be checked by a unit test that reports the ratio, to judge the NPC fallback, returning the ratio r that the fewest samples contradict (a cleared sample contradicts r when E < r × B; a failed one when E ≥ r × B), choosing the median of the tied range, or null with fewer than 5 samples. The app SHALL ship r as a constant set from this function; there is no in-app calibration UI in this change.

#### Scenario: Too few samples

- **WHEN** it is called with 4 samples
- **THEN** it returns null

### Requirement: Estimates degrade by data state

While `npcs`, `unit-power` or the roster is loading, verdicts SHALL show a dash. When `unit-power` failed or is absent, or the roster is not synced, no estimate or projection SHALL be shown and the summary SHALL show entered points only. In a preview or for a browsed quest, estimates SHALL show without a projection, since nothing is entered.

#### Scenario: Unit power failed

- **GIVEN** the `unit-power` read failed
- **THEN** no verdict, estimate or projection shows, and the tracker works as before
