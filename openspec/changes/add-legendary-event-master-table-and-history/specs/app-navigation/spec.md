# Spec Delta

## ADDED Requirements

### Requirement: The Legendary Events section has a Master table child

The Legendary Events section SHALL list a second static child, **Master table** at `/legendary-events/master-table`, directly after All events and before the per-event children, with a localized label and description in every supported locale, a table-style icon, indexing by navigation search, and the section's header, breadcrumb, document-title and last-visited-child rules. `/legendary-events/master-table` SHALL activate the Master table child and SHALL NOT be treated as an event id. The child SHALL be listed while the catalog read is pending or failed, like All events.

#### Scenario: Secondary nav order

- **GIVEN** Uthar active, Lysander upcoming and Dante archived
- **WHEN** the Legendary Events section renders
- **THEN** its children read All events, Master table, Uthar, Lysander, Dante

#### Scenario: Catalog pending

- **WHEN** the catalog read is pending or failed
- **THEN** the children read All events, Master table

#### Scenario: Search finds the master table

- **WHEN** the user types "master" in navigation search
- **THEN** Master table is found and opens `/legendary-events/master-table`
