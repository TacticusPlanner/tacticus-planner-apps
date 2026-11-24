# hre-campaign-raids Specification

## Purpose

Tells the player where to raid today so that the current HRE mission's campaign-battle objective is finished with the least energy, while still feeding their goals where it costs nothing extra.

## Requirements

### Requirement: Raid suggestions appear only for a current campaign objective

On a running HRE, raids SHALL be suggested only when the current mission has an open objective that raids serve, and battles to fight by hand only when it has one that only those battles serve (see "Manual objectives get a list of battles to fight by hand"). Both lists are summarised in rows under the objectives they serve and shown in full in the mission's suggestions section (see "Suggestion rows under the objectives jump to their details"); in the rest of this spec, "the section" means those details cards. Raids SHALL serve only `campaignWins` ("Win N campaign battles"), `campaignRaids` ("Raid N campaign battles") and `lightningVictories` ("Win N lightning victories") objectives below their target; the battles still needed SHALL be the target minus the recorded progress. Raids SHALL NOT be suggested for any other objective, because a raid counts no kills, damage, healing, ability uses or lineup wins (Severyn, 2026-10). When the current mission has neither, the "Campaign battles" section (see "The Campaign battles section holds the outlook") SHALL say its campaign objective is complete when it has one, or else name the next mission that has a campaign objective and its target, or say that no campaign missions are left. It SHALL NOT list raids for a later mission.

Assumptions:

- A raid counts as a won campaign battle, so it advances both `campaignWins` and `campaignRaids` objectives by one.
- Mission progress counts only while that mission is the current one; battles done earlier do not carry forward.

#### Scenario: Mission 5 in progress

- **GIVEN** the current mission is 5 with 37 / 100 campaign wins
- **THEN** the "Win 100 campaign battles" objective has a Raids row for 63 battles to go

#### Scenario: Current mission has no campaign objective

- **GIVEN** the current mission is 8 with 20,000 / 20,000 damage and its Guild Raid tokens still open
- **THEN** no raids or battles row is shown, and the Campaign battles section reads "Next campaign mission: 16, Raid 25 campaign battles"

#### Scenario: Campaign objective already met

- **GIVEN** mission 5 at 100 / 100 campaign wins, with its ability damage still open
- **THEN** no raid list is shown, only the battles to fight by hand for the ability damage

#### Scenario: Every objective that needs the campaign is met

- **GIVEN** mission 19 at 75 / 75 campaign wins and 100 / 100 melee kills
- **THEN** no row is shown, and the Campaign battles section says the campaign objective is complete

#### Scenario: Preview event

- **GIVEN** the tab previews an upcoming HRE
- **THEN** no row is shown; the Campaign battles section shows only the remaining-campaign summary (see below), from mission 1

### Requirement: Candidate locations follow raid eligibility and today's limits

A campaign battle SHALL be a candidate only if all of these hold:

1. The player's campaign progress unlocks it, which includes event-campaign nodes only while their event runs.
2. Its energy cost is above 0.
3. It has attempts left today.
4. It passes the persisted Raids Filters, the campaign-type (location) filter included, as on Today (Severyn, 2026-11). Battles fought by hand (see "Manual objectives get a list of battles to fight by hand") still ignore the campaign-type filter.

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

#### Scenario: Campaign-type filter applied

- **GIVEN** a campaign-type Raids Filter of Mirror only
- **THEN** only Mirror nodes are candidates for raids: the 5-energy Indomitus nodes I15 to I29 and the no-drop I06 to I14, which have no campaign type and so match no option, are not

### Requirement: Suggestions start from Today's raids under the mission's rules

The suggestions SHALL start from Today's plan, run again with the same goals, Raids Filters, quick filters (except "Fewer raids"), energy left today and attempts, plus the current mission's node rules, like a quick filter (Severyn, 2026-11):

- For a `lightningVictories` objective, only event-campaign nodes count, so only they SHALL be raided in that run.
- For a `campaignWins` or `campaignRaids` objective, any node counts, so each material SHALL be farmed at a 5 or 6 energy node when one drops it (more battles for the energy), or, with "CE nodes first" on, at the running campaign event's node.
- For a mission with only manual objectives open, the run SHALL use the same 5 or 6 energy rule; it orders the battles fought by hand (see "Manual objectives get a list of battles to fight by hand").

That run's raids at candidate nodes SHALL be listed first, one row per node in Today's order, within each node's attempts left, until the battles to go are reached; the last row SHALL be cut to what is left. A row SHALL show the resource Today raids the node for. Battles still left SHALL then be filled as "Suggestions serve goals first, then minimise energy, and fill to the limits" says, and a node already listed keeps its place with the raids added.

