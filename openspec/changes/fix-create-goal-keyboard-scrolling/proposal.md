## Why

Keyboard users report that the Create Goal sheet does not scroll as expected, leaving fields unreachable on short screens (`UI-001`). The sheet already has an inner scrolling form, so the failure needs reproduction and a targeted focus/scroll fix without weakening its focus trap.

## What Changes

- Make all creation fields and actions reachable with keyboard-only navigation and normal keyboard scrolling at small viewport heights.
- Preserve mouse/touch scrolling, focus containment, and existing creation behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-creation`: Add a keyboard-reachability requirement for the creation sheet.

## Impact

Apps Create Goal sheet/form layout and interaction tests. No API or persisted-data change.
