# hre-event-pace Specification

## Purpose

Projects where the player's HRE ends up: event points, then event currency, then chest tier, then event shards, then the featured hero's rarity and stars. It also says what pace and leaderboard rank a chosen target needs.

## Requirements

### Requirement: The player records event points and leaderboard rank

On a running HRE, the tab SHALL let the player enter their current event points (a whole number of 0 or more) and their current leaderboard position (a whole number of 1 or more, optional). These are stored in local storage per occurrence id, with the same persistence and fallback rules as mission progress. Without a rank, payouts and crates SHALL use the lowest bracket (200,001+) and say so. The bracket line SHALL show the bracket's daily payout, so the player can match it against the game's "Daily payout". When a rank is stored, the card SHALL say when it was entered ("today", "yesterday" or "N days ago", by local calendar day). Changing the rank SHALL reset that time.

#### Scenario: Entering points and rank

- **WHEN** the player enters 14,500 points and rank 3,200 on day 7
- **THEN** both values survive a reload, and the rank resolves to the 2,501 to 5,000 bracket

#### Scenario: No rank entered

- **GIVEN** no rank
- **THEN** the projection uses the 200,001+ bracket and says "Enter your rank for a better estimate"

#### Scenario: Payout and rank age

- **GIVEN** rank 30,668 entered two days ago
- **THEN** the bracket line reads "Rank 25,001 to 35,000: 44 a day" and the rank is marked as entered 2 days ago

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

The projected end points SHALL be the points so far plus the average per elapsed day multiplied by the days left. Elapsed time is measured in days from the start, at least 1. Without the owned inputs (see "The projection starts from what the player holds"), the projection SHALL then compute:

- projected currency: milestone currency for the projected points, plus 100 × 20 for missions, plus 14 daily payouts at the rank bracket, plus both weekly crates' currency
- the highest chest tier whose cumulative cost fits that currency
- the projected shards: that tier's cumulative shards plus both weekly crates' shards
- the highest rarity step those shards reach

Each intermediate value SHALL be shown. Shards are the common unit. Because each chest's shards are counted at the low end of their range, the shard total SHALL read as a minimum ("at least 431").

#### Scenario: Worked example from the guide's target

- **GIVEN** 30,000 projected points, the 2,501 to 5,000 bracket, and all 20 missions
- **THEN** currency = 3,450 (milestones) + 2,000 (missions) + 14 × 59 = 826 (daily) + 240 + 480 (crates) = 6,996
- **AND** chest tier 21 fits (6,750 spent, 246 left), giving 438 chest shards + 14 + 28 crate shards = at least 480 shards
- **AND** 480 reaches Epic 1 red star (460), and is 30 short of Epic 2 red star (510), so no Oh So Close offer

#### Scenario: Pace from points so far

- **GIVEN** 14,500 points at day 7.0 of 14
- **THEN** the average is 2,071 a day (14,500 / 7, shown rounded) and the projected end is 14,500 + (14,500 / 7) × 7 = 29,000 (rounded to the nearest point)

#### Scenario: Within Oh So Close range

- **GIVEN** projected shards 20 short of the next step
- **THEN** the tab says the Oh So Close offer should cover the gap for blackstone

#### Scenario: Same milestone band, same result

- **GIVEN** Zapspitta's event, the 25,001 to 35,000 bracket, and no owned inputs
- **WHEN** the points move from 7,464 (projected 28,502) to 15,657 (projected 29,845)
- **THEN** both show 3,240 + 2,000 + 616 + 510 = 6,366 currency, tier 20 and at least 431 shards, because both projections fall between the 28,000 and 30,000 milestones
- **AND** the next-milestone line (see "The card names the next milestone and the next chest") explains what changes the result

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

### Requirement: The player can enter what they hold now

The pace card SHALL offer three optional inputs, read off the game's event screen and stored with the points and rank:

- currency owned ("You own"), 0 or more
- the next chest tier on the chest button, 1 to 28
- the featured hero's current step ("Not unlocked", or a step from the hero's unlock to Legendary blue star) and the shards toward the next step, from 0 to that gap minus 1. At Legendary blue star there is no next step, so that input is hidden and counts as 0.

#### Scenario: Reading the day 8 screen

- **GIVEN** Zapspitta (Rare start) and the game showing "You own 372", "Tier 17" and "17/50 Promote character"
- **WHEN** the player enters 372, tier 17, and "Rare, 4 stars" with 17
- **THEN** all three survive a reload

#### Scenario: Partly filled

- **GIVEN** currency owned is entered but the next chest tier is empty
- **THEN** the card keeps the points-only chain and asks for the rest of the inputs

### Requirement: The card shows the shards held now

Shards held SHALL be the current step's cumulative shards plus the shards toward the next step, with "Not unlocked" counting from 0. Once all three owned inputs are set, the card SHALL show the current step and the shards toward the next ("Rare, 4 stars · 17 / 50 to Rare, 5 stars") next to the projected step. Until then it SHALL say that filling them in gives a better estimate.

#### Scenario: Day 8 shards

- **GIVEN** "Rare, 4 stars" with 17 toward the next step
- **THEN** shards held are 280 + 17 = 297, and the card shows "Rare, 4 stars · 17 / 50 to Rare, 5 stars"

#### Scenario: Not unlocked yet

- **GIVEN** the game showing "214/280 Unlock character at Rare rarity"
- **WHEN** the player picks "Not unlocked" and enters 214
- **THEN** shards held are 214

### Requirement: Income still to come is counted from the current day and mission

