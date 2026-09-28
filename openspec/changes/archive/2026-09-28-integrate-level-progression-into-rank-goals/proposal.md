## Why

`PLAN-008` describes a Rank goal split into a routine Level goal plus a Restricted badge. A separate Level goal is the wrong model: the level a character needs is a property of the Rank or Ability target it serves, not a milestone of its own. Today's list logic that folds some linked Level rows into their dependent only papers over that, and leaves standalone Level goals, duplicate XP planning, and a Restricted state for ordinary leveling.

## What Changes

- **BREAKING:** Remove Level goals from the client entirely: no Level card or prerequisite suggestion in goal creation, no Level rows or cards, no Level dependency, and no missing-Level restriction.
- Keep showing the level a target needs next to the goal: a Rank or Ability goal whose character is below the required level shows required level, current level, remaining XP, and Potential progress from owned books, as ordinary goal progress and never as a Restricted reason.
- Allocate level XP and owned books once across overlapping Rank milestones (the shared allocation `support-multiple-rank-milestones` builds on), and feed Insights and Dailies from it.
- Retain the real Unlock, Ascension, player-data, and other blockers.

## Capabilities

### New Capabilities

- `rank-level-progression`: A Rank or Ability goal's required-level display, XP allocation across Rank milestones, and the absence of Level goals.

### Modified Capabilities

- `goal-blocker-reasons`: There is no missing-Level reason; routine leveling is never a restriction.
- `goal-creation`: An above-cap Ability target suggests only an Ascension prerequisite and shows its required level. _(Delta spec still to be authored; see design, "Spec deltas to author".)_
- `goal-list-layout`: The "Level goal renders as its dependent's sub-line" requirement and the mobile one-card exception are removed. _(Delta spec still to be authored.)_
- `goal-progress-display`: Level goal Potential progress, ceiling, remaining-text, and explanation requirements move to Rank/Ability or are removed. _(Delta spec still to be authored.)_
- `v1-profile-import`: Automatic prerequisites are Unlock and Ascension only. _(Delta spec still to be authored.)_
- `goal-target-editing`: Level is no longer an editable target kind. _(Delta spec still to be authored.)_

## Impact

Goal-creation form and prerequisites, `features/goal-farming` XP allocation, Goals rows/progress/blockers, Dailies and Insights consumers, the goal detail target editor, translations, tests, and tutorials. Paired API change `integrate-level-progression-into-rank-goals` removes the Level goal type and deletes existing Level goals; it applies first.
