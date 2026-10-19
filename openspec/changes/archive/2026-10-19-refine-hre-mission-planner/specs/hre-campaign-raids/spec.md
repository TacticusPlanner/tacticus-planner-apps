## MODIFIED Requirements

### Requirement: Candidate locations follow raid eligibility and today's limits

A campaign battle SHALL be a candidate only if all of these hold:

1. The player's campaign progress unlocks it, which includes event-campaign nodes only while their event runs.
2. Its energy cost is above 0.
3. It has attempts left today after Today's planned raids on it.
4. It passes the persisted Raids Filters, except the campaign-type filter. Every campaign battle counts as a win, so a type picked for farming drops does not hide the cheapest nodes.

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

- **GIVEN** the Raids Filters hide Indomitus by enemy faction
- **THEN** no Indomitus node is listed, even though they are the cheapest

#### Scenario: Campaign-type filter keeps untyped nodes

- **GIVEN** a campaign-type Raids Filter of Standard and Early
- **THEN** I06 to I14, which have no campaign type and so match no option, stay candidates

#### Scenario: Campaign-type filter ignored

- **GIVEN** a campaign-type Raids Filter of Mirror only
- **THEN** the 5-energy Indomitus nodes I15 to I29 and the no-drop I06 to I14 stay candidates

### Requirement: Suggestions minimise energy, then serve goals, and fill to the limits

The suggestions SHALL use only candidates that drop something. Candidates SHALL be ordered by energy cost ascending. Within the same cost:

1. A node that drops a resource an in-scope goal still needs SHALL come first.
2. Among those, a higher drop rate for the goal's resource SHALL come first, because common and uncommon materials drop more often. A higher average guaranteed gold comes next, then the goal's best priority.
3. Other nodes SHALL be ordered by average guaranteed gold, descending.
4. Battle id breaks any remaining tie.

Each node, in order, SHALL get as many raids as its attempts left, the remaining budget and the battles left for suggestions allow. A node that does not fit SHALL be skipped. Rows with 0 raids SHALL NOT be shown. A row whose node feeds a goal SHALL show the goal resource's icon with the player's "owned/target" for it, as on the HSE tab. The totals of raids and energy SHALL be shown, and the energy total SHALL NOT exceed the budget.

#### Scenario: Worked example, mission 5

- **GIVEN** the "Today's plan covers part of the mission" case (38 battles left, 188 energy budget), with Indomitus unlocked, none of it used or planned today, and no goals
- **THEN** I15, I16 and I17 (5 energy, cap 10) get 10 raids each and I18 gets 7
- **AND** the totals read 37 raids and 185 energy, and the section notes "1 battle left after today's energy"

#### Scenario: Goal tie-break among equal costs

- **GIVEN** 20 battles left and a goal that needs `upgDmgC002`, dropped by I17 (5 energy)
- **THEN** I17 is listed before I15 and I16, which also cost 5 energy, and its row shows the goal material icon with "owned/target"

#### Scenario: Same drop, more gold

- **GIVEN** a goal needs Slicing Claws (`upgDmgU019`), dropped at the same rate by Fall of Cadia Mirror 4 (40 to 66 gold) and Indomitus Mirror 37 (48 to 82 gold), both 6 energy
- **THEN** Indomitus Mirror 37 is listed before Fall of Cadia Mirror 4

#### Scenario: Common drops before legendary

- **GIVEN** goals need a common material dropped by Fall of Cadia Mirror 9 and a legendary material dropped by Fall of Cadia Mirror 71, both 6 energy
- **THEN** Mirror 9 is listed first, because the common material drops more often

#### Scenario: Cheaper node first

- **GIVEN** Indomitus 28 (5 energy) and Fall of Cadia Mirror 9 (6 energy) both drop `upgArmC003`
- **THEN** Indomitus 28 is filled before Mirror 9

#### Scenario: Budget runs out first

- **GIVEN** 38 battles left and 30 energy of budget
- **THEN** I15 gets 6 raids (30 energy), and the section notes "32 battles left after today's energy"

#### Scenario: No candidates

- **WHEN** there are no candidates
- **THEN** the section says "No raidable campaign battles"; if the Raids Filters removed every candidate, it also offers to open the filters

#### Scenario: Attempts run out before energy

- **GIVEN** budget left, but every affordable candidate has used its attempts today
- **THEN** the section says every battle that fits today's energy has used its attempts, not that energy ran out

### Requirement: Remaining campaign battles are summarised across missions

The tab SHALL show the total campaign battles still needed across the current mission and every later mission, including Bonus. It SHALL set them against the days the event has left: the remaining time while it runs, or its whole length for a preview, rounded up and at least 1. It SHALL show the battles a day needed and the energy a day they cost at the cheapest candidate nodes, within each node's daily cap. When the Planning Settings daily energy cannot cover that many a day, it SHALL show the most battles a day the energy allows and how many battles will not fit before the event ends. The nodes ignore today's attempts and the lightning restriction, but still apply unlock state and the Raids Filters (except the campaign-type filter).

#### Scenario: Worked example from mission 5

- **GIVEN** mission 5 at 37 / 100 wins, later campaign objectives that bring the total to 663 battles, 14 days left, and 538 daily energy
- **THEN** it reads 663 battles over 14 days, about 48 a day, and 186 energy a day (27 raids at 3 energy, then 21 at 5)

#### Scenario: Not enough energy

- **GIVEN** 640 battles, 4 days left, and 150 daily energy
- **THEN** it reads that the daily energy covers at most 40 a day at the cheapest nodes, so about 480 will not fit before the event ends

## ADDED Requirements

### Requirement: The no-drop Indomitus nodes are a separate alternative

Candidates that drop nothing (Indomitus I06 to I14) SHALL be listed in their own section below the suggestions. They are filled the same way, with the same battles left and budget, and the section shows its raid and energy totals. It SHALL say each raid there replaces one above for less energy, with no drops and little gold.

#### Scenario: Mission 5 with the no-drop nodes unlocked

- **GIVEN** 38 battles left and 188 energy of budget
- **THEN** the section lists I06 to I14 with 3 raids each, 27 raids and 81 energy in total

#### Scenario: Lightning victories

- **GIVEN** a lightning-victory objective
- **THEN** the section is not shown, because these nodes are not event-campaign nodes
