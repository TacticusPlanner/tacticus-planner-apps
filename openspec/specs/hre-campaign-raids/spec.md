# hre-campaign-raids Specification

## Purpose

Tells the player where to raid today so that the current HRE mission's campaign-battle objective is finished with the least energy, while still feeding their goals where it costs nothing extra.

## Requirements

### Requirement: Raid suggestions appear only for a current campaign objective

The section SHALL be titled "Campaign for mission N" on a running HRE when the current mission has an open objective that raids serve, or one that only battles fought by hand serve (see "Manual objectives get a list of battles to fight by hand"). Raids SHALL serve only `campaignWins` ("Win N campaign battles"), `campaignRaids` ("Raid N campaign battles") and `lightningVictories` ("Win N lightning victories") objectives below their target; the battles still needed SHALL be the target minus the recorded progress. Raids SHALL NOT be suggested for any other objective, because a raid counts no kills, damage, healing, ability uses or lineup wins (Severyn, 2026-10). When the current mission has neither, the section SHALL say its campaign objective is complete when it has one, or else name the next mission that has a campaign objective and its target, or say that no campaign missions are left. It SHALL NOT list raids for a later mission.

Assumptions:

- A raid counts as a won campaign battle, so it advances both `campaignWins` and `campaignRaids` objectives by one.
- Mission progress counts only while that mission is the current one; battles done earlier do not carry forward.

#### Scenario: Mission 5 in progress

- **GIVEN** the current mission is 5 with 37 / 100 campaign wins
- **THEN** the section is titled "Campaign for mission 5" and its raids show "63 battles to go"

#### Scenario: Current mission has no campaign objective

- **GIVEN** the current mission is 8 with 20,000 / 20,000 damage and its Guild Raid tokens still open
- **THEN** no list is shown, and the section reads "Next campaign mission: 16, Raid 25 campaign battles"

#### Scenario: Campaign objective already met

- **GIVEN** mission 5 at 100 / 100 campaign wins, with its ability damage still open
- **THEN** no raid list is shown, only the battles to fight by hand for the ability damage

#### Scenario: Every objective that needs the campaign is met

- **GIVEN** mission 19 at 75 / 75 campaign wins and 100 / 100 melee kills
- **THEN** no list is shown, and the section says the campaign objective is complete

#### Scenario: Preview event

- **GIVEN** the tab previews an upcoming HRE
- **THEN** no raid list is shown; only the remaining-campaign summary (see below) is shown, from mission 1

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

### Requirement: Suggestions serve goals first, then minimise energy, and fill to the limits

The suggestions SHALL use only candidates that drop something. Candidates SHALL be ordered as follows:

1. A node that drops a resource an in-scope goal still needs SHALL come first, whatever its energy cost (Severyn, 2026-10).
2. Then energy cost ascending, then the event-point tie-breaks (see "Event points break ties among equal costs").
3. Among goal nodes, a higher drop rate for the goal's resource SHALL come next, because common and uncommon materials drop more often. A higher average guaranteed gold comes next, then the goal's best priority.
4. Other nodes SHALL be ordered by average guaranteed gold, descending.
5. Battle id breaks any remaining tie.

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

#### Scenario: Cheaper node first among goal nodes

- **GIVEN** Indomitus 28 (5 energy) and Fall of Cadia Mirror 9 (6 energy) both drop `upgArmC003`, which a goal needs
- **THEN** Indomitus 28 is filled before Mirror 9

#### Scenario: Goal node before a cheaper node

- **GIVEN** a goal needs `upgArmC003`, dropped by Fall of Cadia Mirror 9 (6 energy), and Indomitus 20 (3 energy) drops nothing a goal needs
- **THEN** Mirror 9 is filled first

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

