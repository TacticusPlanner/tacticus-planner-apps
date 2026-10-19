## ADDED Requirements

### Requirement: Battle suggestions are labeled as battles

When the section suggests battles to fight by hand, its totals, energy budget and no-drop note SHALL say battles, not raids.

#### Scenario: Mission 7 totals

- **GIVEN** mission 7 with 12 / 20 alliance ability uses
- **THEN** the totals and the no-drop totals count battles, and the budget reads "Energy left for these battles"

### Requirement: All-alliance suggestions wait for the featured hero

While the featured hero does not resolve, the section SHALL NOT list nodes for an all-alliance objective, and SHALL say that the suggestions need the featured hero's alliance.

#### Scenario: Featured hero unresolved

- **GIVEN** mission 7 with alliance ability uses open and the featured hero not resolved
- **THEN** no node is listed and the section says it needs the featured hero's alliance
