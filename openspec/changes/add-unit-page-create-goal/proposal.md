## Why

Players asked to start goal creation from a unit's page ("Create Goals from Character Pages", merged into the UserJot post "Bulk Goal Creation"). Today the Library character and Machine of War pages show a unit's values and rank-up materials but offer no way to plan it: the player has to leave, open goal creation and pick the unit again. The goal-creation launcher already supports a unit prefill (the Legendary Event page uses it), so this is a small entry point, and the first slice of the bulk goal creation work.

No companion API change.

## What Changes

- The Library character page (`/library/characters/:entityId`) and Machine of War page (`/library/machines-of-war/:entityId`) show a **Create goal** button in the unit header for a signed-in player, on desktop and mobile.
- It opens the app shell's goal-creation sheet with the unit prefilled: on Unlock when the synced roster doesn't hold the unit, otherwise with only the unit selected. It carries no project context.
- Signed out there is no button (the sheet only exists for a signed-in player). While the player's data is still read, the button is disabled.
- A declared analytics event `library_unit_create_goal_opened` (entity type, preselected goal type).
- The header tour step on both pages mentions the button.

## Capabilities

### Modified Capabilities

- `goal-creation-entry-points`: adds the Library unit pages as an entry point.

## Impact

- `apps/web/src/fsd/pages/library/ui/unit/`: `unit-create-goal.ts` (prefill), `unit-create-goal-button.tsx`, `unit-header.tsx` (`action` slot).
- `character-unit-page.tsx`, `character-unit-header.tsx`, `mow-unit-page.tsx` wire the button.
- `shared/analytics`: the new event.
- `public/locales/{en,de,es,fr}/library.json`: `unit.createGoal`, `unit.createGoalFor`, header tour copy.
