## Why

The V1 import now brings in every V1 goal type it can (API change `import-all-v1-goal-types` in `tacticus-planner-api`): Upgrade Material goals become Upgrade goals, and Machine of War Ascension goals resolve. Pre-farm goals have no V2 type and come back as a `manual_step_required` outcome. The report has to tell the user what to do about them instead of filing them under "Not imported".

## What Changes

- New outcome codes: `manual_step_required` (its own `needsAction` bucket), `unknown_upgrade` and `no_upgrade_owner`, `upgrade_goal_occupied` (not imported), each with translated copy in every locale.
- The import report shows a "Pre-farm goals need one more step" prompt above the outcome list: each pre-farm goal's material, the units it pre-farmed for (resolved through the linked goals' own outcomes), and — inside the app shell — a "Create Upgrade goal" button per unit.
- `CreateGoalPrefill` gains an Upgrade variant (unit + one material). The creation sheet selects the unit and Upgrade type and adds the material with the picker's required-amount hint.
- Regenerated API types: `V1GoalOutcome.upgradeId` and `linkedSourceGoalIds`.

## Impact

- `features/v1-import`: outcome buckets, report UI, `useUpgradeName`.
- `entities/goal`: `CreateGoalPrefill`.
- `pages/goals`: `useCreateGoalPrefill`.
- Locales: `goals.v1Import.reasons.*`, `goals.v1Import.preFarm.*`.
