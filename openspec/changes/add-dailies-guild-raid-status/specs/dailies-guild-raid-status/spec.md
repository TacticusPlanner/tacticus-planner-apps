## Purpose

Shows a guild member the current raid position and personal raid resources needed to make the next daily attack decision, without adding analytics or team scoring.

## ADDED Requirements

### Requirement: Ready guild members see current raid status

The Guild Raids page SHALL request status only after shared guild access is ready. For an active season it SHALL show season number, current boss, zero-based source tier/set as localized one-based labels, difficulty, remaining and maximum HP, progress through the current tier, current prime modifiers and remaining thresholds, remaining season time when known, observation freshness, and last guild synchronization time. It SHALL NOT calculate or display a subsequent-boss preview in this change.

The app SHALL resolve boss/prime names, portraits, difficulty labels, and modifier descriptions from the raid-boss catalog and localized resources using server-supplied ids. It SHALL not render raw hit history.

When a prime's HP or modifier activation values are null, the page SHALL label the affected HP/threshold as unavailable and the modifier activation state as unknown. It SHALL NOT fabricate a threshold, render a numeric HP-progress bar from missing values, or label the modifier active or inactive.

#### Scenario: Active raid status loads

- **WHEN** a ready guild member opens Guild Raids and the API returns an active mapped season
- **THEN** the page shows all available current-position fields and no team recommendation section is required by this change

#### Scenario: Season end is unknown

- **WHEN** active status has `endsAt: null`
- **THEN** the page labels the remaining season time as unavailable without hiding the boss status

#### Scenario: Prime HP and activation are unknown

- **WHEN** a current prime has null HP and its modifier has `activationRemainingHp: null` and `active: null`
- **THEN** the page shows unavailable HP/threshold and unknown activation without a fabricated progress value or active/inactive label

### Requirement: Current status has distinct desktop and mobile layouts

At or above 768px, the page SHALL present the boss, progression, and modifier details in a scan-friendly multi-column status region. Below 768px, it SHALL present one primary boss summary followed by compact progression and expandable modifier sections without horizontal scrolling.

#### Scenario: Desktop status is scannable

- **WHEN** active status is viewed at or above 768px
- **THEN** current boss and the supporting progression/modifier details are simultaneously visible in the status region

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

### Requirement: Status refresh happens once per page visit, not on a timer

The page SHALL request status once when the Guild Raids page mounts and SHALL show cached/persisted status immediately without waiting on a sync. On mount, if the returned `observedAt` is more than one hour old, or the read indicates the guild has no observation yet, the page SHALL automatically issue exactly one forced-refresh request in the background. The page SHALL NOT schedule any further automatic revalidation while it stays mounted; the next automatic check SHALL only occur on a subsequent mount (e.g. navigating back to the page).

A manual refresh action, local to the Guild Raids page, SHALL request forced refresh and SHALL be disabled while a refresh is pending so the page cannot issue overlapping refresh actions. Because the API enforces its own cooldown, a refresh request inside that window SHALL return the current persisted result rather than an error, and the page SHALL treat it as an ordinary successful response.

When refresh returns retained stale data, the page SHALL keep it visible with a stale warning and observation time. When refresh fails and no retained status exists, the page SHALL show a retryable error. Manual status refresh SHALL NOT trigger guild roster synchronization or player-data synchronization.

#### Scenario: Page mount triggers a background check for stale data

- **WHEN** the Guild Raids page mounts and the persisted observation is over one hour old
- **THEN** the page renders the cached status immediately and issues one background refresh request without blocking the initial render

#### Scenario: Recently observed status needs no automatic refresh

- **WHEN** the page mounts and the persisted observation is under one hour old
- **THEN** the page renders it and does not issue an automatic refresh request

#### Scenario: Mounted page does not poll

- **WHEN** the user keeps the page open and mounted past the one-hour threshold without navigating away
- **THEN** no automatic refresh occurs until the next time the page mounts

#### Scenario: Manual refresh is already running

- **WHEN** the user activates refresh and the forced request is pending
- **THEN** the refresh action is disabled and no second forced request is started

#### Scenario: Stale fallback is returned

- **WHEN** the API returns status marked stale after an upstream failure
- **THEN** the page retains the status and clearly identifies when it was observed

### Requirement: Status absence and mapping failures are explicit

The page SHALL distinguish initial loading, a guild with no observation yet, request failure, no active season, active season with an unknown catalog config/current boss mapping, and active status with stale data. A valid no-active-season response SHALL show a neutral empty state rather than a retryable error. Unknown ids SHALL use readable fallbacks and explain that detailed progression is unavailable.

#### Scenario: Guild has never had a raid-status observation

- **WHEN** the status request returns the API's never-observed conflict
- **THEN** the page shows a syncing/loading state, relies on the automatic mount-triggered refresh to populate it, and renders the result once that refresh completes

#### Scenario: No season is active

- **WHEN** the API returns `state: noActiveSeason`
- **THEN** the page shows a neutral no-active-season state and keeps personal resources available when synced

#### Scenario: Current boss mapping is unavailable

- **WHEN** the active response cannot be reconciled with the locally synced raid-boss catalog
- **THEN** the page shows readable ids/basic server values plus a catalog-data warning rather than displaying a different boss

#### Scenario: Initial request fails

- **WHEN** no cached status exists and the status request fails
- **THEN** the page shows the error and retry action while withholding fabricated raid progress
