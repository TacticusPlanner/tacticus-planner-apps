# Spec Delta

## MODIFIED Requirements

### Requirement: Reward projection from synced progress, the event ladder and future run inputs

The planner SHALL compute one reward projection per event with these figures, all anchored to the account's current synced state:

- **Base**: synced `currentPoints` P, `currentCurrency` C, chests claimed K (`currentClaimedChestIndex`, −1 read as 0) and `currentShards` S; all zero when the account has no synced entry for the event.
- **Future runs**: the runs that have not started, from the resolved run (`legendary-event-run-resolution`): runs after the run in progress while a run is active, runs from the next run onward between runs, all three runs when no synced entry exists, none when every run has ended, and none when the run is unknown. Only future runs' inputs count. With Show paid options off, premium missions, bundle and Oh So Close shards count as 0.
- **Future mission currency**: per future run, (regular + premium missions) × (25, plus 15 when that run has premium missions > 0). **Future bundle currency**: per future run with the bundle bought, 300, plus 15 when that run has premium missions > 0.
- **Goal**: the first cumulative ascension threshold above S + future Oh So Close shards, counted from the event unit's next step. The steps in order are `unlock` (reaching `Legendary:RedThreeStars`), `fourStars` (`Legendary:RedFourStars`), `fiveStars` (`Legendary:RedFiveStars`), `blueStar` (`Legendary:OneBlueStar`), `mythic` (`Mythic:OneBlueStar`) and `twoBlueStars` (`Mythic:TwoBlueStars`). The **next step** is the first step whose state is later than the unit's synced `progressionIndex`, and `unlock` when the unit is not in the roster; "every step reached" when none.
- **Chests to go** = max(0, ⌈(goal threshold − S − future Oh So Close shards) ÷ `shardsPerChest`⌉); **chests required** = K + chests to go. When required exceeds the event's chest count the goal is "not reachable this event", and no currency, points or battles-per-lane figures are produced (the ladder has no cost for chests beyond its last). When every step is reached, no chest, currency or points figures are produced.
- For a reachable goal, **currency required** = sum of `engramCost` of chests 1..required; **collected** = sum of costs of chests 1..K + C; **currency from points** = required − collected − future mission currency − future bundle currency.
- **Per-payout bonus** = synced `extraCurrencyPerPayout` when greater than 0; else 15 when the current run's stored premium missions > 0 and paid options are on; else 0.
- **Points target**: when currency from points ≤ 0, "enough currency now"; otherwise the first `pointsMilestones` entry above P at which the running total of (`engramPayout` + bonus) over the milestones above P reaches currency from points. When the ladder ends first, "points alone can't cover it" with the currency still missing. **Points to go** = target `cumulativePoints` − P.
- **Average battles per lane** = target `cumulativePoints` ÷ 3 ÷ 500, to one decimal.

Every figure is in the event's own units: shards for the goal, chests, currency, and points. The projection is anchored to current synced progress and the user's inputs, never to a goal target.

Assumptions:

