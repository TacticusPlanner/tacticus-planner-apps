## 1. Entry point

- [x] 1.1 `unitCreateGoalPrefill` (Unlock for a unit not owned, unit-only otherwise) with unit tests
- [x] 1.2 `UnitCreateGoalButton` in the shared unit header's `action` slot; signed-in only, disabled while loading
- [x] 1.3 Wire it on the character and Machine of War pages, with page tests (signed out, owned, not owned, loading)

## 2. Analytics

- [x] 2.1 Declare `library_unit_create_goal_opened` (entity type, goal type) and assert its captured properties

## 3. i18n and tour

- [x] 3.1 `unit.createGoal`, `unit.createGoalFor` in en, de, es, fr
- [x] 3.2 Header tour step copy on both pages mentions Create goal, in en, de, es, fr (same target, desktop and mobile)

## 4. Gates

- [x] 4.1 Targeted tests, typecheck, eslint on changed files, `pnpm lint:fsd`

## 5. Desktop verification

- [ ] 5.1 At ≥768px, signed in and synced: an owned and an unowned character, and an owned MoW, open the sheet with the right prefill

## 6. Mobile verification

- [ ] 6.1 Below 768px: the button sits under the unit lines without crowding the values control, and opens the sheet