When the current mission has a `lightningVictories` objective below its target, the section SHALL suggest raids on event-campaign nodes only, because a raid there counts as a lightning victory. It SHALL use the same budget, attempts, filters, ordering (energy, then the tie-breaks of "Event points break ties among equal costs", then goals, then id) and fill as campaign objectives. The battles to go are the lightning victories still needed. When no campaign event is running, the section SHALL say so and suggest winning battles manually.

Assumptions:

- A raid on an event-campaign node counts as a lightning victory. A raid on a standing campaign node does not.
- Event-campaign nodes are raidable only while their campaign event runs (the existing eligibility rule).

#### Scenario: Mission 11 during a campaign event

- **GIVEN** mission 11 at 10 / 25 lightning victories, the campaign event of 2026-10-15 to 2026-10-29 running, and enough energy
- **THEN** 15 raids are suggested, all on that event campaign's nodes, cheapest first, and no standing-campaign node is listed

#### Scenario: No campaign event running

- **GIVEN** mission 1 at 0 / 2 lightning victories and no campaign event running
- **THEN** no raids are listed, and the section says "No campaign event is running: win 2 battles manually with a lightning victory"

### Requirement: Remaining campaign battles are summarised across missions

The tab SHALL show the total campaign battles still needed across the current mission and every later mission, including Bonus. It SHALL set them against the days the event has left: the remaining time while it runs, or its whole length for a preview, rounded up and at least 1. It SHALL show the battles a day needed and the energy a day they cost at the cheapest candidate nodes, within each node's daily cap. When the Planning Settings daily energy cannot cover that many a day, it SHALL show the most battles a day the energy allows and how many battles will not fit before the event ends. The nodes ignore today's attempts and the lightning restriction, but still apply unlock state and the Raids Filters (except the campaign-type filter).

#### Scenario: Worked example from mission 5

- **GIVEN** mission 5 at 37 / 100 wins, later campaign objectives that bring the total to 663 battles, 14 days left, and 538 daily energy
- **THEN** it reads 663 battles over 14 days, about 48 a day, and 186 energy a day (27 raids at 3 energy, then 21 at 5)

#### Scenario: Not enough energy

- **GIVEN** 640 battles, 4 days left, and 150 daily energy
- **THEN** it reads that the daily energy covers at most 40 a day at the cheapest nodes, so about 480 will not fit before the event ends

### Requirement: The no-drop Indomitus nodes are a separate alternative

Candidates that drop nothing (Indomitus I06 to I14) SHALL be listed in their own section below the suggestions. They are filled the same way, with the same battles left and budget, and the section shows its raid and energy totals. It SHALL say each raid there replaces one above for less energy, with no drops and little gold.

#### Scenario: Mission 5 with the no-drop nodes unlocked

- **GIVEN** 38 battles left and 188 energy of budget
- **THEN** the section lists I06 to I14 with 3 raids each, 27 raids and 81 energy in total

#### Scenario: Lightning victories

- **GIVEN** a lightning-victory objective
- **THEN** the section is not shown, because these nodes are not event-campaign nodes

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

### Requirement: Manual objectives get a list of battles to fight by hand

