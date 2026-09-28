## Context

The app currently auto-suggests Level alongside Rank and Ability, merges a Level row into its dependent only when it has exactly one dependent, and allocates books primarily to separate Level goals. `rank-additional-target.ts` already derives a Rank target's required level, and the creation flow already derives the level an Ability target implies. The paired API change removes the Level goal type and deletes existing Level goals.

## Goals / Non-Goals

**Goals:** Make Rank and Ability the visible, canonical owners of the level they need, keep the current "level requirement shown next to the goal" behavior, and avoid duplicate XP need.

**Non-Goals:** Alter the XP curve, hide genuine eligibility blockers, or preserve any Level goal, row, or dependency.

## Decisions

1. **No Level goals in the client.** Remove the Level card, Level prerequisite suggestion, `GoalKind` `Level`, the Level row/card and sub-line folding, `MissingLevelPrerequisite`, and the Level goal's progress/estimate paths. Alternative: keep Level goals for Ability or standalone. Rejected because it keeps a second owner of the same XP and the Restricted noise.
2. **The required level is derived and displayed on its goal.** For Rank it comes from `requiredLevelForRankTarget` (end rank plus partial slots); for Ability from the existing rule that implies a level from the higher ability target. When the character is below it, the Rank or Ability row/card, detail, and creation preview show required level, current level, remaining XP, and Potential progress from owned books. This is the current level-requirement display, relocated from a Level row onto the goal it serves; it is never a Restricted reason and never a dependency.
3. **One allocation owns XP.** `features/goal-farming` exposes a per-unit ordered progression allocation covering Rank slots and level XP, so overlapping Rank milestones for one character charge shared levels and owned books once, in effective priority order. Insights, Dailies, and Goals consume it through public APIs, never page-local formulas. With no Level goals, Ability level XP is allocated alongside the unit's Rank targets by the same result.
4. **Layouts.** Goals desktop rows and mobile cards show level/XP under the Rank (or Ability) goal using layout-appropriate disclosure; the Goals tutorial targets differ between table and card, so update both.
5. **Blockers.** With no Level goal there is no missing-Level reason. Unlock, Ascension, player-data, and unreached-dependency reasons are unchanged.

## Spec deltas to author

`rank-level-progression` and `goal-blocker-reasons` deltas exist under `specs/`. Removing Level also changes these existing capabilities, whose delta specs still need creating (`/opsx:continue`):

- `goal-creation`: rename and modify "An above-cap ability target auto-suggests Ascension and Level prerequisites" so only Ascension is suggested and the required level is shown.
- `goal-list-layout`: remove "A Level goal with exactly one dependent renders as that goal's sub-line, not its own row"; modify "Mobile renders one card per goal" (drop the sub-line exception and the merged-Level scenario) and the Actual/Potential legend scenario that mentions Level goals.
- `goal-progress-display`: remove "Level goal Potential progress reflects owned XP books, shared by priority" (moved onto Rank/Ability via `rank-level-progression`); rename and modify "A Rank or Level goal's bar marks the ceiling..." to Rank; drop the Level clauses and scenarios from "Displayed current value never reads past the goal's own target", the Actual/Potential caption requirement, "Remaining resource text uses a per-goal-kind formatter...", and "Remaining text stays reachable...".
- `v1-profile-import`: "Automatic prerequisite creation is always enabled" names Unlock and Ascension only.
- `goal-target-editing`: drop Level from the eligible kinds and the Level scenario.

## Risks / Trade-offs

- [Existing Level goals disappear on the API migration] → Apps ships after the API migration; the client makes no attempt to render or recover Level data.
- [XP-book ownership across overlapping goals is unclear] → Allocate once by effective priority; this is the same ownership rule multi-Rank milestones reuse.
- [Global priority is a later change] → Use current effective project order until `establish-global-goal-priority` supplies account order, without embedding project ids in the allocation.
- [Ability's level rule may not match Rank's] → Show its required level through the same display, deriving it from the existing Ability rule.

## Migration Plan

Apply the API companion first (it deletes Level goals). Then switch creation and the shared goal-farming allocation together. No client storage migration. Roll back the client as one unit; Level data deleted by the API cannot be restored by the client.

## Open Questions

- Which current translated phrase best distinguishes raw remaining XP from book-covered Potential XP? Choose copy during implementation; it does not change the numerical rule.
- Where an Ability goal's level display sits in a compact row (there is no rank to hang it under); choose during implementation, keeping the same fields.
