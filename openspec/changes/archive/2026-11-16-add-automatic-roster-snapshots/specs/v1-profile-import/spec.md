## ADDED Requirements

### Requirement: The import offers a roster snapshots part

The V1 import dialog SHALL offer a "Roster snapshots" part, off by default. Its description SHALL say that V1 snapshots are copied newest first up to the 20-snapshot limit, and that snapshots in V1's trash are not copied. After the import, the part SHALL show its status and reason like the other parts. It SHALL group per-snapshot outcomes into Imported, Already imported, Over the limit, In V1 trash and Failed, each with a count and expandable to snapshot names and dates. A snapshot with dropped units SHALL show "<n> units not recognised". Every outcome code SHALL have translated copy.

#### Scenario: Partial import over the limit

- **GIVEN** a user with 18 V2 snapshots and 5 live V1 snapshots
- **WHEN** they import with Roster snapshots selected
- **THEN** the part shows Imported 2 and Over the limit 3, and expanding Over the limit lists the three oldest V1 snapshots

#### Scenario: Not selected

- **WHEN** the user imports without selecting Roster snapshots
- **THEN** the part shows as not selected and no snapshots are created