Every open objective that only progresses in battles played by hand (kills, damage, ability damage, a damage type, the featured hero's damage, healing, ability uses, summon-free wins and all-alliance wins) SHALL be served by one list titled "Fight by hand", shown above the raids, for all of the current mission's open manual objectives together. Its nodes SHALL be kept to what the objectives need:

- **Ability uses (any units or alliance):** only nodes with 5 deployment slots, so every unit's abilities count.
- **Alliance kills, alliance ability uses, all-alliance wins, the featured hero's ability uses or damage:** only nodes where the featured hero's alliance can deploy.
- **The featured hero's ability uses or damage:** also only nodes where the featured hero's faction can deploy, so the hero can play every listed node.
- **Faction kills:** only nodes with that faction's enemies (see "Faction kills get their own list of battles").

These limits replace the Raids Filters' slot, allies-alliance and (for the featured hero's objectives) allies-faction choices for this list; the other Raids Filters still apply. The list SHALL estimate what one battle counts toward each objective: the node's enemy total for kills, its enemies of the faction for faction kills, its enemies' total health for damage, 5 uses for ability uses, and 1 for the featured hero's ability uses and for wins. Nodes that count nothing toward an estimated objective SHALL be left out. While the mission's lightning victories are open, nodes with a lightning-victory condition SHALL come first (see "Faction kills get their own list of battles"); then nodes that drop a resource an in-scope goal still needs; then nodes SHALL be ordered by what they count per energy for the first estimated objective, so the fewest battles are needed, then as raids are (including the event-point tie-breaks), and filled until every estimated objective is covered, within the attempts left and today's energy left; the raids get the energy and attempts the list leaves. When no objective can be estimated (ability damage, a damage type, the featured hero's damage, healing), the list SHALL show the 3 best nodes by enemy health per energy with their energy per battle, and say to play them until the objective is done. The list's note SHALL say that raids don't count these objectives, name the limits that apply, say whether the counts are estimates, and say that Arena and Onslaught battles count too. When more battles are needed than today's energy allows, the list SHALL say so.

While the mission's `campaignWins` objective is also open, each battle won by hand SHALL also count as a campaign win, so the raids to go SHALL drop by the battles in the list, and the note SHALL say so; when they cover every win still needed, the raids SHALL say the battles above cover them.

Severyn chose this (2026-10) over suggesting raids for these objectives, because raids count no kills or ability uses.

#### Scenario: Mission 2

- **GIVEN** mission 2 with 0 / 5 campaign raids and 0 / 10 Xenos kills
- **THEN** a "Fight by hand" list of nodes where Xenos can deploy covers the 10 kills
- **AND** the raids for the 5 campaign raids are listed below it on any node

#### Scenario: Mission 7

- **GIVEN** mission 7 with 0 / 20 alliance ability uses
- **THEN** the list holds only 5-slot nodes where Xenos can deploy, for 4 battles

#### Scenario: Mission 15

- **GIVEN** mission 15 with 0 / 150 ability uses
- **THEN** the list holds 5-slot nodes of any alliance, for 30 battles, and says Arena and Onslaught battles count too

#### Scenario: Mission 20

- **GIVEN** mission 20 with 0 / 10 featured-hero ability uses and 0 / 250 campaign wins
- **THEN** the list holds 10 battles on nodes where Xenos can deploy, and the raids to go drop to 240

#### Scenario: Mission 5 ability damage

- **GIVEN** mission 5 with its ability damage and campaign wins open
- **THEN** the list shows 3 nodes with their energy per battle and says to play them until the objective is done

### Requirement: Raids are never kept to an alliance

Raid suggestions SHALL use every candidate node whatever the mission's other objective, because raids count no alliance kills or featured-hero ability uses. Those objectives get their own list of battles to fight by hand instead.

#### Scenario: Mission 16

- **GIVEN** mission 16 with its Xenos kills and campaign raids open
- **THEN** the raids are suggested on every candidate node, and the Xenos kills get a "Fight by hand" list of nodes where Xenos can deploy

### Requirement: Rows show the goals a node feeds

Each suggested node SHALL show the characters of the in-scope goals it feeds, as the HSE farm list does.

#### Scenario: Node feeds two goals

- **GIVEN** a suggested node that drops a material two goals still need
- **THEN** its row shows both goals' character icons

### Requirement: All-alliance suggestions wait for the featured hero

While the featured hero does not resolve, the section SHALL NOT list battles for an objective kept to the featured hero's alliance, and SHALL say that the suggestions need the featured hero's alliance. Raids for the mission's campaign objective SHALL still be listed.

#### Scenario: Featured hero unresolved

- **GIVEN** mission 7 with alliance ability uses open and the featured hero not resolved
- **THEN** no battle is listed and the section says it needs the featured hero's alliance

