## MODIFIED Requirements

### Requirement: Faction kills get their own node list

While the current mission has an open `killFaction` objective, the section SHALL show, apart from the main list, the nodes with that faction's enemies from any campaign, not repeating the main list's nodes, filled with the energy the main list leaves. Nodes with the most enemies SHALL come first, then they are ordered as raids are. Each raid SHALL count the node's enemy total toward the kills still needed. While lightning victories are also open, only nodes with a lightning-victory condition SHALL be listed.

Assumptions:

- Indomitus nodes below 19 have no lightning-victory condition; every other node has one.

#### Scenario: Mission 11

- **GIVEN** mission 11 with 0 / 25 lightning victories and 40 / 100 Necron kills
- **THEN** the event raids are listed, and a separate "Nodes with Necrons enemies" list covers the 60 kills still needed, without Indomitus nodes below 19

#### Scenario: Most enemies first

- **GIVEN** 20 Necron kills still needed, a 3-energy node with 3 enemies and a 6-energy node with 9 enemies
- **THEN** the 9-enemy node comes first, with 3 raids
