## Why

Users report that editing a goal's farming strategy appears to succeed but does not retain or affect planning (`PLAN-013`). The client and API already carry a strategy field, so the failure must be traced through the full save/read/calculation round trip before changing strategy semantics or assigning blame to a layer.

## What Changes

- Reproduce changed-strategy save, reopen, refresh, and Dailies/plan behavior.
- Fix the failing client layer if confirmed, surface save errors, and add persisted round-trip regression coverage. Preserve existing strategy choices and calculations.
- If the API is the failing layer, prepare a matching `tacticus-planner-api` OpenSpec companion before implementation and coordinate its contract with this change.

## Capabilities

### New Capabilities

- `goal-farming-strategy-persistence`: The chosen strategy survives save/reload and drives downstream planning.

### Modified Capabilities

None.

## Impact

Apps goal edit draft/save/cache and planning consumers; API update/read only if the investigation proves a server defect. No intended contract or data-model expansion.
