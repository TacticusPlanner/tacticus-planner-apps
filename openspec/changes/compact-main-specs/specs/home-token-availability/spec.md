## MODIFIED Requirements

### Requirement: Home page renders Token Availability as its first section

The authenticated home page SHALL render a Token Availability section, sourced from the player's synced `gameModeTokens` data, as the first section on the page — above Your Projects, Daily Raids, and the events calendar — full width on mobile; on desktop it shares its row with the Home Screen Events card (see `home-events-widget` "Home renders a Home Screen Events card beside Token Availability").

#### Scenario: Authenticated user opens home on desktop

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** the Token Availability section renders first, above the other home sections

#### Scenario: Authenticated user opens home on mobile

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** the Token Availability section renders first among the stacked home sections

### Requirement: Each token card shows its per-type icon, with a distinct capped treatment

Each token card SHALL show that token type's icon alongside its label and count. A capped token (`current === max`) SHALL be visually distinguished from a counting-down one: its icon SHALL use a pulsing/glowing treatment and its status text SHALL use a distinct, attention-drawing style, rather than the same muted styling as a counting-down token.

No informational or sync-prompting banner is shown for stale or capped data; the widget only reflects the last-synced snapshot.

#### Scenario: Capped token gets a distinct visual treatment

- **GIVEN** a token's projected count equals its max
- **WHEN** Token Availability renders that token's card
- **THEN** its icon uses the pulsing/glowing capped treatment and its status text uses the distinct capped styling

#### Scenario: Counting-down token uses the plain treatment

- **GIVEN** a token's projected count is below its max
- **WHEN** Token Availability renders that token's card
- **THEN** its icon and countdown text use the plain (non-capped) styling

## REMOVED Requirements

### Requirement: Token Availability shares its row with the Home Screen Events card

**Reason**: D28 — restates `home-events-widget` "Home renders a Home Screen Events card beside Token Availability" (same row, wrapping and mobile stacking); its "This supersedes…" sentence is a change leftover.

**Migration**: `home-events-widget` "Home renders a Home Screen Events card beside Token Availability".
