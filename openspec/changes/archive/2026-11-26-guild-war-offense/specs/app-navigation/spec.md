## ADDED Requirements

### Requirement: Section children can be grouped

A section's children MAY name a group with its own label key. The desktop section menu and the phone drawer SHALL show a group's label (sentence case, small muted text) above its first child. The page tabs under the header SHALL list only the children of the active child's group. A section with no groups is unchanged.

The Guild section SHALL have two groups: **Guild** (Members, Settings), which needs a registered guild, and **Guild War** (Offense at `/guild/war/offense`, History at `/guild/war/history`), which needs only sign-in. The guild access boundary SHALL wrap only the Guild group's routes.

#### Scenario: Tabs show one group

- **WHEN** a user opens `/guild/war/offense`
- **THEN** the page tabs are Offense and History, and the section menu shows the Guild and Guild War labels above their items
