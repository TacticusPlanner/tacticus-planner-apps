## Why

UserJot "Support Multiple Rank Goals per Unit" (Ragnar) asks for V1 parity: stack G1 → D1 → D3 → A1 for a raid team and interleave the steps across units by priority. V2 already supports distinct Rank milestones (`rank-milestone-planning`), but:

- Every other goal type is one per unit, while V1 allowed any number (Legendary now and Mythic later; ability 40 now and 50 later).
- Creating a higher Rank milestone that needs more rarity auto-suggests a *new* Ascension goal even when the unit already has one. That collides with the existing Ascension slot and blocks submit (`use-goal-prerequisites.ts` only looks at current progression, and `findGoalSlotConflict` then rejects the review set).
- A ladder takes one trip through the create sheet per step.

The companion API change lifts the one-per-type rule for every type except Unlock (one goal per distinct target), allows repeated types in one combined request, and lets a new goal depend on existing goals.

## What Changes

- **Planning:** overlapping Ascension goals for one unit allocate each progression step, and the unit's owned shards/mythic shards, once in effective priority order. This is the Ascension analogue of `coveredRankSlots`. Ability and Upgrade already share `UnitCoverage` transitions/slots; verify and test them with multiple goals of one type.
- **Creation:**
  - The client slot pre-check uses the per-type target key.
  - The Ascension suggestion is milestone-aware: an existing in-flight Ascension goal that already covers the target becomes a dependency (`dependsOnGoalIds`) instead of a new suggestion. Otherwise the suggestion is a new Ascension goal at the minimum end, which no longer collides.
  - Rank, Ascension and Ability cards gain "Add milestone" to create a ladder in one combined request, each step depending on the previous one.
- **Display:** every goal row shows its target label (not only Rank). A milestone's range reads from the previous in-flight milestone of the same unit and type. A milestone fully covered by a higher-priority sibling shows why it has no demand.
- **Blockers:** a missing-Ascension reason whose existing Ascension goal is too low offers to create a covering milestone, alongside reviewing the existing goal.
- **Edits:** a target-edit collision names the sibling milestone for every type.

## Capabilities

### New Capabilities

- `goal-milestone-planning`: multiple goals of one type per unit in planning and display, with Ascension progression allocated once.

### Modified Capabilities

- `goal-creation`: milestone-aware prerequisite suggestion, per-type slot pre-check, ladder creation.
- `goal-blocker-reasons`: remedy when an existing Ascension goal is too low.
- `goal-target-editing`: sibling-milestone collision copy for every type.

## Impact

`features/goal-farming` (`UnitCoverage`, `ascensionResourceNeed`, `calculateGoalResourceNeed`), estimate consumers (`plan-insights-calc`, `daily-raids-calc`, `shop-needs`, LE `farming-days`), `pages/goals` (create form, prerequisites, submission, goal rows/cards, blockers, edit dialog), `entities/goal` (target key + labels), i18n in all locales, regenerated API types. Companion API change: `support-multiple-goals-per-unit` in `tacticus-planner-api`, which applies first. `rank-milestone-planning` is unchanged and remains the Rank rule.
