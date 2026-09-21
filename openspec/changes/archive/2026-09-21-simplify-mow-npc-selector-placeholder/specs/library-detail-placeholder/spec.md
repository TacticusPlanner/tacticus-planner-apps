## Purpose

Defines what a Library collection page shows once its entity records have
loaded but the collection has no real detail view built yet, so the page
reads as an honest "not available yet" state rather than a picker that
leads nowhere.

## ADDED Requirements

### Requirement: Collections without a detail view show a placeholder instead of an entity picker

For a Library collection that has no detail view implemented (Machines of
War, NPCs), once that collection's entity records have loaded and at least
one record exists, the page SHALL show a static placeholder message naming
the collection rather than an interactive entity picker or any
per-entity "selected" acknowledgment. The placeholder SHALL NOT offer an
action that appears to select or open a specific entity.

#### Scenario: Machines of War shows its placeholder once records load

- **GIVEN** the Machines of War catalog has at least one record
- **WHEN** a user opens `/library/machines-of-war`
- **THEN** the page shows a placeholder message naming Machines of War,
  with no entity picker and no per-entity selection control

#### Scenario: NPCs shows its placeholder once records load

- **GIVEN** the NPC catalog has at least one record
- **WHEN** a user opens `/library/npcs`
- **THEN** the page shows a placeholder message naming NPCs, with no
  entity picker and no per-entity selection control

#### Scenario: Loading and empty states are unaffected

- **GIVEN** a Machines of War or NPC collection whose records are still
  loading, or whose catalog has zero records
- **WHEN** the page renders
- **THEN** it shows the existing loading or no-records state respectively,
  not the new placeholder — the placeholder only applies once records have
  loaded and at least one exists
