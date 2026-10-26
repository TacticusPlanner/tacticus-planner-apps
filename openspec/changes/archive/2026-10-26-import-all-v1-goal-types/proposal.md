## Why

The V1 import now handles every V1 goal type (API change `import-all-v1-goal-types` in `tacticus-planner-api`): Machine of War Ascension goals resolve, and V1's two unit-less material goal types, Upgrade Material and Pre-farm, come back as a `manual_step_required` outcome with a suggested unit, because which unit should hold the material is the user's call. The report has to tell the user what to do about them instead of filing them under "Not imported". Created goals now land in a per-import project, which the existing post-import project refresh already picks up.

## What Changes

- New outcome codes: `manual_step_required` (its own `needsAction` bucket), `unknown_upgrade` and `no_upgrade_owner` (not imported), each with translated copy in every locale.
- The import report shows a "Material goals need one more step" prompt above the outcome list: each material goal's material and quantity, the units a pre-farm goal pre-farmed for (resolved through the linked goals' own outcomes) or else the suggested unit, and, inside the app shell, a "Create Upgrade goal" button per unit.
- `CreateGoalPrefill` gains an Upgrade variant (unit, one material, optional quantity). The creation sheet selects the unit and Upgrade type and adds the material with the given quantity, else the unit's remaining-ladder need.
- Material rows name the material.
- **BREAKING** The report's Copy details action is removed; it only repeated what the report shows.
- Regenerated API types: `V1GoalOutcome.upgradeId`, `linkedSourceGoalIds` and `upgradeQuantity`.

## Impact

- `features/v1-import`: outcome buckets, report UI, `useUpgradeName`.
- `entities/goal`: `CreateGoalPrefill`.
- `pages/goals`: `useCreateGoalPrefill`, `useUpgradeFields`.
- Specs: `v1-profile-import` drops the copyable-diagnostic requirement.
- Locales: `goals.v1Import.report.copy` removed; `goals.v1Import.reasons.*`, `goals.v1Import.materialSteps.*`, `goals.v1Import.report.needsAction`.
