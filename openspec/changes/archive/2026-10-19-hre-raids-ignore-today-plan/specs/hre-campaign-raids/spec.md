## ADDED Requirements

### Requirement: Suggestions use today's energy left and ignore Today's plan

The battles to go SHALL be the objective's target minus its progress; raids still planned on Today SHALL NOT count toward them, and their energy and attempts SHALL NOT be reserved. Severyn chose this so the section always says where to raid for the mission. The HRE energy budget SHALL be the Planning Settings daily energy minus the energy really spent today, never below 0.

Assumptions:

- Energy per raid is the battle's `energyCost`. Indomitus I06 to I14 cost 3, I15 to I29 cost 5, other campaign nodes cost 6 and Elite nodes cost 10.

#### Scenario: Energy spent today

- **GIVEN** 38 battles to go, Planning Settings daily energy 538 and 350 energy spent today
- **THEN** 38 battles are left for suggestions with a budget of 538 - 350 = 188 energy

#### Scenario: Today's plan does not hide suggestions

- **GIVEN** 20 battles to go and Today still planning 94 raids
- **THEN** raids for all 20 battles are still suggested, within today's energy left

#### Scenario: Today's energy spent

- **GIVEN** daily energy 538 and 538 spent today
- **THEN** the budget is 0, no raids are suggested, and the section says no energy is left today

## MODIFIED Requirements

### Requirement: Candidate locations follow raid eligibility and today's limits

A campaign battle SHALL be a candidate only if all of these hold:

1. The player's campaign progress unlocks it, which includes event-campaign nodes only while their event runs.
2. Its energy cost is above 0.
3. It has attempts left today.
4. It passes the persisted Raids Filters, except the campaign-type filter. Every campaign battle counts as a win, so a type picked for farming drops does not hide the cheapest nodes.

Attempts left SHALL be the synced attempts left for that node, or the catalog's daily cap for the node when that is not known.

Assumptions:

- The daily cap per node comes from the catalog (`dailyAttempts`): 3 for Indomitus I06 to I14, 10 for every other Standard and Mirror node (including I15), and 6 for Elite nodes. Severyn confirmed the Indomitus value.
- Synced attempts left take precedence over the catalog cap.

#### Scenario: Locked, used-up and zero-cost nodes excluded

- **GIVEN** I01 to I05 cost 0 energy, I14 has 0 attempts left, and the player has not unlocked Saim-Hann
- **THEN** none of I01 to I05, I14 or any Saim-Hann node is a candidate

#### Scenario: Today's plan uses a node's attempts

- **GIVEN** I30 has a cap of 10 and 4 attempts used today, and Today plans 3 more raids on it
- **THEN** I30 has 6 attempts left for suggestions

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

- **GIVEN** the "Energy spent today" case (38 battles to go, 188 energy budget), with Indomitus unlocked, none of it used today, and no goals
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

### Requirement: Lightning-victory objectives suggest event-campaign raids

When the current mission has a `lightningVictories` objective below its target, the section SHALL suggest raids on event-campaign nodes only, because a raid there counts as a lightning victory. It SHALL use the same budget, attempts, filters, ordering (energy, then goals, then id) and fill as campaign objectives. The battles to go are the lightning victories still needed. When no campaign event is running, the section SHALL say so and suggest winning battles manually.

Assumptions:

- A raid on an event-campaign node counts as a lightning victory. A raid on a standing campaign node does not.
- Event-campaign nodes are raidable only while their campaign event runs (the existing eligibility rule).

#### Scenario: Mission 11 during a campaign event

- **GIVEN** mission 11 at 10 / 25 lightning victories, the campaign event of 2026-10-15 to 2026-10-29 running, and enough energy
- **THEN** 15 raids are suggested, all on that event campaign's nodes, cheapest first, and no standing-campaign node is listed

#### Scenario: No campaign event running

- **GIVEN** mission 1 at 0 / 2 lightning victories and no campaign event running
- **THEN** no raids are listed, and the section says "No campaign event is running: win 2 battles manually with a lightning victory"

## REMOVED Requirements

### Requirement: Today's planned raids count first and reserve their energy and attempts

**Reason**: Severyn chose to always ignore Today's plan for HRE suggestions; counting it hid every suggestion whenever the plan covered the objective, including raids that no longer fit today's energy.

**Migration**: See "Suggestions use today's energy left and ignore Today's plan".
