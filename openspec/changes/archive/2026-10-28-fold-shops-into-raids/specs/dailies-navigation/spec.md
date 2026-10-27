## ADDED Requirements

### Requirement: Shops is not a Dailies tab

Dailies SHALL NOT have a Shops primary tab: today's shop recommendations are part of the Raids tab (see `daily-shop-recommendations` "Shop recommendations are a section of the Raids tab"). The primary tabs SHALL be Raids, HSE, HRE, Quest, Guild Raids, in section tabs, the desktop section menu and navigation search. `/dailies/shops` SHALL redirect to `/dailies/raids`, replacing the history entry. This supersedes any statement of the number or order of Dailies primary tabs, and any mention of a Shops tab, elsewhere in this capability.

#### Scenario: Tab order

- **WHEN** a signed-in user opens `/dailies`
- **THEN** the tabs are Raids, HSE, HRE, Quest, Guild Raids, and Raids is active

#### Scenario: Old Shops link

- **WHEN** a user opens `/dailies/shops` (for example from a bookmark)
- **THEN** they land on `/dailies/raids`, which shows today's shop recommendations
