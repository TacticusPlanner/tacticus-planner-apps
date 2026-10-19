# Spec Delta

## Purpose

Tells the player where to raid today so that the current HRE mission's campaign-battle objective is finished with the least energy, while still feeding their goals where it costs nothing extra.

## ADDED Requirements

### Requirement: Raid suggestions appear only for a current campaign objective

The raid suggestions section SHALL be shown on a running HRE when the current mission has an objective of kind `campaignWins` ("Win N campaign battles"), `campaignRaids` ("Raid N campaign battles") or `lightningVictories` ("Win N lightning victories") whose progress is below its target. The battles still needed SHALL be the target minus the recorded progress. Otherwise, the section SHALL name the next mission that has a campaign objective and its target, or say that no campaign missions are left. It SHALL NOT list raids for a later mission.

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

### Requirement: Today's planned raids count first and reserve their energy and attempts

The raids still planned on Today SHALL count toward the battles to go before any HRE suggestion is made. They are Today's plan entries for the same Dailies project selection that have not been done yet. Their energy and attempts SHALL be reserved. The HRE energy budget SHALL be: Planning Settings daily energy, minus energy really spent today, minus the energy of Today's remaining planned raids, never below 0. The attempts left on a node SHALL be reduced by Today's planned raids on it.

Assumptions:

- Every raid on Today's plan is a campaign battle won, so it advances the objective by one.
- Energy per raid is the battle's `energyCost`. Indomitus I06 to I14 cost 3, I15 to I29 cost 5, other campaign nodes cost 6 and Elite nodes cost 10.

#### Scenario: Today's plan covers part of the mission

- **GIVEN** 63 battles to go, Planning Settings daily energy 538, 200 energy spent today, and Today still planning 25 raids at 6 energy (150 energy)
- **THEN** the section shows "25 battles from today's plan", 38 battles left for suggestions, and a budget of 538 - 200 - 150 = 188 energy

#### Scenario: Today's plan finishes the objective

- **GIVEN** 20 battles to go and Today still planning 24 raids
- **THEN** no extra raids are suggested and the section says "Today's plan completes this objective"

#### Scenario: Planned energy uses the whole budget

- **GIVEN** daily energy 538, 300 spent and 238 still planned on Today
- **THEN** the budget is 0, no extra raids are suggested, and the section says how many battles today's plan covers

#### Scenario: Daily energy limit reached

- **GIVEN** the real energy spent today has reached the daily energy limit, so Today drops its plan
- **THEN** Today's plan counts for nothing here: no battles are taken off the objective and no extra raids are suggested

### Requirement: Candidate locations follow raid eligibility and today's limits

A campaign battle SHALL be a candidate only if all of these hold:

1. The player's campaign progress unlocks it, which includes event-campaign nodes only while their event runs.
2. Its energy cost is above 0.
3. It has attempts left today after Today's planned raids on it.
4. It passes the persisted Raids Filters.

Attempts left SHALL be the synced attempts left for that node, or the catalog's daily cap for the node when that is not known.

Assumptions:

- The daily cap per node comes from the catalog (`dailyAttempts`): 3 for Indomitus I06 to I14, 10 for every other Standard and Mirror node (including I15), and 6 for Elite nodes. Severyn confirmed the Indomitus value.
- Synced attempts left take precedence over the catalog cap.

#### Scenario: Locked, used-up and zero-cost nodes excluded

- **GIVEN** I01 to I05 cost 0 energy, I14 has 0 attempts left, and the player has not unlocked Saim-Hann
- **THEN** none of I01 to I05, I14 or any Saim-Hann node is a candidate

#### Scenario: Today's plan uses a node's attempts

- **GIVEN** I30 has a cap of 10, 4 attempts used today, and 3 more raids planned on Today
- **THEN** I30 has 3 attempts left for suggestions

#### Scenario: Raids Filters respected

- **GIVEN** the Raids Filters hide Indomitus
- **THEN** no Indomitus node is listed, even though they are the cheapest

#### Scenario: Campaign-type filter keeps untyped nodes

- **GIVEN** a campaign-type Raids Filter of Standard and Early
- **THEN** I06 to I14, which have no campaign type and so match no option, stay candidates

### Requirement: Suggestions minimise energy, then serve goals, and fill to the limits

