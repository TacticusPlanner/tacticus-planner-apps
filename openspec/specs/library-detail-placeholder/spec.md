# Library Detail Placeholder Specification

## Purpose

Defines what a Library collection page shows once its entity records have
loaded but the collection has no real detail view built yet, so the page
reads as an honest "not available yet" state rather than a picker that
leads nowhere.

## Requirements

### Requirement: Machines of War shows a placeholder instead of an entity picker

For the Machines of War Library collection, which has no detail view implemented, once its entity records have loaded and at least one record exists, the page SHALL show a static placeholder message naming the collection rather than an interactive entity picker or any per-entity "selected" acknowledgment. The placeholder SHALL NOT offer an action that appears to select or open a specific entity. NPCs are not covered by this requirement: `/library/npcs` renders the NPC Library page (see the `npc-library` capability).

#### Scenario: Machines of War shows its placeholder once records load

- **GIVEN** the Machines of War catalog has at least one record
- **WHEN** a user opens `/library/machines-of-war`
- **THEN** the page shows a placeholder message naming Machines of War, with no entity picker and no per-entity selection control

#### Scenario: NPCs do not show the placeholder

- **GIVEN** the NPC catalog has at least one listable record
- **WHEN** a user opens `/library/npcs`
- **THEN** the NPC Library page renders (redirecting to the first listed NPC per the Library route contract) and no placeholder message is shown

#### Scenario: Loading and empty states are unaffected

- **GIVEN** a Machines of War collection whose records are still loading, or whose catalog has zero records
- **WHEN** the page renders
- **THEN** it shows the existing loading or no-records state respectively, not the placeholder — the placeholder only applies once records have loaded and at least one exists
