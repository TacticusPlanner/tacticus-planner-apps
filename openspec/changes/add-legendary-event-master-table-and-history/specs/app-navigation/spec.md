# Spec Delta

## ADDED Requirements

### Requirement: The Legendary Events section has Master table and Tier List children

The Legendary Events section SHALL list two more static children, **Master table** at `/legendary-events/master-table` and **Tier List** at `/legendary-events/tier-list`, in that order directly after All events and before the per-event children, each with a localized label and description in every supported locale, an icon (table-style and ranking-style), indexing by navigation search, and the section's header, breadcrumb, document-title and last-visited-child rules. Each path SHALL activate its own child and SHALL NOT be treated as an event id. Both children SHALL be listed while the catalog read is pending or failed, like All events.

#### Scenario: Secondary nav order

- **GIVEN** Uthar active and Lysander and Farsight upcoming
- **WHEN** the Legendary Events section renders
- **THEN** its children read All events, Master table, Tier List, Uthar, then the upcoming events in hub order

#### Scenario: Catalog pending

- **WHEN** the catalog read is pending or failed
- **THEN** the children read All events, Master table, Tier List

#### Scenario: Search finds the master table

- **WHEN** the user types "master" in navigation search
- **THEN** Master table is found and opens `/legendary-events/master-table`; typing "tier" finds Tier List
