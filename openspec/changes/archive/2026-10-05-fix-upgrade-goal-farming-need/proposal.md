## Why

Goals of type **Upgrade** never reach the planner. `calculateGoalResourceNeed`
(`features/goal-farming/lib/goal-requirements.ts`) has branches for Rank, Ability, Ascension and
Unlock but none for Upgrade, so it returns `null` and every consumer skips the goal — Today's
raids, the Raids Schedule, plan insights and the overview metrics — whatever its priority.

Fixing that alone would make an Upgrade goal and a Rank/Ability goal on the same unit charge the
same upgrade slots twice. The create form already has a rank range (Character) but discards it, so
the overlap can't be detected. This change persists the range and de-duplicates by slot.

Companion API change: `tacticus-planner-api` → `fix-upgrade-goal-farming-need` (same name; **the
API half applies first**) adds the persisted range fields this change reads and writes.

## What Changes

- Upgrade goals contribute a farming need: each target's base upgrade × quantity, netted against
  inventory by the existing priority-ordered allocation. No stages (a single flat need).
- Upgrade goals persist an optional progression range — Character: rank range; Machine of War: one
  range per ability track (each track optional).
- When an Upgrade goal's range overlaps slots a Rank/Ability goal on the same unit already
  claimed, the overlapping amount is deducted from the Upgrade need, capped at the goal's own
  quantity. Claiming is symmetric so the total does not depend on goal order.
- Goals without a range (all existing goals) keep additive behaviour.
- The create sheet sends the range it already collects (and gains per-track range selectors for a
  MoW); the Edit goal dialog lets the range be changed.
- No **BREAKING** change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-farming-estimates`: Upgrade goals produce demand; slot-overlap de-duplication.
- `goal-creation`: the Upgrade card persists its range; a MoW gets per-track range selectors.
- `goal-target-editing`: the Upgrade target section edits the range.
- `daily-raids-today`: Upgrade goals appear in Today's schedule.
- `daily-raids-plan`: Upgrade goals appear in the Raids Plan / Schedule.

## Impact

- `features/goal-farming/lib/goal-requirements.ts` (+ `goal-need.ts`, `mow-ability-calc.ts` for slot claiming)
- `features/daily-raids/model/daily-raids-calc.ts` (already routes through the shared function)
- `pages/goals/model/goal-creation-form/use-upgrade-fields.ts`, `.../estimate/goal-spec-builder.ts`,
  `.../target-edit/goal-target-edit.ts`, `pages/goals/ui/create-goal/upgrade-goal-fields.tsx`,
  `pages/goals/ui/goal-edit/goal-target-fields.tsx`
- `entities/goal` types and API client (new range fields); `goals` locale namespace (en/de/es/fr)
- Consumers that share the function and are fixed automatically: plan insights, plan net resources,
  standalone estimates, shop needs, overview metrics.
