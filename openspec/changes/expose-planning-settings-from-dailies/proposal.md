## Why

The daily-energy setting affects raid planning but is discoverable only from the Goals page (`/plan/goals`, `RAID-001`). A user on Dailies > Raids should reach the same setting without leaving the work surface.

## What Changes

- Expose Planning Settings from the shared Raids layout so both Today and Raids Plan have a visible, accessible entry point on desktop and mobile.
- Keep the existing Plan > Goals entry point (`/plan/goals`) and use one dialog, persisted configuration, and accurate cross-surface wording.

## Capabilities

### New Capabilities

- `planning-settings-access`: Cross-surface access to the shared planning configuration.

### Modified Capabilities

None. `goals-navigation`'s Goals-only rule ("Planning Settings is a Goals-only control", renamed from "Overview-only" by `consolidate-goals-into-plan-and-remove-active-project`) remains true _within Goals_; it does not bar a Dailies entry.

## Impact

Apps planning-setting shared UI, the Goals page and Dailies Raids layout, localized copy and tests. No API change.
