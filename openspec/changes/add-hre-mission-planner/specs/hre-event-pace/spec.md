# Spec Delta

## Purpose

Projects where the player's HRE ends up: event points, then event currency, then chest tier, then event shards, then the featured hero's rarity and stars. It also says what pace and leaderboard rank a chosen target needs.

## ADDED Requirements

### Requirement: The player records event points and leaderboard rank

On a running HRE, the tab SHALL let the player enter their current event points (a whole number of 0 or more) and their current leaderboard position (a whole number of 1 or more, optional). These are stored in local storage per occurrence id, with the same persistence and fallback rules as mission progress. Without a rank, payouts and crates SHALL use the lowest bracket (200,001+) and say so.

#### Scenario: Entering points and rank

- **WHEN** the player enters 14,500 points and rank 3,200 on day 7
- **THEN** both values survive a reload, and the rank resolves to the 2,501 to 5,000 bracket

#### Scenario: No rank entered

- **GIVEN** no rank
- **THEN** the projection uses the 200,001+ bracket and says "Enter your rank for a better estimate"

### Requirement: The game's HRE reward tables ship with the app

The projection SHALL use these tables as fixed app data. They come from the HRE wiki page:
- milestone currency per event-point threshold (100 points → 55, up to 1,000,000 points → 265; cumulative 6,090)
- daily currency payout per rank bracket ("new position" column)
- week 1 and week 2 crate currency and shards per bracket
- chest cost and minimum shards per tier (28 tiers)
- cumulative shards per rarity step (Common unlock 25, up to Legendary blue star 1,370)
- the Oh So Close threshold of 25 shards

The minimum of each "X to X+1" shard range SHALL be used.

Assumptions:
- Daily payouts arrive on days 2 to 15, which is 14 payouts. Week 1 and week 2 crates arrive once each.
- Each completed mission gives 100 currency. The Bonus mission gives none.
- The rank bracket stays constant for the rest of the event.

#### Scenario: Chest ladder

- **THEN** chest tier 21 costs 6,750 cumulative currency and yields at least 438 cumulative shards

### Requirement: The projection runs from points to shards in one common chain

The projected end points SHALL be the points so far plus the average per elapsed day multiplied by the days left. Elapsed time is measured in days from the start, at least 1. The projection SHALL then compute:
- projected currency: milestone currency for the projected points, plus 100 × 20 for missions, plus 14 daily payouts at the rank bracket, plus both weekly crates' currency
- the highest chest tier whose cumulative cost fits that currency
- the projected shards: that tier's cumulative shards plus both weekly crates' shards
- the highest rarity step those shards reach

Each intermediate value SHALL be shown. Shards are the common unit.

#### Scenario: Worked example from the guide's target

- **GIVEN** 30,000 projected points, the 2,501 to 5,000 bracket, and all 20 missions
- **THEN** currency = 3,450 (milestones) + 2,000 (missions) + 14 × 59 = 826 (daily) + 240 + 480 (crates) = 6,996
- **AND** chest tier 21 fits (6,750 spent, 246 left), giving 438 chest shards + 14 + 28 crate shards = 480 shards
- **AND** 480 reaches Epic 1 red star (460), and is 30 short of Epic 2 red star (510), so no Oh So Close offer

#### Scenario: Pace from points so far

- **GIVEN** 14,500 points at day 7.0 of 14
- **THEN** the average is 2,071 a day and the projected end is 14,500 + 2,071 × 7 = 29,000 (rounded to the nearest point)

#### Scenario: Within Oh So Close range

- **GIVEN** projected shards 20 short of the next step
- **THEN** the tab says the Oh So Close offer should cover the gap for blackstone

### Requirement: The player picks a target and sees what it needs

The player SHALL be able to pick a target step: unlock, a star, or an ascension, up to Legendary blue star. The default is the first step the projection does not reach. For the target at the current bracket, the tab SHALL show:
- the shards needed
- the chest tier needed: the lowest tier whose shards plus the crate shards reach the target
- the currency for that tier
- the event points needed: the lowest milestone whose cumulative currency covers the tier cost minus missions, payouts and crates
- the points per day still needed over the days left

#### Scenario: Worked example for Epic 1 red star

- **GIVEN** target Epic 1 red star (460), the 2,501 to 5,000 bracket, and 0 points on day 1
- **THEN** 460 - 42 crate shards = 418 chest shards, so tier 21 is needed (tier 20 gives 404)
- **AND** 6,750 - 2,000 - 826 - 720 = 3,204 currency is needed from milestones, so 28,000 points are needed (cumulative 3,240), which is 2,000 points a day over 14 days

#### Scenario: Target already reached

- **GIVEN** the projection reaches the target
- **THEN** the tab says the target is on track and how many points of margin remain
