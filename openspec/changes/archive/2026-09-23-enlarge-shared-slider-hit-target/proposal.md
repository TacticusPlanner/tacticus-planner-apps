## Why

The shared slider's visually thin track is difficult to tap or drag on touch devices. The Energy planning control inherits this problem, and fixing only that dialog would leave other slider consumers inconsistent (`RAID-003`, `UI-01`).

## What Changes

- Increase the shared slider's horizontal and vertical pointer/touch target without changing its visible track scale or value semantics.
- Verify tap, drag, keyboard, disabled, focus, and adjacent-control behavior in existing consumers.

## Capabilities

### New Capabilities

- `shared-slider-interaction`: Pointer, touch, and keyboard operability of the reusable slider control.

### Modified Capabilities

None.

## Impact

The shared `packages/ui/src/components/slider.tsx` and its consumers in Planning Settings, Progress, character lookup, and the UI kit. No API or persisted-data change.
