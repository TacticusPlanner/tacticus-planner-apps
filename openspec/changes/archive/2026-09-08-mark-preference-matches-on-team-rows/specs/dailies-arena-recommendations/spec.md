## MODIFIED Requirements

### Requirement: Team presentation and rationale

Each recommended team SHALL identify every character by its in-game name and
portrait, resolved from the character id through the shared catalog and
translations used elsewhere in the app, and SHALL show each character's current
rarity and rank. The rarity icon, the rank icon, and the Random Team's lock
toggle SHALL each expose their meaning as a text label on hover/focus (a
tooltip), so the icon-only presentation stays legible. For each selected
character the team SHALL convey why it was chosen — the active goal(s) or
project it contributes to, that it was chosen for combat strength, that it was
included to meet the minimum team size, or that it was drawn at random. Team
members SHALL be presented as a single vertical list (one character per row).

When a Preferred trait or Preferred damage type is selected, each row SHALL show
a marker on the characters that match it — the preferred trait's icon on a
character with that trait, the preferred damage type's icon on a character that
deals that damage type — each with a hover/focus tooltip naming what it matches.
No marker is shown for characters that do not match, or when no preference is
set.

#### Scenario: Contributing character shows its rationale

- **WHEN** a character is selected because it is the target of an active goal
- **THEN** the team entry for that character references that goal (or its
  project) and shows the character's rarity and rank

#### Scenario: Filler character shows a neutral rationale

- **WHEN** a character is selected only to reach the three-character minimum
- **THEN** the team entry for that character indicates it was added to meet the
  minimum team size rather than referencing a goal

#### Scenario: Team is a single column

- **WHEN** a recommended team of four or five characters is shown at any
  viewport
- **THEN** the characters are listed one per row in a single column

#### Scenario: Icon controls carry a tooltip

- **WHEN** the player hovers or focuses a team row's rarity icon, rank icon, or
  the Random Team's lock toggle
- **THEN** a tooltip names the rarity, the rank, or the lock/unlock action
  respectively

#### Scenario: Preferred-attribute matches are marked on the rows

- **WHEN** the player selects a Preferred trait and a team includes both a
  character with that trait and a character without it
- **THEN** the matching character's row shows the preferred trait's icon with a
  tooltip, and the non-matching character's row shows no such marker
