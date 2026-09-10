## Purpose

Shows a guild member the current raid position and personal raid resources needed to make the next daily attack decision, without adding analytics or team scoring.

## ADDED Requirements

### Requirement: Ready guild members see current raid status

The Guild Raids page SHALL request status only after shared guild access is ready. For an active season it SHALL show season number, current boss, zero-based source tier/set as localized one-based labels, difficulty, remaining and maximum HP, progress through the current tier, next boss, current prime modifiers and remaining thresholds, remaining season time when known, observation freshness, and last guild synchronization time.

The app SHALL resolve boss/prime names, portraits, difficulty labels, and modifier descriptions from the raid-boss catalog and localized resources using server-supplied ids. It SHALL not render raw hit history.

#### Scenario: Active raid status loads

- **WHEN** a ready guild member opens Guild Raids and the API returns an active mapped season
- **THEN** the page shows all available current-position fields and no team recommendation section is required by this change

#### Scenario: Season end is unknown

- **WHEN** active status has `endsAt: null`
- **THEN** the page labels the remaining season time as unavailable without hiding the boss status

### Requirement: Current status has distinct desktop and mobile layouts

At or above 768px, the page SHALL present the boss, progression, next-boss, and modifier details in a scan-friendly multi-column status region. Below 768px, it SHALL present one primary boss summary followed by compact progression, next-boss, and expandable modifier sections without horizontal scrolling.

#### Scenario: Desktop status is scannable

- **WHEN** active status is viewed at or above 768px
- **THEN** current boss and the supporting progression/next/modifier details are simultaneously visible in the status region

#### Scenario: Mobile status prioritizes the current boss

- **WHEN** active status is viewed below 768px
- **THEN** the current boss and HP appear before compact secondary details and the page does not require horizontal scrolling

### Requirement: Player raid resources come from the current player's synced data

Below the guild status, the page SHALL show the current player's current/max raid tokens, next-token countdown when below maximum, current/max bomb tokens, and bomb countdown when below maximum. Countdown display SHALL be based on the synced `nextTokenInSeconds` value anchored to the player snapshot observation time; it SHALL never imply a later live value after that snapshot becomes stale.

Assumptions:

- Guild Raid token state comes from the existing player-data `live-progress.gameModeTokens.guildRaid` record.
- `current` and `max` are authoritative at the player snapshot time.
- `nextTokenInSeconds` is omitted from display when the corresponding bucket is full or the source does not provide a usable countdown.
- Player resources are personal and are not derived from guild hit history.

#### Scenario: Player has recharging resources

- **WHEN** synced player data reports raid tokens below maximum and a positive next-token value
- **THEN** the resource section shows the current/max values and a countdown anchored to the snapshot time

#### Scenario: Player resource data is unavailable

- **WHEN** guild status is available but the current player's Guild Raid token record is absent
- **THEN** the status remains visible and the resource section explains that player data must be synchronized

### Requirement: Status refresh preserves useful cached data

The page SHALL show cached status immediately when present, treat status as stale after five minutes, and revalidate stale status automatically. A manual refresh SHALL request forced refresh and SHALL be disabled while that refresh is active so the page cannot issue overlapping refresh actions.

When refresh returns retained stale data, the page SHALL keep it visible with a stale warning and observation time. When refresh fails and no retained status exists, the page SHALL show a retryable error. Manual status refresh SHALL NOT trigger guild roster synchronization or player-data synchronization.

#### Scenario: Cached status becomes stale

- **WHEN** cached status is older than five minutes
- **THEN** the page continues showing it while one background revalidation runs

#### Scenario: Manual refresh is already running

- **WHEN** the user activates refresh and the forced request is pending
- **THEN** the refresh action is disabled and no second forced request is started

#### Scenario: Stale fallback is returned

- **WHEN** the API returns status marked stale after an upstream failure
- **THEN** the page retains the status and clearly identifies when it was observed

### Requirement: Status absence and mapping failures are explicit

The page SHALL distinguish initial loading, request failure, no active season, active season with an unknown catalog config/current boss mapping, and active status with stale data. A valid no-active-season response SHALL show a neutral empty state rather than a retryable error. Unknown ids SHALL use readable fallbacks and explain that detailed progression is unavailable.

#### Scenario: No season is active

- **WHEN** the API returns `state: noActiveSeason`
- **THEN** the page shows a neutral no-active-season state and keeps personal resources available when synced

#### Scenario: Current boss mapping is unavailable

- **WHEN** the active response cannot be reconciled with the locally synced raid-boss catalog
- **THEN** the page shows readable ids/basic server values plus a catalog-data warning rather than displaying a different boss

#### Scenario: Initial request fails

- **WHEN** no cached status exists and the status request fails
- **THEN** the page shows the error and retry action while withholding fabricated raid progress
