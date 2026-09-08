## MODIFIED Requirements

### Requirement: Shared team presentation

Each recommended team SHALL identify every character by in-game name and
portrait resolved through the shared catalog and translations, SHALL show each
character's current rarity and rank, and SHALL present members as a single
vertical list (one character per row). The rarity icon, the rank icon, and the
Random team's lock toggle SHALL each expose their meaning as a hover/focus
tooltip. For each character the team SHALL convey why it was chosen — the
rationale supplied by the winning priority pool, which MAY identify the
character as the target of an active Onslaught Ascension goal, or that it was
chosen for combat strength, added to meet the minimum size, or drawn at random.

When a preference filter is active (a preferred trait, a preferred damage type,
or both), every row SHALL show a marker for each active preference: an emphasised
marker with that attribute's icon on a character that satisfies it, and a
visually distinct, de-emphasised marker with the same icon on a character that
does not. Each marker SHALL name its meaning — satisfied or not satisfied, and
which attribute — as a hover/focus tooltip. When no preference is active, no
preference markers appear on any row.

#### Scenario: Rationale and progression are shown per row

- **WHEN** a character is chosen because it belongs to a priority pool
- **THEN** its row shows that pool's rationale plus the character's rarity and
  rank

#### Scenario: Onslaught Ascend goal reason is shown

- **WHEN** a character is chosen because it belongs to a priority pool whose
  rationale marks it as the target of an active Onslaught Ascension goal
- **THEN** its row conveys that Onslaught Ascend goal reason, distinct from a
  plain project or overall goal reason

#### Scenario: Single column at every viewport

- **WHEN** a team of four or five characters is shown at any viewport
- **THEN** the characters are listed one per row in a single column

#### Scenario: Matching characters are marked when a preference is active

- **WHEN** a preferred trait is active and a team holds both a character with
  that trait and one without
- **THEN** the matching character's row shows the emphasised trait marker and
  the non-matching character's row shows the de-emphasised "does not match"
  trait marker, each with its own tooltip

#### Scenario: No markers without a preference

- **WHEN** no preferred trait or damage type is set
- **THEN** no team row shows a preference marker
