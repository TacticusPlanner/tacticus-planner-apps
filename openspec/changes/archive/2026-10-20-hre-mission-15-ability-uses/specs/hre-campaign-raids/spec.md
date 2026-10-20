## ADDED Requirements

### Requirement: Any-unit ability uses get 5-slot raids

When the current mission has no open campaign, lightning, all-alliance lineup or alliance-ability objective but has an open ability-use objective for any units (mission 15, and mission 3 once its campaign wins are done), the raid suggestions SHALL serve it as raids on 5-slot nodes, counting 5 ability uses per raid, so the raids to go are `ceil(uses to go / 5)`. The note SHALL say that each raid counts about 5 uses and that uses in Arena and Onslaught count too. A running Home Screen Event SHALL rank these raids as it ranks any HRE raids.

#### Scenario: Mission 15

- **GIVEN** mission 15 with 0 of 150 ability uses
- **THEN** 30 raids on 5-slot nodes are suggested

#### Scenario: Almost done

- **GIVEN** mission 15 with 148 of 150 ability uses
- **THEN** 1 raid is suggested
