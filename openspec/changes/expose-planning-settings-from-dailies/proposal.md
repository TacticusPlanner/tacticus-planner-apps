## Why

The daily-energy setting affects raid planning but is discoverable only from Goals Overview (`RAID-001`). A user on Dailies > Raids should reach the same setting without leaving the work surface.

## What Changes

- Expose Planning Settings from the shared Raids layout so both Today and Raids Plan have a visible, accessible entry point on desktop and mobile.
- Keep the existing Plan > All Goals/Overview entry point and use one dialog, persisted configuration, and accurate cross-surface wording.

## Capabilities

### New Capabilities

- `planning-settings-access`: Cross-surface access to the shared planning configuration.

### Modified Capabilities

None. `goals-navigation`'s Overview-only rule remains true _within Goals_; it does not bar a Dailies entry.

## Impact

Apps planning-setting shared UI, Goals Overview and Dailies Raids layout, localized copy and tests. No API change.