At elapsed days `e` and tracker mission `m`, income still to come SHALL be:

- milestones: projected points' cumulative minus the current one
- missions: (20 − min(m − 1, 20)) × 100
- payouts: (14 − floor(e)) × the bracket's payout
- crates: week 1 while e < 7, and week 2

Assumptions:

- Payouts arrive on days 2 to 15.
- The week 1 crate pays at day 7; its shards then sit in the shard bar.

#### Scenario: Day 8 income

- **GIVEN** 15,657 points at 7.0 days elapsed (projected 31,314), the 25,001 to 35,000 bracket and mission 20 current
- **THEN** income still to come is 3,450 − 1,910 = 1,540 + 100 + 7 × 44 = 308 + 340 = 2,288 currency and 18 crate shards

### Requirement: The projection starts from what the player holds

With all owned inputs set, the projection SHALL add the income still to come to the currency owned, then open chests from the entered tier upward while the currency covers the next cost. Projected shards SHALL be the shards held, plus those chests' minimum shards, plus the crate shards still to come. Each part SHALL be shown, and shards stay the common unit.

Assumptions:

- The rank bracket holds for the rest of the event.
- Each chest gives at least the low end of its range.

#### Scenario: Day 8 of Zapspitta's event

- **GIVEN** 15,657 points at 7.0 days elapsed, rank 26,602 (25,001 to 35,000: 44 a day, week 2 crate 340 currency and 18 shards), mission 20 current, 372 currency owned, next chest tier 17, and 297 shards held
- **THEN** projected points are 15,657 + (15,657 / 7) × 7 = 31,314
- **AND** income still to come is 3,450 − 1,910 = 1,540 (milestones) + 1 × 100 (missions) + (14 − 7) × 44 = 308 (daily) + 340 (week 2 crate) = 2,288
- **AND** 372 + 2,288 = 2,660 opens tiers 17 to 20 (450 + 500 + 550 + 600 = 2,100), leaving 560, short of tier 21 (650)
- **AND** shards are at least 297 + 28 + 30 + 32 + 33 + 18 = 438, which reaches Rare, 1 red star (390) and is 22 short of Epic, 1 red star (460), so the Oh So Close offer is shown
- **AND** the points-only chain would have shown at least 431 shards for the same points

### Requirement: The target needs start from what the player holds

With all owned inputs set, the target SHALL need the chest shards left after the shards held and the crate shards still to come. The chest tier needed SHALL be the first tier, opening from the entered one, that covers them. Its cost, less the currency owned and the income still to come apart from milestones, SHALL be the milestone currency needed. Points needed SHALL be the lowest milestone that adds it to the points now, and points per day SHALL be rounded up over the days left.

#### Scenario: Target from what the player holds

- **GIVEN** the day 8 state above and target Epic, 1 red star (460)
- **THEN** chest shards needed are 460 − 297 − 18 = 145, and tiers 17 to 21 give 28 + 30 + 32 + 33 + 34 = 157, so tier 21 is needed
- **AND** those chests cost 450 + 500 + 550 + 600 + 650 = 2,750, so milestone currency needed is 2,750 − 372 − 100 − 308 − 340 = 1,630
- **AND** 1,910 + 1,630 = 3,540 needs the 33,000 milestone (cumulative 3,665), which is (33,000 − 15,657) / 7 = 2,478 points a day, rounded up

### Requirement: Owned-state target needs never go below zero

With the owned inputs set, chest shards and milestone currency needed SHALL never be below 0. When no chest shards are needed, the target SHALL read as reached. With no days left and the target not reached, it SHALL read as out of reach.

#### Scenario: Target already covered

- **GIVEN** 450 shards held, 18 crate shards still to come and target Epic, 1 red star (460)
- **THEN** no chest shards are needed, and the target reads as reached

#### Scenario: Event over

- **GIVEN** no days left and a target that needs tier 21 while tier 20 is the last opened
- **THEN** the target reads as out of reach, with no points per day

### Requirement: The card names the next milestone and the next chest

With points entered, the card SHALL name the next milestone above the points now and its reward ("Next milestone: 16,000 points, +175"). Past the last milestone it SHALL say every milestone is reached. With the owned inputs set, it SHALL also name the next chest's tier and cost and the currency still missing for it ("Next chest: tier 17, 450 · 78 more to open"), or say it can be opened now.

#### Scenario: Day 8

- **GIVEN** 15,657 points, 372 owned and next chest tier 17
- **THEN** the card reads "Next milestone: 16,000 points, +175" and "Next chest: tier 17, 450 · 78 more to open"

#### Scenario: Day 4

- **GIVEN** 7,464 points, 26 owned and next chest tier 14
- **THEN** the card reads "Next milestone: 8,000 points, +140" and "Next chest: tier 14, 360 · 334 more to open"

### Requirement: Mobile shows a pace summary under the current mission

On mobile, once points are entered on a running event, a one-line summary SHALL sit right under the current mission card. It shows the points now, the projected points, and the projected step, with a button that scrolls to the full pace card. With no points entered, it SHALL ask for them and scroll to the card. On desktop the summary SHALL NOT be shown, because the pace card sits in the right column next to the tracker. The mobile tour's pace step SHALL point at the summary.

#### Scenario: On mobile

- **GIVEN** the day 8 state above on a phone
- **THEN** under the current mission it reads "15,657 points → 31,314 · Rare, 1 red star" with a "Details" button that scrolls to the Event pace card

#### Scenario: On desktop

- **GIVEN** the same state on desktop
- **THEN** no summary is shown, and the pace card stays in the right column
