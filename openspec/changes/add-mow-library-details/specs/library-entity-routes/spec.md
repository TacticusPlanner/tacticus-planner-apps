## MODIFIED Requirements

### Requirement: Collection routes without an entity resolve safely

When a Library collection route is opened without an entity ID, the
Characters collection (`/library/characters`) SHALL show the characters list
page and the Machines of War collection (`/library/machines-of-war`) SHALL show
the Machines of War list page; neither SHALL redirect to an entity. Every other
collection with available records SHALL replace its URL with the canonical URL
for the first available entity. While records are loading, no collection SHALL
select or navigate to an arbitrary ID. When a collection has no available
records, it SHALL remain on the collection URL and present the collection's
no-records state rather than fabricating a selection.

#### Scenario: Characters collection shows the characters list

- **WHEN** a user opens `/library/characters` after the Characters collection
  is available
- **THEN** the URL stays `/library/characters` and the characters list page is
  shown, with each character linking to `/library/characters/{characterId}`

#### Scenario: Machines of War collection shows the Machines of War list

- **WHEN** a user opens `/library/machines-of-war` after the Machines of War
  collection is available
- **THEN** the URL stays `/library/machines-of-war` and the Machines of War list
  page is shown, with each MoW linking to `/library/machines-of-war/{mowId}`

#### Scenario: Another collection selects its first available entity

- **WHEN** a user opens `/library/npcs` after the NPC collection is available
- **THEN** the browser is redirected to `/library/npcs/{firstAvailableNpcId}`

#### Scenario: A collection remains stable while loading

- **WHEN** a user opens a collection route before its entity records have
  finished loading
- **THEN** the application waits for the records before resolving an initial
  entity URL

#### Scenario: A collection has no available records

- **WHEN** a user opens a Library collection route whose catalog has no
  available records
- **THEN** the collection URL remains unchanged and the page communicates that
  no selectable entities are available
