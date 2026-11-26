## ADDED Requirements

### Requirement: Navigation search finds game entities

Desktop navigation search and mobile Menu search SHALL also match game entities from the synced game catalog: characters, Machines of War, NPCs (one per name, as the NPC Library lists them), guild raid bosses and primes, and, for a visitor who can open Legendary Events, Legendary Events. Entities SHALL match from two typed characters, by their localized name and the other names players use for them, with the page ranking. Each kind SHALL be its own group, headed by its Library collection's name, listing at most 5 entities with their portrait, best match first. Groups SHALL be ordered with the action and page groups by their best match, actions then pages then entities on a tie. Opening an entity SHALL open its page. An entity whose page the menu already lists (a running Legendary Event) SHALL NOT be listed again. A catalog dataset that has not synced SHALL add nothing.

#### Scenario: A unit name finds the unit

- **WHEN** a user searches for "ragnar"
- **THEN** a Characters group lists Ragnar, and choosing it opens `/library/characters/<id>`

#### Scenario: Raid bosses and NPCs

- **WHEN** a user searches for "belis"
- **THEN** an NPCs group lists Belisarius Cawl and a Guild Raid Bosses group lists Belisarius

#### Scenario: One letter lists no entities

- **WHEN** a user types one letter
- **THEN** no entity group is listed

### Requirement: A unit result leads to a goal or Collection

When a character or Machine of War matches, the group of the best matching unit SHALL end with "Create goal for <unit>", for a visitor who can create goals, and "Find '<query>' in Collection", for a visitor who can open Collection. The unit's page SHALL stay above them, so Enter opens it. "Create goal for <unit>" SHALL open the new goal form with that unit selected, after search closes, as Create goal does. "Find '<query>' in Collection" SHALL open Collection filtered by the query.

#### Scenario: Create a goal for the unit found

- **WHEN** a signed-in user searches for "calgar" and chooses "Create goal for Calgar"
- **THEN** search closes and the new goal form opens with Calgar selected

#### Scenario: Hand off to Collection

- **WHEN** a user searches for "calgar" and chooses "Find “calgar” in Collection"
- **THEN** Collection opens with its search set to "calgar"

### Requirement: The open unit's page puts its goal first

On a character's or Machine of War's Library page, with an empty query, navigation search SHALL list "Create goal for <unit>" first among the quick actions (first among the phone's chips), for a visitor who can create goals.

#### Scenario: Goal for the unit on its page

- **WHEN** a signed-in user opens navigation search on Bellator's Library page
- **THEN** the first quick action is "Create goal for Bellator"

### Requirement: Navigation search ignores accents

Navigation search SHALL match pages, actions and entities without regard to accents.

#### Scenario: Accent-free query

- **WHEN** a user searches for "uthar"
- **THEN** Ûthar is found
