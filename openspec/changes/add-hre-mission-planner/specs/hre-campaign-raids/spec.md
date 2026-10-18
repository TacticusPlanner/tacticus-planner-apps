# Spec Delta

## Purpose

Tells the player where to raid today so that the current HRE mission's campaign-battle objective is finished with the least energy, while still feeding their goals where it costs nothing extra.

## ADDED Requirements

### Requirement: Raid suggestions appear only for a current campaign objective

The raid suggestions section SHALL be shown on a running HRE when the current mission has an objective of kind `campaignWins` ("Win N campaign battles") or `campaignRaids` ("Raid N campaign battles") whose progress is below its target. The battles still needed SHALL be the target minus the recorded progress. Otherwise, the section SHALL name the next mission that has a campaign objective and its target, or say that no campaign missions are left. It SHALL NOT list raids for a later mission.

Assumptions:
- A raid counts as a won campaign battle, so it advances both `campaignWins` and `campaignRaids` objectives by one.
- Mission progress counts only while that mission is the current one; battles done earlier do not carry forward.

#### Scenario: Mission 5 in progress

- **GIVEN** the current mission is 5 with 37 / 100 campaign wins
- **THEN** the section is titled "Raids for mission 5" and shows "63 battles to go"

#### Scenario: Current mission has no campaign objective

- **GIVEN** the current mission is 6 ("Heal or repair 2,500 health" and "Win 10 battles without summoning")
- **THEN** no raid list is shown, and the section reads "Next campaign mission: 16, Raid 25 campaign battles"

#### Scenario: Campaign objective already met

- **GIVEN** mission 5 at 100 / 100 campaign wins, with its other objective still open
- **THEN** no raid list is shown, and the section says the campaign objective is complete

#### Scenario: Preview event

- **GIVEN** the tab previews an upcoming HRE
- **THEN** no raid list is shown; only the remaining-campaign summary (see below) is shown, from mission 1

### Requirement: Candidate locations follow raid eligibility and today's limits

A campaign battle SHALL be a candidate only if all of these hold:
1. The player's campaign progress unlocks it, which includes event-campaign nodes only while their event runs.
2. Its energy cost is above 0.
3. It has attempts left today: the synced attempts left, or its daily cap when that is not known.
4. It passes the persisted Raids Filters.

The energy budget SHALL be the Planning Settings daily energy minus the energy really spent today, never below 0. These are the same inputs the HSE farm list uses.

Assumptions:
- Daily attempt caps are 10 per Standard node and 6 per Elite node (`dailyAttempts` in the catalog).
- Energy per raid is the battle's `energyCost`. Indomitus nodes I06 to I14 cost 3 and nodes I15 to I29 cost 5. Other campaign nodes cost 6, and Elite nodes cost 10.

#### Scenario: Locked, used-up and zero-cost nodes excluded

- **GIVEN** I01 to I05 cost 0 energy, I14 has 0 attempts left, and the player has not unlocked Saim-Hann
- **THEN** none of I01 to I05, I14 or any Saim-Hann node is a candidate

#### Scenario: Raids Filters respected

- **GIVEN** the Raids Filters hide Indomitus
- **THEN** no Indomitus node is listed, even though they are the cheapest

### Requirement: Suggestions minimise energy, then serve goals, and fill to the limits

Candidates SHALL be ordered by energy cost ascending. Within the same cost, a node that drops a resource an in-scope goal still needs SHALL come first, ordered by that goal's best priority, and then by battle id. Goals are scoped by the Dailies project selection, with need allocated as on the HSE farm list. Each node, in order, SHALL get as many raids as its attempts left, the remaining budget and the remaining battles allow. A node that does not fit SHALL be skipped. Rows with 0 raids SHALL NOT be shown. The totals of raids and energy SHALL be shown, and the energy total SHALL NOT exceed the budget.

#### Scenario: Worked example, mission 5 with 63 battles to go

- **GIVEN** 63 battles to go, a budget of 240 energy, I06 to I14 unlocked (3 energy, 10 attempts each, none used) and no goals
- **THEN** I06 to I11 get 10 raids each (60 raids, 6 × 30 = 180 energy), and I12 gets 3 raids (9 energy)
- **AND** the totals read 63 raids and 189 energy, and I13 and I14 are not shown

#### Scenario: Goal tie-break among equal costs

- **GIVEN** 9 3-energy nodes already used up today, 20 battles to go, and a goal that needs `upgDmgC002`, dropped by I17 (5 energy)
- **THEN** I17 is listed before I15 and I16 (also 5 energy), and its row shows the goal material icon

#### Scenario: Budget runs out first

- **GIVEN** 63 battles to go and 30 energy left today
- **THEN** I06 gets 10 raids (30 energy), the totals read 10 raids and 30 energy, and the section notes "53 battles left after today's energy"

#### Scenario: No energy or no candidates

- **WHEN** the budget is 0
- **THEN** the section says "No energy left today" and lists no raids
- **WHEN** there are no candidates
- **THEN** the section says "No raidable campaign battles"; if the Raids Filters removed every candidate, it also offers to open the filters

### Requirement: Remaining campaign battles are summarised across missions

The tab SHALL show the total campaign battles still needed across the current mission and every later mission, including Bonus. It SHALL also show the minimum energy for them. That minimum is the battle count multiplied by the cheapest candidate energy cost. The cheapest cost ignores today's attempts, but still applies unlock state and Raids Filters. The unit is energy. The number of whole days SHALL be shown at the daily capacity of the cheapest nodes.

#### Scenario: Worked example from mission 5

- **GIVEN** mission 5 at 37 / 100 wins, and later campaign objectives 16 (Raid 25), 19 (Win 75), 20 (Win 250) and Bonus (Win 250)
- **THEN** battles still needed = 63 + 25 + 75 + 250 + 250 = 663
- **AND** with I06 to I14 unlocked, the minimum energy is 663 × 3 = 1,989 energy
- **AND** the capacity is 9 nodes × 10 attempts = 90 raids a day, so it reads "about 8 days of cheapest-node raids" (663 / 90 = 7.4, rounded up)
