## Why

Three functions in the goals model each independently decide whether a goal's target is already satisfied by the player's live progression, and they disagree. The Unlock goal's resource-need calculation never checks ownership at all, so an already-unlocked character can still show a shard requirement (reported: Angrax's planner continuing to ask for 40 shards after he was already unlocked). The progress display's current/target badges are never clamped to the goal's own configured target for Rank, Ascension, or Level goals, so a character whose live progression has advanced past a goal's target renders as flat or backwards instead of complete (reported: an Ascension goal displaying "R5★ → R5★" — the same rarity/star tier at both ends — after a level-up, read by the tester as "retroactive/descend"). Separately, the "Actual progress" and "Potential progress" captions these same badges sit next to already have an explanation string, but it is rendered only inside the goal-detail sheet — the goals list and project-card views, where testers say they actually can't tell what either metric means, show the same two bars with no explanation at all.

All three are symptoms of the same gap: nothing in this area treats "is the goal's target already met by the player's actual state" as one settled question every consumer answers the same way.

## What Changes

- Unlock goal resource-need becomes zero once the character is owned, instead of only netting the shard cost against shard inventory. This is the only resource-need branch that doesn't already account for the player's actual state (Ascension's resource-need already self-clamps via progression indices).
- The progress display's `current` value is clamped to the goal's own configured target for every kind that has one — Rank, Ascension, and Level — matching the ratio, which is already clamped. An overshot goal's current/target badge pair reads as complete, never as flat or backwards.
- The "Actual progress" and "Potential progress" captions gain a short, always-visible explanation everywhere the two-bar display renders (goals list, project detail cards, goal-detail sheet) — not only in the goal-detail sheet, and not hover-only. An "Actual progress" explanation is added; "Potential progress" reuses its existing one.
- That copy states what the ratio measures — progress toward the goal's own configured target — without implying that partial progress toward any target is uniformly useful to the player, so a character below a functionally-relevant rank doesn't read as "mostly there."

## Capabilities

### New Capabilities

- `goal-progress-display`: how a goal's current/target state is derived for on-screen display (current, target, ratio, per goal kind) and how the Actual/Potential progress bars are captioned and explained, wherever the shared progress display renders — the goals list, project detail cards, and the goal-detail sheet.

### Modified Capabilities

- `goal-farming-estimates`: adds a requirement that a goal's resource need is zero once its target is already attained by the player's synced state, starting with the Unlock goal type.

## Impact

- `apps/web/src/fsd/features/goal-farming/lib/progression-cost-calc.ts` (`unlockResourceNeed`) and `goal-requirements.ts` (`calculateGoalResourceNeed`'s `"Unlock"` branch) — thread ownership into the Unlock resource-need path.
- `apps/web/src/fsd/pages/goals/model/attainment/goal-progress.ts` (`computeGoalProgress`) — clamp `current` in the `"Rank"`, `"Ascension"`, and `"Level"` cases.
- `apps/web/src/fsd/pages/goals/ui/shared/goal-visuals.tsx` (`GoalProgressDisplay`) — render the Actual/Potential explanatory copy unconditionally rather than leaving it to callers.
- `apps/web/src/fsd/pages/goals/ui/goal-detail/goal-detail-view.tsx` — its own separate rendering of `potentialProgressDescription` becomes redundant once `GoalProgressDisplay` carries it; exact resolution (remove vs. dedupe) is a design decision.
- `apps/web/public/locales/{en,de,es,fr}/common.json` — add an Actual-progress explanation string; reuse or reword the existing Potential-progress one for its new render location.
- No companion `tacticus-planner-api` change. Every input this touches (player character/mow records, inventory shards, catalog costs) is already synced client-side; this only changes how already-available data is derived and displayed.
