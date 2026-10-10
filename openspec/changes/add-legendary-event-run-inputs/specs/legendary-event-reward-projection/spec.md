# legendary-event-reward-projection Specification

## Purpose

Defines how the planner projects, from synced progress, the event's reward ladder and the user's run inputs, the next ascension step of a Legendary Event's unit and what it takes to reach it (chests, currency, points), and how that outlook is shown on the Run status card.

## ADDED Requirements

### Requirement: Reward projection from synced progress, the event ladder and future run inputs

The planner SHALL compute one reward projection per event with these figures, all anchored to the account's current synced state:

- **Base**: synced `currentPoints` P, `currentCurrency` C, chests claimed K (`currentClaimedChestIndex`, −1 read as 0) and `currentShards` S; all zero when the account has no synced entry for the event.
- **Future runs**: runs after the current run when a synced entry exists; all three runs when none exists. Only future runs' inputs count. With Show paid options off, premium missions, bundle and Oh So Close shards count as 0.
- **Future mission currency**: per future run, (regular + premium missions) × (25, plus 15 when that run has premium missions > 0). **Future bundle currency**: per future run with the bundle bought, 300, plus 15 when that run has premium missions > 0.
- **Goal**: the first cumulative ascension threshold (`unlock`, then + `fourStars`, + `fiveStars`, + `blueStar`, + `mythic`, + `twoBlueStars`) above S + future Oh So Close shards; "every step reached" when none.
- **Chests to go** = max(0, ⌈(goal threshold − S − future Oh So Close shards) ÷ `shardsPerChest`⌉); **chests required** = K + chests to go. When required exceeds the event's chest count the goal is "not reachable this event".
- **Currency required** = sum of `engramCost` of chests 1..required; **collected** = sum of costs of chests 1..K + C; **currency from points** = required − collected − future mission currency − future bundle currency.
- **Per-payout bonus** = synced `extraCurrencyPerPayout` when greater than 0; else 15 when the current run's stored premium missions > 0 and paid options are on; else 0.
- **Points target**: when currency from points ≤ 0, "enough currency now"; otherwise the first `pointsMilestones` entry above P at which the running total of (`engramPayout` + bonus) over the milestones above P reaches currency from points. When the ladder ends first, "points alone can't cover it" with the currency still missing. **Points to go** = target `cumulativePoints` − P.
- **Average battles per lane** = target `cumulativePoints` ÷ 3 ÷ 500, to one decimal.

Every figure is in the event's own units: shards for the goal, chests, currency, and points. The projection is anchored to current synced progress and the user's inputs, never to a goal target.

Assumptions:

- A regular or premium mission pays 25 currency, plus 15 when the run's premium track is bought (V1 `LeProgressService`).
- The bundle pays 300 currency, plus 15 when the run's premium track is bought.
- With the premium track active, each points milestone payout carries the synced `extraCurrencyPerPayout` (15 in V1).
- Chests are opened in ladder order, each awards `shardsPerChest` shards, and currency carries across the three runs.
- Synced currency, chests and shards already include everything paid out in runs that have started, so those runs' inputs are not added again.
- A battle is worth 500 points on average for the "battles per lane" figure (V1's constant); three lanes are played.

#### Scenario: Worked example on Uthar, no paid options

- **GIVEN** `votanUthar`'s ladder (chests 1–16 cost 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 350; milestones 13–22 at 5,500…10,000 points paying 85, 90, 95, 100, 110, 120, 140, 160, 180, 200; `shardsPerChest` 25; unlock 400), a synced entry in run 2 with P 5,000, C 120, K 10, S 250 and no `extraCurrencyPerPayout`, run inputs run 1 `10, 0, off, 0`, run 2 `6, 0, off, 0`, run 3 `10, 0, bundle on, 0`, and Show paid options on
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

- **GIVEN** `votanUthar`'s ladder, a synced entry with K 20 and S 100, and no future close shards
- **WHEN** the projection is computed
- **THEN** the goal is unlock, chests to go = ⌈(400 − 100) ÷ 25⌉ = 12 and chests required = 20 + 12 = 32; chests to go is never negative

#### Scenario: Goal beyond the chest ladder

- **GIVEN** an event with 54 chests and shards such that the next goal needs 55 chests
- **WHEN** the projection is computed
- **THEN** the goal is reported as not reachable this event, naming 55 required of 54

#### Scenario: V1 parity without run inputs

- **GIVEN** V1's Dante ladder, a synced state of 1,444 points, 65 currency, 2 chests claimed and 50 shards, no run inputs and no premium
- **WHEN** the projection is computed
- **THEN** the points target is 13,000, as in V1's `le-progress.service.spec.ts`
- **AND** with 12,261 points, 160 currency, 15 chests claimed and 375 shards, the target is 12,500

### Requirement: The Run status card shows the reward outlook

Below its synced figures the Run status card SHALL show a **Reward outlook**: "Next: <step> · S / threshold shards" (step names translated: Unlock, 4 stars, 5 stars, Blue star, Mythic, Two blue stars); "N more chests (X currency in total)"; "N points to reach M · about B battles per lane"; and a "How this is worked out" disclosure listing, one line each, the synced base, the future mission and bundle currency, the per-payout bonus, and the note that runs already started are counted through sync. It SHALL show "Every reward step reached" when every step is reached, "Not reachable this event (needs N chests, the event has M)" when beyond the chest ladder, "Enough currency for the chests now" when no points are needed, and "Points alone can't cover it: N currency short" when beyond the points ladder. Without a synced entry it SHALL show the outlook computed from zero with a "No synced progress yet" note. While the event's catalog record is loading the outlook SHALL show a skeleton; when the catalog read failed the outlook SHALL be hidden and the card's existing failure note shown.

#### Scenario: Outlook on the Uthar example

- **WHEN** the Run status card renders the worked Uthar example
- **THEN** it shows "Next: Unlock · 250 / 400 shards", "6 more chests (3,350 currency in total)" and "5,000 points to reach 10,000 · about 6.7 battles per lane"

#### Scenario: Explanation

- **WHEN** the user opens "How this is worked out" on the Uthar example
- **THEN** it lists 120 currency in hand and 10 chests claimed, 250 from run 3 missions, 300 from the run 3 bundle, no payout bonus, and the note about started runs
