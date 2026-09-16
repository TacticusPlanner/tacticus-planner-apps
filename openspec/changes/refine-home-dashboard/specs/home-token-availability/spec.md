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

Regeneration is computed client-side from the last-synced snapshot (`current`, `max`, `nextTokenInSeconds`, `regenDelayInSeconds`, and the sync timestamp) rather than re-fetched continuously, so elapsed time since sync must be projected forward.

Assumptions:

- Each token type's `max` and `regenDelayInSeconds` are per-type values from the player's synced data, not fixed constants shared across token types.
- Guild Raid reports two independently-regenerating buckets under one game mode: raid tokens and Bomb tokens.

#### Scenario: Token below max counts down to its next regeneration

- **GIVEN** a token bucket last synced with `current: 3`, `max: 5`, `nextTokenInSeconds: 1200`, `regenDelayInSeconds: 3600`, and the sync occurred 4500 seconds ago
- **WHEN** Token Availability computes that token's current state
- **THEN** one token has already regenerated since sync (at the 1200s mark), the projected count is 4/5, and the countdown to the 5th (capping) token shows 300 seconds remaining — derived as: `1200 (first regen) + 3600 (regen delay) − 4500 (elapsed) = 300`

#### Scenario: Token at max shows a capped indicator

- **GIVEN** a token bucket whose projected current count equals its max
- **WHEN** Token Availability renders that token's card
- **THEN** it shows a capped indicator instead of a countdown

#### Scenario: Token type missing from synced data

- **GIVEN** `gameModeTokens` has no data for a given token type (`null`)
- **WHEN** Token Availability renders
- **THEN** no card is rendered for that token type

### Requirement: Stale capped data prompts a sync

When a token's projected count is at max and the last sync happened more than 5 minutes ago, the widget SHALL show a banner explaining the data may be stale with an action that triggers the existing player-data sync.

#### Scenario: Capped token with a stale sync

- **GIVEN** a token's projected count is at its max and the account was last synced 6 minutes ago
- **WHEN** Token Availability renders
- **THEN** it shows a stale-data banner with a sync action

#### Scenario: Recently synced capped token

- **GIVEN** a token's projected count is at its max and the account was synced 2 minutes ago
- **WHEN** Token Availability renders
- **THEN** no stale-data banner is shown for that token

### Requirement: Distinct loading, failure, and empty states

The widget SHALL present a distinct state for each of: player data still loading, player data failed to load, and no token data available for the account at all.

#### Scenario: Player data is loading

- **WHEN** the player's synced data has not yet loaded
- **THEN** Token Availability shows a loading state rather than an empty or partially-rendered row of cards

#### Scenario: Player data fails to load

- **WHEN** the player's synced data fails to load
- **THEN** Token Availability shows an explicit failure state

#### Scenario: No token data on the account

- **WHEN** the player's synced data has loaded but `gameModeTokens` has no data for any token type
- **THEN** Token Availability shows an explicit empty state rather than an empty row
