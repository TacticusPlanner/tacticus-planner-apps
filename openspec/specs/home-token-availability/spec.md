# home-token-availability Specification

## Purpose

Shows the player's current game-mode token status (Arena, Guild Raid plus Bomb tokens, Onslaught, Salvage Run) with regen countdowns and capped/over-cap state, so they can tell at a glance whether they're wasting capped tokens without leaving the home page.

## Requirements

### Requirement: Home page renders Token Availability as its first section

The authenticated home page SHALL render Token Availability, sourced from the player's synced `gameModeTokens` data, inside the Right now card, which is the page's first card (see `home-events-widget` "Home renders Right now and Upcoming events cards"). At or above the `lg` breakpoint the tokens and the live events sit side by side inside Right now; below it, the tokens come first and the live events follow.

#### Scenario: Authenticated user opens home on desktop

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** Token Availability renders inside Right now, above every other home card

#### Scenario: Authenticated user opens home on mobile

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** Token Availability renders first inside Right now, before the live events

### Requirement: Each available token type shows current count and regen state

For each token type present in `gameModeTokens` (Arena, Guild Raid, Bomb, Onslaught, Salvage Run), the widget SHALL show that token's current/max count and either a countdown to its next regeneration or a capped indicator when it is at max. A token type absent from `gameModeTokens` (e.g. `null`) SHALL NOT render a card.

The countdown is anchored to the player-data snapshot's observation time (when the account was last synced), not re-projected across multiple elapsed regeneration intervals: `current` is shown exactly as last synced, and the countdown targets only the next token due from that snapshot (`observedAt + nextTokenInSeconds`). This deliberately does not guess a higher current count from elapsed time the way multi-interval client-side projection would — it mirrors the existing `resourceCountdown` pattern this codebase already uses for Guild Raid's own token countdowns (`pages/dailies/ui/guild-raids/guild-raid-countdowns.ts`), chosen over the alternative for consistency with that established, deliberate convention.

The countdown to the next regeneration SHALL be shown as an exact duration in `h:mm:ss` format (hours unbounded and unpadded, minutes and seconds zero-padded to two digits), not a rounded relative-time phrase. It SHALL update at least once per second so the displayed value visibly ticks down in real time rather than jumping in coarser steps.

Assumptions:

- Each token type's `max` and `regenDelayInSeconds` are per-type values from the player's synced data, not fixed constants shared across token types.
- Guild Raid reports two independently-regenerating buckets under one game mode: raid tokens and Bomb tokens.

#### Scenario: Token below max counts down to its next regeneration

- **GIVEN** a token bucket last synced (observed) with `current: 3`, `max: 5`, `nextTokenInSeconds: 1200`, and the sync occurred 300 seconds ago
- **WHEN** Token Availability computes that token's current state
- **THEN** it shows the count as 3/5 (unchanged from the synced snapshot) with an exact countdown of `0:15:00` to the next token — derived as: `1200 (seconds until next token, as of the snapshot) − 300 (elapsed since that snapshot) = 900 seconds = 0:15:00`

#### Scenario: Countdown ticks down second by second

- **GIVEN** a token counting down with a displayed value of `0:15:00`
- **WHEN** one second of real time elapses
- **THEN** the displayed countdown updates to `0:14:59`

#### Scenario: A countdown of an hour or more shows an unpadded, unbounded hours component

- **GIVEN** a token whose next regeneration is 27 hours, 15 minutes, and 3 seconds away
- **WHEN** Token Availability renders that token's countdown
- **THEN** it shows `27:15:03`, not a value that wraps, truncates, or omits the hours component

#### Scenario: Token at max shows a capped indicator

- **GIVEN** a token bucket whose projected current count equals its max
- **WHEN** Token Availability renders that token's card
- **THEN** it shows a capped indicator instead of a countdown

#### Scenario: Token type missing from synced data

- **GIVEN** `gameModeTokens` has no data for a given token type (`null`)
- **WHEN** Token Availability renders
- **THEN** no card is rendered for that token type

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

### Requirement: Distinct loading, failure and empty states

The widget SHALL present a distinct state for each of: player data still loading, a failed local read (the shared failure presentation with Retry, per `local-data-read-state`), and no token data available for the account at all.

#### Scenario: Player data is loading

- **WHEN** the player's synced data has not yet loaded
- **THEN** Token Availability shows a loading state rather than an empty or partially-rendered row of cards

#### Scenario: No token data on the account

- **WHEN** the player's synced data has loaded but `gameModeTokens` has no data for any token type
- **THEN** Token Availability shows an explicit empty state rather than an empty row

#### Scenario: Local read fails

- **WHEN** the local read of the player's synced data fails or times out
- **THEN** Token Availability shows the shared read-failure state with a Retry that re-issues the read, not the empty state
