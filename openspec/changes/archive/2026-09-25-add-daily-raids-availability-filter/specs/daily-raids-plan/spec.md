## ADDED Requirements

### Requirement: Day 1 separates raided nodes from actionable nodes

Raids Plan's Day 1 ("Today") column SHALL present nodes whose real synced attempts today are explicitly zero in a separate section labelled "Raided", placed after the section of remaining nodes. There SHALL be no control to toggle this; it always applies. Nodes with positive remaining attempts or unknown attempt data SHALL stay in the main (actionable) section. Day 2 onward SHALL be unaffected, including when the same battle appears on multiple days. Nodes SHALL move between sections when refreshed attempt data changes, without user action.

Assumption: Real synced attempt counts describe today, whereas future-day simulated attempt caps describe a plan, not attempts already used.

This separation SHALL NOT change campaign eligibility, farming strategy, energy affordability, or the existing Today behavior. A node remaining in the main section SHALL NOT be presented as proof of full actionability.

#### Scenario: Exhausted nodes appear in a Raided section

- **GIVEN** the Day 1 column includes a node with zero real attempts left today and another with attempts remaining
- **WHEN** Raids Plan renders
- **THEN** the node with attempts remaining appears in the main section
- **AND** the exhausted node appears after it, under a "Raided" divider

#### Scenario: Later days are unaffected

- **GIVEN** Day 2's column includes a node the simulated plan has fully allocated for that day
- **WHEN** Raids Plan renders Day 2
- **THEN** that node remains in Day 2's column with no "Raided" section, because Day 2 has no real attempts-left data to act on

#### Scenario: The same battle appears today and on a future day

- **GIVEN** a battle appears in Day 1 and Day 2 and has zero real attempts remaining today
- **WHEN** Raids Plan renders
- **THEN** its Day-1 entry appears under "Raided" and its Day-2 entry appears normally

#### Scenario: Positive and unknown attempt counts stay actionable

- **GIVEN** Day 1 includes one node with positive remaining attempts and another with no real attempt data
- **WHEN** Raids Plan renders
- **THEN** both nodes appear in the main section, without treating unknown data as exhausted

#### Scenario: Refreshed attempt data moves nodes between sections

- **GIVEN** a Day-1 node has remaining attempts and is in the main section
- **WHEN** refreshed data reports zero remaining attempts for that node
- **THEN** the node moves to the "Raided" section
- **AND** if a subsequent refresh reports positive remaining attempts and the node is still in the plan, it returns to the main section

#### Scenario: No raided nodes means no Raided section

- **GIVEN** no Day-1 node has zero real attempts remaining
- **WHEN** Raids Plan renders
- **THEN** no "Raided" divider or empty section is shown

#### Scenario: Every Day-1 node is raided

- **GIVEN** Day 1 contains planned nodes and all have zero real attempts remaining today
- **WHEN** Raids Plan renders
- **THEN** the day card and its original summary remain visible with only the "Raided" section
- **AND** this is not presented as goal completion or an empty plan
- **AND** future days remain unchanged

### Requirement: Separating raided nodes preserves plan presentation and calculations

The split SHALL change only where Day-1 nodes are displayed. Nodes in both sections SHALL retain their material-oriented presentation and selected density, and keep their relative order within each section. Day and whole-plan summaries SHALL continue to describe the original calculated plan. The split SHALL NOT recalculate the plan, choose replacement nodes, or change energy totals, duration, or other plan totals. Resource and goal groups with no nodes in a section SHALL be omitted rather than leaving empty headers or card shells.

#### Scenario: Split preserves layout and totals

- **GIVEN** a plan contains exhausted and non-exhausted Day-1 nodes and a selected density
- **WHEN** Raids Plan renders
- **THEN** cards in both sections use the same presentation and density
- **AND** relative order is preserved within each section
- **AND** day and whole-plan totals are unchanged and no replacement nodes are scheduled

#### Scenario: Empty groups are omitted

- **GIVEN** all nodes within a resource group or goal group have zero real attempts remaining today
- **WHEN** Raids Plan renders
- **THEN** that group does not appear in the main section and appears only under "Raided"
- **AND** no empty header or card shell is left in the main section
