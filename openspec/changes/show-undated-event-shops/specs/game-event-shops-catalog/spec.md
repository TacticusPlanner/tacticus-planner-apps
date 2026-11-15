## ADDED Requirements

### Requirement: Undated events are stored and ordered last

A served event whose `startUtc` and `definitionId` are null (the game data has it, the calendar has not dated it) SHALL pass schema validation and be stored like any other event. Event shop queries SHALL order dated events by `startUtc` ascending, then undated ones. Event day helpers SHALL accept only dated events; the package SHALL expose a type guard that tells a dated event from an undated one.

#### Scenario: Undated event is stored

- **WHEN** a sync includes `january-2027` with `startUtc` null and `definitionId` null
- **THEN** the store holds it and the event shop query returns it after every dated event