Candidates SHALL be ordered by energy cost ascending. Within the same cost, a node that drops a resource an in-scope goal still needs SHALL come first, ordered by that goal's best priority, and then by battle id. Each node, in order, SHALL get as many raids as its attempts left, the remaining budget and the battles left for suggestions allow. A node that does not fit SHALL be skipped. Rows with 0 raids SHALL NOT be shown. The totals of raids and energy SHALL be shown, and the energy total SHALL NOT exceed the budget.

#### Scenario: Worked example, mission 5

- **GIVEN** the "Today's plan covers part of the mission" case (38 battles left, 188 energy budget), with Indomitus unlocked, none of it used or planned today, and no goals
- **THEN** I06 to I14 (3 energy, cap 3) get 3 raids each (27 raids, 81 energy)
- **AND** I15 (5 energy, cap 10) gets 10 raids and I16 gets 1 (11 raids, 55 energy)
- **AND** the totals read 38 raids and 136 energy, so 25 + 38 = 63 battles today complete the objective

#### Scenario: Goal tie-break among equal costs

- **GIVEN** every 3-energy node used up today, 20 battles left, and a goal that needs `upgDmgC002`, dropped by I17 (5 energy)
- **THEN** I17 is listed before I15 and I16, which also cost 5 energy, and its row shows the goal material icon

#### Scenario: Budget runs out first

- **GIVEN** 38 battles left and 30 energy of budget
- **THEN** I06 to I14 get 10 raids in total: 3 each on I06, I07 and I08, and 1 on I09 (30 energy). The section notes "28 battles left after today's energy"

#### Scenario: No candidates

- **WHEN** there are no candidates
- **THEN** the section says "No raidable campaign battles"; if the Raids Filters removed every candidate, it also offers to open the filters

#### Scenario: Attempts run out before energy

- **GIVEN** budget left, but every affordable candidate has used its attempts today
- **THEN** the section says every battle that fits today's energy has used its attempts, not that energy ran out

### Requirement: Lightning-victory objectives suggest event-campaign raids

When the current mission has a `lightningVictories` objective below its target, the section SHALL suggest raids on event-campaign nodes only, because a raid there counts as a lightning victory. It SHALL use the same budget, Today's-plan reservation, attempts, filters, ordering (energy, then goals, then id) and fill as campaign objectives. The battles to go are the lightning victories still needed. When no campaign event is running, the section SHALL say so and suggest winning battles manually.

Assumptions:

- A raid on an event-campaign node counts as a lightning victory. A raid on a standing campaign node does not.
- Event-campaign nodes are raidable only while their campaign event runs (the existing eligibility rule).
- A planned raid on Today counts toward the objective only when it is on an event-campaign node.

#### Scenario: Mission 11 during a campaign event

- **GIVEN** mission 11 at 10 / 25 lightning victories, the campaign event of 2026-10-15 to 2026-10-29 running, no event nodes on Today's plan, and enough energy
- **THEN** 15 raids are suggested, all on that event campaign's nodes, cheapest first, and no standing-campaign node is listed

#### Scenario: No campaign event running

- **GIVEN** mission 1 at 0 / 2 lightning victories and no campaign event running
- **THEN** no raids are listed, and the section says "No campaign event is running: win 2 battles manually with a lightning victory"

### Requirement: Remaining campaign battles are summarised across missions

The tab SHALL show the total campaign battles still needed across the current mission and every later mission, including Bonus. It SHALL also show the minimum energy for them. That minimum is the battle count multiplied by the cheapest candidate energy cost. The cheapest cost ignores today's attempts, but still applies unlock state and Raids Filters. The unit is energy. The number of whole days SHALL be shown at the daily capacity of the cheapest nodes.

#### Scenario: Worked example from mission 5

- **GIVEN** mission 5 at 37 / 100 wins, and later campaign objectives 16 (Raid 25), 19 (Win 75), 20 (Win 250) and Bonus (Win 250)
- **THEN** battles still needed = 63 + 25 + 75 + 250 + 250 = 663
- **AND** with I06 to I14 unlocked, the minimum energy is 663 × 3 = 1,989 energy
- **AND** the capacity of the 3-energy nodes is 9 nodes × 3 attempts = 27 raids a day, so it reads "about 25 days of cheapest-node raids" (663 / 27 = 24.6, rounded up). That is longer than the event, which tells the player to use the 5-energy nodes too
