# Proposal

## Why

Severyn asked (3 Nov, decision 39 in the planning notes) for Priority to sit at the top of the Edit goal dialog, not near the bottom. Reordering is the edit players make most once they plan against a deadline, and today they scroll past the target and farming fields to reach it. This is the smallest piece of the priority work and ships before the picker with goal hints (`improve-goal-priority-picker`).

## What Changes

- The Edit goal dialog shows Priority first, above the target, on desktop and mobile. The field itself does not change.
- The Edit goal tour's priority step moves first, before the target step.

## Capabilities

### Modified Capabilities

- `goal-edit-dialog`: the editable fields start with Priority.

## Impact

- `features/goal-planning/ui/goal-edit/` (field order), `goal-edit-dialog.tutorial.tsx` (step order).
- No new copy, no API change, no dependency.
