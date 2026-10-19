## MODIFIED Requirements

### Requirement: Alliance objectives get raids or battles

For `winWithAllianceLineup` the section SHALL be titled "Battles for mission N" and list nodes of any slot count to fight by hand with an all-alliance team of the featured hero's alliance, because raids have no lineup and do not count; the note SHALL add that Arena wins with that team count too. For `useAbilitiesAlliance` the section SHALL be titled "Battles for mission N" and list only nodes with 5 deployment slots (replacing the Raids Filters' slot choice), to fight by hand with a full alliance team; its note SHALL add that ability uses in Salvage Runs and other modes count too. Both are ordered and filled as raids are.

#### Scenario: Mission 10

- **GIVEN** mission 10 with 5 / 15 all-Xenos wins
- **THEN** the section is titled "Battles for mission 10", shows "10 battles to go", says raids do not count and lists nodes of every slot count

#### Scenario: Mission 7

- **GIVEN** mission 7 with 0 / 20 alliance ability uses
- **THEN** the section is titled "Battles for mission 7", shows "2 battles to go", lists only 5-slot nodes and says Salvage Run ability uses count too
