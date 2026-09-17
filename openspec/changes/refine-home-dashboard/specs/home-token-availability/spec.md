## Purpose

Shows the player's current game-mode token status (Arena, Guild Raid plus Bomb tokens, Onslaught, Salvage Run) with regen countdowns and capped/over-cap state, so they can tell at a glance whether they're wasting capped tokens without leaving the home page.

## ADDED Requirements

### Requirement: Home page renders Token Availability as its first section

The authenticated home page SHALL render a Token Availability section, sourced from the player's synced `gameModeTokens` data, as the first section on the page — above Your Projects, Daily Raids, and the events calendar — full width on both desktop and mobile.

#### Scenario: Authenticated user opens home on desktop

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** the Token Availability section renders first, full width, above the other home sections

#### Scenario: Authenticated user opens home on mobile

- **WHEN** a signed-in user opens `/home` below the 768px breakpoint
- **THEN** the Token Availability section renders first among the stacked home sections

### Requirement: Each available token type shows current count and regen state

For each token type present in `gameModeTokens` (Arena, Guild Raid, Bomb, Onslaught, Salvage Run), the widget SHALL show that token's current/max count and either a countdown to its next regeneration or a capped indicator when it is at max. A token type absent from `gameModeTokens` (e.g. `null`) SHALL NOT render a card.

The countdown is anchored to the player-data snapshot's observation time (when the account was last synced), not re-projected across multiple elapsed regeneration intervals: `current` is shown exactly as last synced, and the countdown targets only the next token due from that snapshot (`observedAt + nextTokenInSeconds`). This deliberately does not guess a higher current count from elapsed time the way multi-interval client-side projection would — it mirrors the existing `resourceCountdown` pattern this codebase already uses for Guild Raid's own token countdowns (`pages/dailies/ui/guild-raids/guild-raid-countdowns.ts`), chosen over the alternative for consistency with that established, deliberate convention.

Assumptions:

- Each token type's `max` and `regenDelayInSeconds` are per-type values from the player's synced data, not fixed constants shared across token types.
- Guild Raid reports two independently-regenerating buckets under one game mode: raid tokens and Bomb tokens.

#### Scenario: Token below max counts down to its next regeneration

- **GIVEN** a token bucket last synced (observed) with `current: 3`, `max: 5`, `nextTokenInSeconds: 1200`, and the sync occurred 300 seconds ago
- **WHEN** Token Availability computes that token's current state
- **THEN** it shows the count as 3/5 (unchanged from the synced snapshot) with a countdown to the next token in 900 seconds — derived as: `1200 (seconds until next token, as of the snapshot) − 300 (elapsed since that snapshot) = 900`

#### Scenario: Token at max shows a capped indicator

- **GIVEN** a token bucket whose projected current count equals its max
- **WHEN** Token Availability renders that token's card
- **THEN** it shows a capped indicator instead of a countdown

#### Scenario: Token type missing from synced data

- **GIVEN** `gameModeTokens` has no data for a given token type (`null`)
- **WHEN** Token Availability renders
- **THEN** no card is rendered for that token type

### Requirement: Each token card shows its per-type icon, with a distinct capped treatment

Each token card SHALL show that token type's icon alongside its label and count. A capped token (`current === max`) SHALL be visually distinguished from a counting-down one: its icon SHALL use a pulsing/glowing treatment and its status text SHALL use a distinct, attention-drawing style, rather than the same muted styling as a counting-down token.

Implementation note: no informational or sync-prompting banner is shown for stale/capped data. `pages/home` cannot import the app shell's sync-status/trigger context (it lives in the `app` layer, which this repo's FSD layering forbids a page from importing), and duplicating that provider's auth/coalescing logic at a lower layer was judged out of scope for this widget. The existing app-shell sync control (now inside the sidebar's user menu) remains the way to trigger a sync; this widget only reflects the last-synced snapshot's data.

#### Scenario: Capped token gets a distinct visual treatment

- **GIVEN** a token's projected count equals its max
- **WHEN** Token Availability renders that token's card
- **THEN** its icon uses the pulsing/glowing capped treatment and its status text uses the distinct capped styling

#### Scenario: Counting-down token uses the plain treatment

- **GIVEN** a token's projected count is below its max
- **WHEN** Token Availability renders that token's card
- **THEN** its icon and countdown text use the plain (non-capped) styling

### Requirement: Distinct loading and empty states

The widget SHALL present a distinct state for each of: player data still loading, and no token data available for the account at all.

Implementation note: a distinct "failed to load" state is not implemented separately from "no data yet." The data source is a local IndexedDB read (`getLiveProgress`/`getPlayerDataMetadata`, not a network call the widget itself makes), which does not fail the way a network request does; the only load-failure signal that exists (the app shell's sync-status context) lives in the `app` layer, which a page cannot import (see the previous requirement's note). A widget-local read failure is realistically indistinguishable from "never synced yet," so both surface as the empty state.

#### Scenario: Player data is loading

- **WHEN** the player's synced data has not yet loaded
- **THEN** Token Availability shows a loading state rather than an empty or partially-rendered row of cards

#### Scenario: No token data on the account

- **WHEN** the player's synced data has loaded but `gameModeTokens` has no data for any token type
- **THEN** Token Availability shows an explicit empty state rather than an empty row
