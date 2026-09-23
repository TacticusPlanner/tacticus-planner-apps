## Why

`PLAN-008` describes a Rank goal split into a routine Level goal plus a Restricted badge. Current UI deliberately merges some linked Level rows, but this does not make Rank's level progression intrinsic or prevent duplicate planning contribution in every path.

## What Changes

- Stop suggesting a separate Level prerequisite solely for a new Rank target; show required level/XP within the Rank milestone instead.
- Suppress a Restricted reason caused only by Rank's ordinary level gate while retaining real Unlock, Ascension, player-data, and other blockers.
- Reconcile existing/imported Rank→Level pairs non-destructively, preserving standalone Level goals and Level goals also needed by Ability.

## Capabilities

### New Capabilities

- `rank-level-progression`: Rank creation, progress, XP allocation, and legacy pair presentation.

### Modified Capabilities

- `goal-blocker-reasons`: Routine Rank leveling is not a separate missing-Level restriction.

## Impact

Goal-creation prerequisites, `features/goal-farming`/XP allocation, Goals rows/progress/blockers, Dailies and Insights consumers, translations/tests/tutorials. Paired API change `integrate-level-progression-into-rank-goals` changes import/creation semantics and applies first.