- A regular or premium mission pays 25 currency, plus 15 when the run's premium track is bought (V1 `LeProgressService`).
- The bundle pays 300 currency, plus 15 when the run's premium track is bought.
- With the premium track active, each points milestone payout carries the synced `extraCurrencyPerPayout` (15 in V1).
- Chests are opened in ladder order, each awards `shardsPerChest` shards, and currency carries across the three runs.
- The event's shards add to the unit's own progression from its current step, so an unlocked unit's next step costs its `fourStars` shards (V1's `getNextAscensionMilestoneIndex`); shards the unit holds from other sources do not change the step costs.
- Synced currency, chests and shards already include everything paid out in runs that have started, so those runs' inputs are not added again.
- A battle is worth 500 points on average for the "battles per lane" figure (V1's constant); three lanes are played.

#### Scenario: Worked example on Uthar, no paid options

- **GIVEN** `votanUthar`'s ladder (chests 1–16 cost 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 350; milestones 13–22 at 5,500…10,000 points paying 85, 90, 95, 100, 110, 120, 140, 160, 180, 200; `shardsPerChest` 25; unlock 400), a synced entry in run 2 with P 5,000, C 120, K 10, S 250 and no `extraCurrencyPerPayout`, run inputs run 1 `10, 0, off, 0`, run 2 `6, 0, off, 0`, run 3 `10, 0, bundle on, 0`, the event unit not in the synced roster, and Show paid options on
- **WHEN** the projection is computed
- **THEN** the future run is run 3 only: mission currency 10 × 25 = 250, bundle 300
- **AND** the goal is unlock (400 > 250 shards), chests to go = ⌈(400 − 250) ÷ 25⌉ = 6, chests required = 10 + 6 = 16
- **AND** currency required = 3,350, collected = 1,500 + 120 = 1,620, currency from points = 3,350 − 1,620 − 250 − 300 = 1,180
- **AND** the running payouts from milestone 13 are 85, 175, 270, 370, 480, 600, 740, 900, 1,080, 1,280, so the target is milestone 22 at 10,000 points, points to go 5,000, and average battles per lane 10,000 ÷ 3 ÷ 500 = 6.7

#### Scenario: Same account with the premium track

- **GIVEN** the same state, but the synced `extraCurrencyPerPayout` is 15 and run 3 also has 10 premium missions
- **WHEN** the projection is computed
- **THEN** mission currency = (10 + 10) × 40 = 800, bundle = 315, currency from points = 3,350 − 1,620 − 800 − 315 = 615
- **AND** the running payouts with the 15 bonus are 100, 205, 315, 430, 555, 690, so the target is milestone 18 at 8,000 points, points to go 3,000, average battles per lane 5.3

#### Scenario: Runs already started are not added again

- **GIVEN** the Uthar example, but run 2 is changed to 10 regular missions with the bundle bought
- **WHEN** the projection is computed
- **THEN** every figure is unchanged, because run 2 is the current run and its payouts are already in the synced currency

#### Scenario: No synced entry

- **GIVEN** the account has no synced entry for `lostAbile` and the plan stores run 1 with 10 regular missions
- **WHEN** the projection is computed
- **THEN** the base is zero, all three runs are future runs, and run 1 contributes 250 currency

#### Scenario: Enough currency now

- **GIVEN** collected currency plus future missions and bundles already covers the chests for the goal
- **WHEN** the projection is computed
- **THEN** the points target is "enough currency now" with 0 points to go

#### Scenario: Fewer shards held than chests claimed

- **GIVEN** `votanUthar`'s ladder, the event unit not in the synced roster, a synced entry with K 20 and S 100, and no future close shards
- **WHEN** the projection is computed
- **THEN** the goal is unlock, chests to go = ⌈(400 − 100) ÷ 25⌉ = 12 and chests required = 20 + 12 = 32; chests to go is never negative

#### Scenario: Goal beyond the chest ladder

- **GIVEN** an event with 54 chests and shards such that the next goal needs 55 chests
- **WHEN** the projection is computed
- **THEN** the goal is reported as not reachable this event, naming 55 required of 54, and no currency, points or battles-per-lane figure is produced

#### Scenario: V1 parity without run inputs

- **GIVEN** V1's Dante ladder with the event unit not in the roster, a synced state of 1,444 points, 65 currency, 2 chests claimed and 50 shards, no run inputs and no premium
- **WHEN** the projection is computed
- **THEN** the points target is 13,000, as in V1's `le-progress.service.spec.ts`
- **AND** with 12,261 points, 160 currency, 15 chests claimed and 375 shards, the target is 12,500

#### Scenario: Worked example on Uthar, unit already unlocked

- **GIVEN** `votanUthar`'s ladder (chests 1–16 as above, then chests 17–21 costing 360, 370, 380, 390, 400; milestones 29–33 at 13,500, 14,000, 14,250, 14,500 and 14,750 points paying 320, 330, 340, 350 and 355; `shardsPerChest` 25; `fourStars` 120), the event unit owned at `Legendary:RedThreeStars`, a synced entry with P 13,139, C 60, K 17, S 25, no `extraCurrencyPerPayout`, Uthar's runs 1 and 2 ended, and no run 3 inputs
- **WHEN** the projection is computed
- **THEN** the next step is `fourStars` (the unit already reached `Legendary:RedThreeStars`), threshold 120 > 25 shards, chests to go = ⌈(120 − 25) ÷ 25⌉ = 4, chests required = 17 + 4 = 21
- **AND** currency required = 5,250 (chests 1–21), collected = 3,710 (chests 1–17) + 60 = 3,770, future missions and bundles 0, currency from points = 5,250 − 3,770 = 1,480
- **AND** the running payouts from milestone 29 are 320, 650, 990, 1,340 and 1,695, so the target is milestone 33 at 14,750 points, points to go 14,750 − 13,139 = 1,611 and average battles per lane 14,750 ÷ 3 ÷ 500 = 9.8, equal to V1's "Red 4★: 14,750 points, 5,250 currency, 120 shards"

#### Scenario: Between runs, ended runs' inputs are not counted

- **GIVEN** Uthar's runs 1 and 2 ended, run inputs of 10 regular missions for run 2 and 10 for run 3, and Show paid options off
- **WHEN** the projection is computed
- **THEN** the future run is run 3 only and mission currency is 10 × 25 = 250; run 2's missions are not added again

#### Scenario: Unknown run counts no future inputs

- **GIVEN** an event with an unknown run and run inputs stored for runs 1 to 3
- **WHEN** the projection is computed
- **THEN** no future run's inputs are counted and the figures come from the synced base alone
