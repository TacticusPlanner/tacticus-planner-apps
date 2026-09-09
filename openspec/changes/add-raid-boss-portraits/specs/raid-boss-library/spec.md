## MODIFIED Requirements

### Requirement: The Raid Bosses list shows Bosses and Primes as two sections

The `/library/raid-bosses` page SHALL render two labelled sections — **Bosses** and **Primes** — each listing its entities in the catalog's served order, showing each entity's resolved portrait and resolved name. The portrait is the round portrait resolved from the entity's `unitSetId` (see `raid-boss-catalog`); when no portrait asset resolves, a readable initials badge is shown in its place. It is a public page: it SHALL render for anonymous and signed-in users alike, without gating behind authentication, and SHALL not depend on any signed-in user data.

#### Scenario: Both sections render

- **WHEN** an anonymous user opens `/library/raid-bosses` after the dataset has synced
- **THEN** a Bosses section and a Primes section are shown, each populated with the served entities in order, each entity showing its portrait or an initials-badge fallback

#### Scenario: Selecting an entity opens its detail

- **WHEN** the user activates a boss or prime entry in either section
- **THEN** the app navigates to `/library/raid-bosses/{unitSetId}` and the detail view for that entity is shown

#### Scenario: Primes are browsable in their own right

- **WHEN** the user selects a prime from the Primes section
- **THEN** its detail view opens the same way a boss's does — primes are first-class entities, not a sub-view of a boss

#### Scenario: Field enemies show an icon

- **WHEN** the detail's field-enemy list renders an enemy whose portrait resolves (via `questUnitId` or the npc portrait map)
- **THEN** that enemy is shown with its portrait icon; an enemy with no resolvable asset shows a badge or plain name, never a broken image
