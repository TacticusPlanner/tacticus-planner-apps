## MODIFIED Requirements

### Requirement: Manual objectives get a list of battles to fight by hand

Every open objective that only progresses in battles played by hand (kills, damage, ability damage, a damage type, the featured hero's damage, healing, ability uses, summon-free wins and all-alliance wins) SHALL be served by one list titled "Fight by hand", shown above the raids, for all of the current mission's open manual objectives together. Its nodes SHALL be kept to what the objectives need:

- **Ability uses (any units or alliance):** only nodes with 5 deployment slots, so every unit's abilities count.
- **Alliance kills, alliance ability uses, all-alliance wins, the featured hero's ability uses or damage:** only nodes where the featured hero's alliance can deploy.
- **The featured hero's ability uses or damage:** also only nodes where the featured hero's faction can deploy, so the hero can play every listed node.
- **Faction kills:** only nodes with that faction's enemies (see "Faction kills get their own list of battles").

These limits replace the Raids Filters' slot, allies-alliance and (for the featured hero's objectives) allies-faction choices for this list; the other Raids Filters still apply. The list SHALL estimate what one battle counts toward each objective: the node's enemy total for kills, its enemies of the faction for faction kills, its enemies' total health for damage, 5 uses for ability uses, and 1 for the featured hero's ability uses and for wins. Nodes that count nothing toward an estimated objective SHALL be left out. While the mission's lightning victories are open, nodes with a lightning-victory condition SHALL come first (see "Faction kills get their own list of battles"); then nodes that drop a resource an in-scope goal still needs; then nodes SHALL be ordered by what they count per energy for the first estimated objective, so the fewest battles are needed, then as raids are (including the event-point tie-breaks), and filled until every estimated objective is covered, within the attempts left and today's energy left; the raids get the energy and attempts the list leaves. When no objective can be estimated (ability damage, a damage type, the featured hero's damage, healing), the list SHALL show the 3 best nodes by enemy health per energy with their energy per battle, and say to play them until the objective is done. The list SHALL open with one visible line saying that raids don't count these objectives. Its other notes SHALL be a bullet list folded under "Node rules", closed by default on desktop and mobile: the limits that apply, whether the counts are estimates, that each battle also counts as a campaign win (when it does), and that Arena and Onslaught battles count too. When the featured hero's faction rule applies, the alliance rule SHALL NOT be listed, because the faction rule already implies it. When more battles are needed than today's energy allows, the list SHALL say so.

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

#### Scenario: Mission 20 note

- **GIVEN** Zapspitta's mission 20 with 0 / 10 featured-hero ability uses and 70 / 250 campaign wins
- **THEN** the visible line says raids don't count ability uses, so fight these battles yourself
- **AND** "Node rules" lists "Only nodes where Orks units can deploy, so the featured hero can play them", without "Only nodes where Xenos units can deploy"
