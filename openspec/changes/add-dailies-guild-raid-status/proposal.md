## Why

Once guild access is ready, players need the current boss context and their available raid resources before deciding what to attack with. The current Guild Raids route has no live status UI and V1's analytics-heavy dashboard is broader than this decision-focused Dailies slice.

## What Changes

- Consume the companion API's normalized current Guild Raid status and show season, boss, tier/difficulty, HP, tier progress, modifiers, remaining thresholds, remaining season time, and last guild synchronization time.
- Show the player's locally synced raid tokens, next recharge, bomb availability, and bomb recharge below the guild status.
- Use cached data immediately, revalidate stale data automatically, offer manual refresh, and prevent overlapping refresh actions.
- Handle no active season, unavailable current boss/catalog mapping, stale persisted data, upstream failure with retained data, and missing player-resource data explicitly.
- Provide purpose-built desktop and mobile layouts plus localized loading/error/empty states and a responsive Joyride tutorial.
- Exclude all team recommendations and performance analytics from this slice.
- Coordinate the matching `add-dailies-guild-raid-status` API change; the API side applies first.

## Capabilities

### New Capabilities

- `dailies-guild-raid-status`: Defines the informational current-raid and player-resource experience, including freshness and failure states.

### Modified Capabilities

None.

## Impact

- Affects the Dailies Guild Raids page, a new guild-raid status entity/API boundary, player-data queries, raid-boss presentation helpers, i18n resources, tutorial steps, and tests.
- Depends on `share-guild-access-onboarding`, the existing raid-boss catalog, and the companion API contract.
- Does not change the shared Dailies team recommendation engine.
