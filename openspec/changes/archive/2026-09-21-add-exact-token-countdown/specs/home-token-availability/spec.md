## MODIFIED Requirements

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
