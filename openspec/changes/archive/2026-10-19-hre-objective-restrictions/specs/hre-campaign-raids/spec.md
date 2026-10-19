## ADDED Requirements

### Requirement: Raids keep to the alliance for the mission's other objective

While the current mission's other open objective is `killWithAlliance`, `useAbilitiesFeatured` or `featuredDamage`, raid suggestions SHALL list only nodes where the featured hero's alliance can deploy, and the note SHALL say so. They SHALL wait for the featured hero to resolve, as all-alliance battles do.

#### Scenario: Mission 16

- **GIVEN** mission 16 with its Xenos kills and campaign raids open
- **THEN** only nodes where Xenos can deploy are suggested

#### Scenario: Alliance kills done

- **GIVEN** mission 16 with its Xenos kills complete
- **THEN** raid suggestions are not kept to Xenos nodes

### Requirement: Faction kills get their own node list

While the current mission has an open `killFaction` objective, the section SHALL show, apart from the main list, the cheapest nodes with that faction's enemies from any campaign, not repeating the main list's nodes, ordered as raids are and filled with the energy the main list leaves. Each raid SHALL count the node's enemy total toward the kills still needed.

#### Scenario: Mission 11

- **GIVEN** mission 11 with 0 / 25 lightning victories and 40 / 100 Necron kills
- **THEN** the event raids are listed, and a separate "Nodes with Necrons enemies" list covers the 60 kills still needed