#### Scenario: Lightning victories follow Today's goals

- **GIVEN** mission 8 at 0 / 25 lightning victories, the Tyranids campaign event running, and Today farming a goal's Epic at Tyranids 25B among standing-campaign nodes
- **THEN** the run limited to event nodes still farms the goals' event drops (Tyranids 3, 19, 3B and 25B) in goal order, and only then do the cheapest event nodes take the battles still left

#### Scenario: Battles by hand follow Today's goals

- **GIVEN** a mission at 0 / 150 ability uses for Tyranids units, and Today farming a goal's Epic at Tyranids 25B
- **THEN** the "Fight by hand" list starts with Tyranids 25B, then Today's other nodes where Tyranids can deploy, then the other nodes

#### Scenario: Location filter as on Today

- **GIVEN** the Raids Filters keep only Mirror, Standard, Extremis and Early nodes
- **THEN** the suggestions use only those nodes, as Today does

### Requirement: Suggestions serve goals first, then minimise energy, and fill to the limits

Battles still left after Today's raids (see "Suggestions start from Today's raids under the mission's rules") SHALL use only candidates that drop something. Candidates SHALL be ordered as follows:

1. A node that drops a resource an in-scope goal still needs SHALL come first, whatever its energy cost (Severyn, 2026-10). An Epic or higher upgrade SHALL count only on Elite nodes (a storyline Elite or Elite Mirror node, or an event's Extremis node): a standard or Mirror node drops it too rarely to farm it there, so for that upgrade it is not a goal node (Severyn, 2026-11). A goal's pinned farm locations keep counting whatever their tier. A node feeds its goal only until the raids already suggested are expected to drop what the in-scope goals still need of its resource (raids times drop rate): it SHALL get no more raids for the goal than that, and once the resource is covered every node dropping it SHALL rank as a node that feeds no goal (Severyn, 2026-11).
2. With "CE nodes first" on (see "The HRE tab has raid list controls"), the running campaign event's reached nodes SHALL come next, ahead of cheaper nodes, among goal nodes and among the others alike.
3. Among nodes still feeding a goal, the least energy per expected drop of the goal's resource (energy cost divided by drop rate) SHALL come next (Severyn, 2026-11). Then energy cost ascending, then the event-point tie-breaks (see "Event points break ties among equal costs").
4. Among goal nodes, a higher drop rate for the goal's resource SHALL come next, because common and uncommon materials drop more often. A higher average guaranteed gold comes next, then the goal's best priority.
5. Other nodes SHALL be ordered by average guaranteed gold, descending.
6. Battle id breaks any remaining tie.

Each node, in order, SHALL get as many raids as its attempts left, the remaining budget and the battles left for suggestions allow. A node that does not fit SHALL be skipped. Rows with 0 raids SHALL NOT be shown. A row whose node feeds a goal SHALL show the goal resource's icon with the player's "owned/target" for it, as on the HSE tab. The totals of raids and energy SHALL be shown, and the energy total SHALL NOT exceed the budget.

#### Scenario: Worked example, mission 5

- **GIVEN** the "Energy spent today" case (38 battles to go, 188 energy budget), with Indomitus unlocked, none of it used today, and no goals
- **THEN** I15, I16 and I17 (5 energy, cap 10) get 10 raids each and I18 gets 7
- **AND** the totals read 37 raids and 185 energy, and the section notes "1 battle left after today's energy"

#### Scenario: A covered material stops pulling raids

- **GIVEN** a goal that needs 6 Combat Stimms, dropped by a Tyranids Extremis node (one per raid on average, 5 attempts) and by Fall of Cadia Mirror and standard nodes at lower rates
- **THEN** the Extremis node is suggested first with its 5 raids, a Mirror node gets only the raids expected to drop the last Stimm, and the battles still left go to the cheapest nodes, not to every node that drops Combat Stimms

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

When the current mission has a `lightningVictories` objective below its target, the section SHALL suggest raids on event-campaign nodes only, because a raid there counts as a lightning victory. It SHALL use the same budget, attempts, filters, start from Today's raids, ordering and fill as campaign objectives. The battles to go are the lightning victories still needed. When no campaign event is running, the section SHALL say so and suggest winning battles manually.

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

The tab SHALL show the total campaign battles still needed across the current mission and every later mission, including Bonus. It SHALL set them against the days the event has left: the remaining time while it runs, or its whole length for a preview, rounded up and at least 1. It SHALL show the battles a day needed and the energy a day they cost at the cheapest candidate nodes, within each node's daily cap. When the Planning Settings daily energy cannot cover that many a day, it SHALL show the most battles a day the energy allows and how many battles will not fit before the event ends. The nodes ignore today's attempts and the lightning restriction, but still apply unlock state and the Raids Filters.

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

### Requirement: Suggestions use today's energy left and ignore Today's progress

The battles to go SHALL be the objective's target minus its progress; raids still planned on Today SHALL NOT count toward them as done. The suggestions start from those raids instead (see "Suggestions start from Today's raids under the mission's rules"), so the section says where to raid for the mission in the same places as Today. The HRE energy budget SHALL be the Planning Settings daily energy minus the energy really spent today, never below 0.

Assumptions:

- Energy per raid is the battle's `energyCost`. Indomitus I06 to I14 cost 3, I15 to I29 cost 5, other campaign nodes cost 6 and Elite nodes cost 10.

#### Scenario: Energy spent today

- **GIVEN** 38 battles to go, Planning Settings daily energy 538 and 350 energy spent today
- **THEN** 38 battles are left for suggestions with a budget of 538 - 350 = 188 energy

#### Scenario: Today's plan does not hide suggestions

- **GIVEN** 20 battles to go and Today still planning 94 raids
- **THEN** raids for all 20 battles are still suggested, starting from Today's raids

#### Scenario: Today's energy spent

- **GIVEN** daily energy 538 and 538 spent today
- **THEN** the budget is 0, no raids are suggested, and the section says no energy is left today

### Requirement: Manual objectives get a list of battles to fight by hand

Every open objective that only progresses in battles played by hand (kills, damage, ability damage, a damage type, the featured hero's damage, healing, ability uses, summon-free wins and all-alliance wins) SHALL be served by one list titled "Fight by hand", shown above the raids, for all of the current mission's open manual objectives together. Its nodes SHALL be kept to what the objectives need:

- **Ability uses (any units or alliance):** only nodes with 5 deployment slots, so every unit's abilities count.
- **Alliance kills, alliance ability uses, all-alliance wins, the featured hero's ability uses or damage:** only nodes where the featured hero's alliance can deploy.
- **The featured hero's ability uses or damage:** also only nodes where the featured hero's faction can deploy, so the hero can play every listed node.
- **Faction kills:** only nodes with that faction's enemies (see "Faction kills get their own list of battles").

These limits replace the Raids Filters' slot, allies-alliance and (for the featured hero's objectives) allies-faction choices for this list; the other Raids Filters still apply. The list SHALL estimate what one battle counts toward each objective: the node's enemy total for kills, its enemies of the faction for faction kills, its enemies' total health for damage and for ability damage (a battle's ability damage cannot exceed it; Severyn, 2026-11), 5 uses for ability uses, and 1 for the featured hero's ability uses and for wins. Nodes that count nothing toward an estimated objective SHALL be left out. While the mission's lightning victories are open, nodes with a lightning-victory condition SHALL come first (see "Faction kills get their own list of battles"); then the nodes of Today's run under the mission's rules (see "Suggestions start from Today's raids under the mission's rules") that pass this list's limits, in Today's order, so a battle fought by hand also farms what Today would raid there (Severyn, 2026-11); then nodes that drop a resource an in-scope goal still needs; then nodes SHALL be ordered by the energy it takes to finish the first estimated objective at that node alone (the battles it needs there times its energy cost), then by the fewest of those battles, then as raids are (including the event-point tie-breaks), and filled until every estimated objective is covered, within the attempts left and today's energy left; the raids get the energy and attempts the list leaves. When no objective can be estimated (a damage type, the featured hero's damage, healing), the list SHALL show the 3 best nodes by enemy health per energy with their energy per battle, and say to play them until the objective is done. The list SHALL open with one visible line saying that raids don't count these objectives. Its other notes SHALL be a bullet list folded under "Node rules", closed by default on desktop and mobile: the limits that apply, whether the counts are estimates, that each battle also counts as a campaign win (when it does), and that Arena and Onslaught battles count too. When the featured hero's faction rule applies, the alliance rule SHALL NOT be listed, because the faction rule already implies it. When more battles are needed than today's energy allows, the list SHALL say so.

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

- **GIVEN** mission 5 with 10,000 ability damage to go and campaign wins open
- **THEN** the list counts each node's enemies' total health toward the damage, and shows the nodes and battles that cover it, the least energy first

#### Scenario: Mission 20 note

- **GIVEN** Zapspitta's mission 20 with 0 / 10 featured-hero ability uses and 70 / 250 campaign wins
- **THEN** the visible line says raids don't count ability uses, so fight these battles yourself
- **AND** "Node rules" lists "Only nodes where Orks units can deploy, so the featured hero can play them", without "Only nodes where Xenos units can deploy"

### Requirement: Raids are never kept to an alliance

Raid suggestions SHALL use every candidate node whatever the mission's other objective, because raids count no alliance kills or featured-hero ability uses. Those objectives get their own list of battles to fight by hand instead.

#### Scenario: Mission 16

- **GIVEN** mission 16 with its Xenos kills and campaign raids open
- **THEN** the raids are suggested on every candidate node, and the Xenos kills get a "Fight by hand" list of nodes where Xenos can deploy

### Requirement: Rows look like regular raid card rows

Each suggested node SHALL be shown as a regular raid card row: its battle, the goal drop with "owned/target", and the running event's points. A node that feeds no goal SHALL show its own drop's icon with how many the player owns ("7 owned"), so its rewards show without a goal (Severyn, 2026-11); a node that drops nothing shows no drop. A row fought by hand SHALL show its battle count, and for a kill objective the enemies one battle there defeats ("6 enemies"), on a second line under the row, so they never squeeze the node name (Severyn, 2026-11). Rows SHALL NOT show the portraits of the goals' characters (Severyn, 2026-11), so a row stays on one line on a phone.

#### Scenario: Node feeds two goals

- **GIVEN** a suggested node that drops a material two goals still need
- **THEN** its row shows the material's icon with "owned/target", and no character portraits

#### Scenario: Node feeds no goal

- **GIVEN** a suggested Indomitus node whose drop no goal needs, and 7 of that drop in the inventory
- **THEN** its row shows the drop's icon with "7 owned"

### Requirement: All-alliance suggestions wait for the featured hero

While the featured hero does not resolve, the section SHALL NOT list battles for an objective kept to the featured hero's alliance, and SHALL say that the suggestions need the featured hero's alliance. Raids for the mission's campaign objective SHALL still be listed.

#### Scenario: Featured hero unresolved

- **GIVEN** mission 7 with alliance ability uses open and the featured hero not resolved
- **THEN** no battle is listed and the section says it needs the featured hero's alliance

### Requirement: Faction kills get their own list of battles

While the current mission has an open `killFaction` objective, its list of battles to fight by hand SHALL hold only nodes with that faction's enemies, from any campaign, and each battle SHALL count the node's enemies of that faction toward the kills still needed. They SHALL be ordered as the list orders nodes for kills (see "Manual objectives get a list of battles to fight by hand"). While the mission's lightning victories are also open, nodes with a lightning-victory condition SHALL come first, so a quick win counts for both. These battles SHALL NOT reduce the lightning raids still needed, because a win by hand is not always a lightning victory.

Assumptions:

- Indomitus nodes below 19 have no lightning-victory condition; every other node has one.

#### Scenario: Mission 11

- **GIVEN** mission 11 with 0 / 25 lightning victories and 40 / 100 Necron kills
- **THEN** the event raids are listed, and a "Fight by hand" list of nodes with Necron enemies covers the 60 kills still needed, nodes with a lightning-victory condition first

#### Scenario: Most enemies per energy first

- **GIVEN** 20 Necron kills still needed, a 3-energy node with 3 Necrons and a 6-energy node with 9 Necrons
- **THEN** the 6-energy node comes first, with 3 battles

#### Scenario: A few kills take the cheapest node with enough enemies

- **GIVEN** mission 1 with 5 kills still needed, an 8-energy node with 12 enemies, a 5-energy node with 6 enemies and a 3-energy node with 4 enemies
- **THEN** the 5-energy node is suggested for 1 battle and its row shows "6 enemies", not the node with the most enemies (Severyn, 2026-11)

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

### Requirement: HRE suggestion rows are grouped by campaign

Each list of suggested nodes (raids, battles fought by hand, the no-drop nodes) SHALL show each run of consecutive rows in one campaign (with its difficulty) under one header with the campaign icon and the campaign's name, mirror qualifier and difficulty word; each row SHALL name just its battle ("Battle 7") ahead of its goals, drop and counts. A campaign with a single row in a group SHALL show no header: that row SHALL instead name the location in full ("Saim-Hann Elite 33") after the campaign icon, with its drop and counts on the same line, as on Dailies > Raids, wrapping only when the row is too narrow (Severyn, 2026-11). Grouping SHALL NOT reorder the list, and paging counts rows, not groups. As on the HSE lists, a raid row SHALL NOT show its raid count or energy (a by-hand battle row keeps its battle count, an open-ended row its energy per battle), and each row's battle name SHALL open the battle and its enemies.

#### Scenario: Consecutive rows of one campaign share a header

- **GIVEN** the list's rows, in its order, are Octarius Mirror Elite 26, Indomitus Mirror Elite 7, Indomitus Mirror Elite 38, Octarius Mirror Elite 15, 21 and 39
- **WHEN** the list renders
- **THEN** it shows an "Octarius Mirror Elite" group with Battle 26, an "Indomitus Mirror Elite" group with Battle 7 and Battle 38, then an "Octarius Mirror Elite" group with Battle 15, 21 and 39, each row keeping its own badges and drop

### Requirement: The HRE tab has raid list controls

The HRE tab's toolbar SHALL show the Dailies project selector (with "All projects") and the Raids Filters action while the event is running or previewed, and SHALL NOT show the Planning Settings action. The project selection SHALL be the one Dailies-wide, session-only selection shared with Today and the HSE tab. The suggestions SHALL serve the selected project's Active goals first (every Active goal without one), SHALL use the persisted Raids Filters (the campaign-type filter included) and the Planning Settings daily energy set on Today, and the empty-list action to reset the filters SHALL remain. Today's quick filters SHALL apply too, except "Fewer raids", which the tab hides because its raids count battles. "CE nodes first" SHALL be offered, as on Today, only while a campaign event with reached nodes is running or while it is on, and SHALL rank the running campaign event's nodes first (Severyn, 2026-11). A past event SHALL NOT show the controls, the suggestions or the Campaign battles section.

#### Scenario: Controls in the toolbar

- **GIVEN** an HRE is running
- **THEN** the toolbar shows the project selector and the Raids Filters action, and no Planning Settings action

#### Scenario: CE nodes first

- **GIVEN** an HRE and a campaign event are running, and the player has reached nodes of the campaign event
- **WHEN** the player turns on "CE nodes first"
- **THEN** the raids for the campaign objective list the campaign event's nodes first, after any node feeding a goal

#### Scenario: Epic upgrade on a Mirror node

- **GIVEN** a goal still needs a Legendary upgrade that drops on Saim-Hann Mirror 74 and Saim-Hann Elite 30
- **THEN** only Saim-Hann Elite 30 counts as a goal node, and Saim-Hann Mirror 74 is ranked as a node that feeds no goal

#### Scenario: Project picked on Today

- **GIVEN** a project is selected on Today
- **THEN** the HRE suggestions rank nodes that feed that project's goals first

### Requirement: Suggestion rows under the objectives jump to their details

Under each open objective of the current mission card, the tab SHALL show one row per suggestion that serves it: the raids, the battles to fight by hand, and the token teams (see the hre-mission-teams capability). Each row SHALL fit one line: the first suggested node or the team's portraits, the count ("37 raids", "10 battles", "Up to 3 battles"), and a down arrow. The rows SHALL NOT expand in place (Severyn, 2026-11). Every suggestion's full list with its notes, or its team card, SHALL be shown as its own card in a "Suggestions" section right after the Event pace card, in objective order; a raids card is titled "Raids" and a battles card "Fight by hand", each with the objective it serves. Tapping a row SHALL scroll the page to its card, smoothly unless the player prefers reduced motion. An objective already at its target SHALL show no rows and no cards; with no suggestion at all the section is not shown.

When the battles to fight by hand serve two open objectives of the mission, the row SHALL sit under the first of them, and the other SHALL say "The battles above count for this objective too." instead of a second row. Raids SHALL sit only under `campaignWins`, `campaignRaids` and `lightningVictories` objectives.

#### Scenario: Mission 5

- **GIVEN** mission 5 with 6,000 / 10,000 ability damage and 37 / 100 campaign wins, and spare Onslaught tokens
- **THEN** the ability damage shows a "Fight by hand" row and an Onslaught team row
- **AND** the campaign wins show a Raids row naming its first node and the raid count
- **AND** the Suggestions section after Event pace shows the Fight by hand card, the Onslaught team card and the Raids card

#### Scenario: Tapping a row

- **WHEN** the player taps the Raids row
- **THEN** the page scrolls to the Raids card, with the grouped raid rows, the totals and the notes

### Requirement: The Campaign battles section holds the outlook

The side column SHALL hold a section titled "Campaign battles" below the event pace and the tokens card (on mobile, after them and before the mission list). It SHALL show the remaining-campaign summary (see "Remaining campaign battles are summarised across missions"), a loading or error state while the raid data is not ready, and, when the current mission has no raids or battles to suggest, the notice of "Raid suggestions appear only for a current campaign objective". It SHALL NOT list raids itself.

#### Scenario: Mission 5

- **GIVEN** mission 5 with its campaign wins open
- **THEN** the Campaign battles section shows only the remaining-campaign summary, and the raids are in the Raids card of the Suggestions section
