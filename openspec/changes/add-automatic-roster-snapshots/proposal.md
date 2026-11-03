## Why

The API will take an automatic snapshot when a profile has gone 30 days without one, and it can import V1 roster snapshots. The apps need to show both: automatic snapshots must be recognisable and keepable, players need a way to opt out, and the V1 import page needs a checkbox and outcome reporting for the new part.

Depends on `add-personal-roster-snapshots` (apps), which must land first. Companion API changes: `add-automatic-roster-snapshots` (this change's name pair) and `import-v1-roster-snapshots`, both in `tacticus-planner-api`. The API halves apply first.

## What Changes

- Automatic snapshots are labeled "Auto · <date with year>" (for example "Auto · Nov 3, 2026") in the picker, the manage sheet and toasts, unless the user renamed them.
- The manage sheet shows automatic snapshots in their own section, with usage "<autoCount>/<autoLimit>" and a note that the oldest is replaced. Each one has a Keep action, which moves it into the manual list. Keep is disabled at the manual limit, with a tooltip.
- V1-imported snapshots are labeled "V1 · <name>". Their XP and applied-upgrade fields show "—" in chips and details, and never count as changes.
- A settings toggle "Take a snapshot automatically when you have none from the last 30 days" saves `autoRosterSnapshots`, which defaults to on.
- The V1 import page gains a "Roster snapshots" part checkbox (off by default). Per-snapshot outcomes are grouped as imported, already imported, over the limit, in V1 trash and failed, with dropped-unit counts.
- i18n (en/de/es/fr) and analytics for Keep and the setting.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `roster-snapshot-management` (introduced by `add-personal-roster-snapshots`): automatic and imported snapshots, Keep and the setting.
- `v1-profile-import`: the roster-snapshots part and its outcomes.

## Impact

- `entities/roster-snapshot`: `source`-aware labels, the `useKeepRosterSnapshot` hook, and the auto usage fields.
- `pages/my-game/ui/collection` manage sheet; the planning-settings UI for the toggle.
- `pages/v1-import` and `features/v1-import`: the new part and its outcome list.
- Locales: `common.json` (`collection.snapshots.auto.*` and settings keys) and the V1 import namespace keys.
