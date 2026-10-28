## MODIFIED Requirements

### Requirement: Home page renders Token Availability as its first section

The authenticated home page SHALL render Token Availability, sourced from the player's synced `gameModeTokens` data, inside the Right now card, which is the page's first card (see `home-events-widget` "Home renders Right now and Upcoming events cards"). At or above the `lg` breakpoint the tokens and the live events sit side by side inside Right now; below it, the tokens come first and the live events follow.

#### Scenario: Authenticated user opens home on desktop

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** Token Availability renders inside Right now, above every other home card

#### Scenario: Authenticated user opens home on mobile

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** Token Availability renders first inside Right now, before the live events

### Requirement: Each token card shows its per-type icon, with a distinct capped treatment

Each token SHALL render as a compact ring meter: its per-type icon inside a ring filled in proportion to `current / max`, with the label, `current/max` and the countdown or "Capped" beneath. Capped tokens (`current >= max`) SHALL be listed first, keeping their relative order. A capped token SHALL be distinguished by a destructive-coloured full ring and a destructive-styled "Capped" label; nothing SHALL pulse or animate.

No informational or sync-prompting banner is shown for stale or capped data; the widget only reflects the last-synced snapshot.

#### Scenario: Capped token gets a distinct visual treatment

- **GIVEN** Arena is at 5/5 and Onslaught at 2/10
- **WHEN** Token Availability renders
- **THEN** Arena is listed first with a full destructive ring and "Capped", and Onslaught follows with a 20% ring (2 ÷ 10) and its countdown

#### Scenario: Counting-down token uses the plain treatment

- **GIVEN** a token's projected count is below its max
- **WHEN** Token Availability renders that token
- **THEN** its ring uses the primary colour and its countdown the plain text style, and no element animates
