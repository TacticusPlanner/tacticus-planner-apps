## MODIFIED Requirements

### Requirement: Shared team presentation

Each recommended team SHALL identify every character by in-game name and
portrait resolved through the shared catalog and translations, SHALL show each
character's current rarity and rank, and SHALL present members as a single
vertical list (one character per row). The rarity icon, the rank icon, and the
Random team's lock toggle SHALL each expose their meaning as a hover/focus
tooltip. For each character the team SHALL convey why it was chosen — the
rationale supplied by the winning priority pool, or that it was chosen for
combat strength, added to meet the minimum size, or drawn at random.

When a preference filter is active (a preferred trait, a preferred damage type,
or both), each row SHALL show a marker on the characters that satisfy it — the
preferred trait's icon on a character with that trait, the preferred damage
type's icon on a character that deals that damage type — each marker exposing
what it matches as a hover/focus tooltip. Rows for characters that do not
satisfy an active preference show no marker for it, and when no preference is
active no markers appear.

#### Scenario: Rationale and progression are shown per row

- **WHEN** a character is chosen because it belongs to a priority pool
- **THEN** its row shows that pool's rationale plus the character's rarity and
  rank

#### Scenario: Single column at every viewport

- **WHEN** a team of four or five characters is shown at any viewport
- **THEN** the characters are listed one per row in a single column

#### Scenario: Matching characters are marked when a preference is active

- **WHEN** a preferred trait is active and a team holds both a character with
  that trait and one without
- **THEN** the matching character's row shows the preferred trait's icon with a
  tooltip naming it, and the non-matching character's row does not

#### Scenario: No markers without a preference

- **WHEN** no preferred trait or damage type is set
- **THEN** no team row shows a preference-match marker
