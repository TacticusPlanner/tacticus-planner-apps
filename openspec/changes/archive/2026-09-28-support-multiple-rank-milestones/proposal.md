## Why

`PLAN-010` asks for several Rank targets for one character without losing control of sequence or double-counting overlapping progression. Current project membership and assembly UI treat any second Rank for a unit as a conflict, mirroring the older API slot rule.

## What Changes

- Create, display, reorder, pause/resume, and delete distinct Rank milestones independently within a project; exact active target duplicates remain blocked with a link to the existing goal.
- Allocate overlapping rank transitions, materials, level XP, and owned resources once in effective priority order, while keeping each goal's actual status/target separate.
- Reconcile project assembly, membership conflict, and delete/recreate flows with the API's target-specific slot rule.

## Capabilities

### New Capabilities

- `rank-milestone-planning`: Independent milestone presentation and non-duplicating plan demand.

### Modified Capabilities

- `goal-project-membership`: Rank slot conflicts are target-specific.
- `project-management`: Assembly allows distinct Rank targets and blocks exact duplicates.

## Impact

Goal creation/list/detail, `features/goal-farming` interval allocation, project membership and assembly, Dailies/Insights estimates, tutorials/i18n/tests. Companion API change `support-multiple-rank-milestones` changes constraints and conflict payload; depends on `integrate-level-progression-into-rank-goals` and applies first.
