## Purpose

Provide stable, shareable Library URLs for browsing a collection and opening a
specific game entity without using query parameters as the entity identity.

## ADDED Requirements

### Requirement: Library exposes canonical collection and entity routes

The application SHALL expose the public Library collections at
`/library/characters`, `/library/machines-of-war`, `/library/npcs`, and
`/library/raid-bosses`. Each collection SHALL accept a selected stable entity
ID as its sole optional path segment, at
`/{collection}/{entityId}`. The former `/lookup` paths and the `character`
query parameter SHALL NOT be supported as canonical Library URLs.

#### Scenario: Character entity URL is opened directly

- **WHEN** a user opens `/library/characters/bellator?tab=abilities&rarity=legendary`
- **THEN** the Characters Library view selects `bellator` and retains `tab` and
  `rarity` as secondary state

#### Scenario: Each supported collection accepts an entity ID

- **WHEN** a user opens a valid entity URL under Characters, Machines of War,
  NPCs, or Raid Bosses
- **THEN** the corresponding Library view opens with the entity identified by
  that path segment selected

#### Scenario: Legacy Lookup URL is not canonical

- **WHEN** a user opens a former `/lookup/...` URL or a Library URL containing
  `character` as a query parameter
- **THEN** the application does not treat that legacy path or query parameter
  as the selected Library entity

### Requirement: Collection routes resolve an initial selection safely

When a Library collection route is opened without an entity ID and the
collection has available records, the application SHALL replace it with the
canonical URL for the first available entity. While records are loading, it
SHALL not select or navigate to an arbitrary ID. When the collection has no
available records, it SHALL remain on the collection URL and present the
collection's no-records state rather than fabricating a selection.

#### Scenario: Characters collection selects its first available entity

- **WHEN** a user opens `/library/characters` after the Characters collection
  is available
- **THEN** the browser is redirected to
  `/library/characters/{firstAvailableCharacterId}`

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

### Requirement: Entity-selection navigation keeps secondary state intact

Selecting an entity in a Library collection SHALL update the selected entity
path segment while preserving every secondary query parameter. A control that
clears a selection SHALL first navigate to the collection URL with those
secondary parameters preserved; if that collection has records, the collection
route's initial-selection rule then applies. Browser refresh, bookmarks, shared
links, and back/forward navigation SHALL resolve selection from the URL.

#### Scenario: Selecting an entity updates only the path identity

- **WHEN** a user selects `calgar` while viewing
  `/library/characters/bellator?rank=gold-1&tab=upgrades`
- **THEN** the URL becomes
  `/library/characters/calgar?rank=gold-1&tab=upgrades`

#### Scenario: Clearing a selection returns through the collection URL

- **WHEN** a user clears the selected entity while secondary query parameters
  are present
- **THEN** navigation targets the corresponding collection URL with those
  parameters preserved, after which the collection's initial-selection rule is
  applied if records exist

#### Scenario: Browser history restores selection

- **WHEN** a user navigates between two Library entity URLs and uses browser
  back or forward
- **THEN** the selected entity and secondary query state match the URL reached
  by history navigation
