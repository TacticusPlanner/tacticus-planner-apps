## MODIFIED Requirements

### Requirement: Ready guild members see current raid status

The Guild Raids page SHALL request status only after shared guild access is ready. For an active season it SHALL show season number, current boss, zero-based source tier/set as localized one-based labels, difficulty, remaining and maximum HP, progress through the current tier, current prime modifiers and remaining thresholds, remaining season time when known, observation freshness, and last guild synchronization time. It SHALL NOT calculate or display a subsequent-boss preview.

The app SHALL resolve boss/prime names, portraits, difficulty labels, and modifier descriptions from the raid-boss catalog and localized resources using server-supplied ids. It SHALL not render raw hit history.

When a prime's HP or modifier activation values are null, the page SHALL label the affected HP/threshold as unavailable and the modifier activation state as unknown. It SHALL NOT fabricate a threshold, render a numeric HP-progress bar from missing values, or label the modifier active or inactive.

#### Scenario: Active raid status loads

- **WHEN** a ready guild member opens Guild Raids and the API returns an active mapped season
- **THEN** the page shows all available current-position fields

#### Scenario: Season end is unknown

- **WHEN** active status has `endsAt: null`
- **THEN** the page labels the remaining season time as unavailable without hiding the boss status

#### Scenario: Prime HP and activation are unknown

- **WHEN** a current prime has null HP and its modifier has `activationRemainingHp: null` and `active: null`
- **THEN** the page shows unavailable HP/threshold and unknown activation without a fabricated progress value or active/inactive label
