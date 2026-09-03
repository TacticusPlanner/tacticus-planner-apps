## Purpose

Ensure the Characters Library always starts a lookup with an attainable,
non-empty rank and progression range while respecting a player's state and
explicit selection choices.

## ADDED Requirements

### Requirement: Character Lookup derives an advancing default range

When a Characters Library lookup has no complete, valid URL-backed range, the
application SHALL derive both ranges from the applicable starting state. Each
derived range SHALL span at least one attainable step: the target rank SHALL
be the next rank when possible, and the target progression SHALL be at least
the next progression step and high enough to make the target rank attainable.

#### Scenario: A new lookup uses the base progression path

- **WHEN** a user opens a Character Library entity without a complete valid
  range in the URL and without applicable player data
- **THEN** the lookup starts at the first rank and progression, ends at the
  next rank, and ends at the first progression step that is both later than
  the start and compatible with that target rank

#### Scenario: A progression boundary is needed for the next rank

- **WHEN** a derived target rank is unavailable at the next progression step
- **THEN** the progression target advances to the earliest later progression
  that supports the target rank

### Requirement: Synced character data seeds an advancing lookup range

For an authenticated user whose selected character has synced rank and
progression data, the application SHALL use that data as the derived range
start and calculate a compatible advancing target. It SHALL apply this seed at
most once for each character selection after the relevant player record has
loaded.

#### Scenario: A selected owned character has another attainable step

- **WHEN** the selected character's synced record is available and neither an
  explicit URL range nor a user edit takes precedence
- **THEN** the controls start at that character's synced rank and progression
  and show an advancing target range

#### Scenario: Switching to another owned character refreshes the seed

- **WHEN** the user selects another character with a distinct synced record
- **THEN** the application derives the new range from that character's own
  synced state once its record is available

### Requirement: Maximum values retain a meaningful range

When the applicable starting rank or progression is already at its maximum,
the application SHALL keep that maximum as the corresponding target and move
the corresponding range start back one attainable step. It SHALL preserve
rank/progression compatibility after applying that fallback.

#### Scenario: A character is at maximum rank

- **WHEN** a derived range starts at the maximum rank
- **THEN** the rank range starts at the preceding rank and ends at the maximum
  rank

#### Scenario: A character is at maximum progression

- **WHEN** a derived range starts at the maximum progression
- **THEN** the progression range starts at the preceding progression step and
  ends at the maximum progression

### Requirement: Explicit or edited range choices take precedence

The application SHALL preserve a complete, valid URL-backed range and a
user-edited draft range. Late catalog or synced-player updates SHALL NOT
replace either choice. Rank and progression defaults are shared state, so the
same values SHALL be rendered by the desktop and mobile Character Lookup
controls.

#### Scenario: A shared URL supplies ranges

- **WHEN** a user opens a Character Library URL with complete, valid rank and
  progression ranges
- **THEN** the controls and calculation retain those URL values instead of
  substituting derived player or catalog defaults

#### Scenario: A user edits while player data is loading

- **WHEN** a user changes a draft range before the selected character's synced
  record resolves
- **THEN** the eventual player-data result does not overwrite the user's
  edited range

#### Scenario: The same state is rendered on desktop and mobile

- **WHEN** a user opens or changes a Character Lookup range at either viewport
- **THEN** the desktop and mobile control variants render the same derived or
  preserved values
