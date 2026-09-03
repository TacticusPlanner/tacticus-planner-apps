## Why

The Characters Library can initialize the rank and progression controls with
identical start and end values, producing a lookup with no advancement to
calculate. The same invalid default can remain after a user selects another
character or when a synced player record is used as the starting point.

## What Changes

- Derive a valid initial Character Lookup range whose target advances beyond
  the starting rank and progression whenever another attainable step exists.
- When an authenticated player's character data is available, use its current
  rank and progression as the range start and derive a compatible target.
- At the maximum attainable rank or progression, keep the maximum as the
  target and move the corresponding start back one step so the range remains
  meaningful.
- Preserve explicit, valid URL-backed selections and user-edited draft ranges;
  do not overwrite them as catalog or player data refreshes.
- Add regression coverage for default, synced-player, maximum, and character
  switching behavior across the shared desktop and mobile controls.

## Capabilities

### New Capabilities

- `character-lookup-range-defaults`: Initialize and maintain meaningful,
  progression-compatible Character Lookup rank and progression ranges.

### Modified Capabilities

<!-- None. No existing specification defines Character Lookup range defaults. -->

## Impact

- Affects `apps/web/src/fsd/pages/library/ui/character/hooks/use-lookup-selection.ts`
  and the Character Library page's synced-player prefill flow.
- Extends the existing Character Lookup page and hook tests; no API, catalog,
  persistence, routing, or translation changes are expected.