### Requirement: Faction kills get their own list of battles

While the current mission has an open `killFaction` objective, its list of battles to fight by hand SHALL hold only nodes with that faction's enemies, from any campaign, and each battle SHALL count the node's enemies of that faction toward the kills still needed. Nodes with the most of them per energy SHALL come first, then they are ordered as raids are. While the mission's lightning victories are also open, nodes with a lightning-victory condition SHALL come first, so a quick win counts for both. These battles SHALL NOT reduce the lightning raids still needed, because a win by hand is not always a lightning victory.

Assumptions:

- Indomitus nodes below 19 have no lightning-victory condition; every other node has one.

#### Scenario: Mission 11

- **GIVEN** mission 11 with 0 / 25 lightning victories and 40 / 100 Necron kills
- **THEN** the event raids are listed, and a "Fight by hand" list of nodes with Necron enemies covers the 60 kills still needed, nodes with a lightning-victory condition first

#### Scenario: Most enemies per energy first

- **GIVEN** 20 Necron kills still needed, a 3-energy node with 3 Necrons and a 6-energy node with 9 Necrons
- **THEN** the 6-energy node comes first, with 3 battles

### Requirement: Event points break ties among equal costs

Among nodes that equally feed goals or not, and of the same energy cost, the HRE suggestions SHALL put first, in order: the running Home Screen Event's points per raid, descending, when one with a raid-point rule runs; then nodes with a lightning-victory condition; then higher enemy power, because the HRE scores both; and then the drop-rate and gold order. Feeding a goal, then energy cost, SHALL stay the first keys. Severyn approved the lightning and enemy-power keys after the wiki check (2026-10).

Assumptions:

- The wiki's HRE campaign points are 3 per energy, plus 1 per difficulty skull, plus 1 per skull for a lightning victory, plus some for enemy power.

#### Scenario: Equal cost, more event points first

- **GIVEN** Machine Hunt runs and I21 and I22 both cost 5 energy, with I22 earning 15 event points per raid and I21 earning 9
- **THEN** I22 is listed before I21

#### Scenario: Cheaper node still wins

- **GIVEN** a running event gives I21 (5 energy) 15 points per raid and I20 (3 energy) none
- **THEN** I20 is listed first

#### Scenario: Lightning condition next

- **GIVEN** no Home Screen Event runs, and I18 (no lightning condition) and I19 both cost 5 energy
- **THEN** I19 is listed before I18

#### Scenario: Event without raid points

- **GIVEN** Faction Boost (no raid-point rule) runs
- **THEN** the event adds no key, and the lightning and enemy-power keys still apply

### Requirement: HRE suggestions show the running event's points

While a rule-bearing Home Screen Event runs, each HRE row whose raids earn its points SHALL show them. When at least one suggested row earns its points, the section note SHALL name the event and say that, among nodes of equal cost, those earning more of its points come first.

#### Scenario: Rows and note

- **GIVEN** Machine Hunt runs and I22 gets 1 raid worth 15 event points
- **THEN** I22's row shows "15 event pts" and the note names Machine Hunt

#### Scenario: No suggested row earns event points

- **GIVEN** Machine Hunt runs and no suggested node has its enemies
- **THEN** the note does not mention Machine Hunt

### Requirement: The HRE tab has no raid header controls

The HRE tab SHALL NOT show the project selector, the Raids Filters action or the Planning Settings action. Its raid suggestions SHALL cover every active goal, whatever project Today has selected, SHALL keep using the persisted Raids Filters and the Planning Settings daily energy set on Today, and the empty-list action to open or reset the filters SHALL remain.

#### Scenario: Running event

- **GIVEN** an HRE is running
- **THEN** the HRE tab's title row shows no project selector, Raids Filters or Planning Settings control

#### Scenario: Project picked on Today

- **GIVEN** a project is selected on Today
- **THEN** the HRE suggestions still rank nodes by every active goal
