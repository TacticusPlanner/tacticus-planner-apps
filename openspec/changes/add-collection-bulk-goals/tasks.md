## 1. Plan builder (`features/goal-create`, `bulk-create` segments)

- [x] 1.1 `buildBulkGoalPlans`: per-unit specs and skip reasons (reached, already a goal, not for MoW, not owned), added Ascension, in-flight Ascension/Unlock reuse; unit tests
- [x] 1.2 Cap check over the plan (`goalTypesOverLimit`); unit test

## 2. Submit

- [x] 2.1 `useBulkGoalSubmit`: sequential per unit, pending/done/failed with reason, Retry failed, list invalidation, analytics; tests

## 3. Dialog

- [x] 3.1 Targets (Unlock, Ascension, Rank, Abilities), project, unit list with goals/skips/remove, footer summary and cap message; tests

## 4. Collection select mode

- [x] 4.1 Select units toggle (signed in, roster available, Compare off), selectable tiles and rows, select bar, selection rules; page tests
- [x] 4.2 Tour step for Select units (desktop and mobile)

## 5. i18n

- [x] 5.1 New copy in en, de, es, fr (`common`)

## 6. Gates

- [x] 6.1 Targeted tests, typecheck, eslint on changed files, `pnpm lint:fsd`

## 7. Desktop verification

- [ ] 7.1 ≥768px, signed in and synced with a roster that has ready-to-rank-up units: select via quick filter, create, check goals on Goals

## 8. Mobile verification

- [ ] 8.1 <768px: select mode on Cards and Roster, the bar above the bottom nav, the dialog as a sheet

## 9. Fixes after verification

- [x] 9.1 Select bar sits above the mobile bottom nav and clear of the scroll-to-top button
- [x] 9.2 Shared `goalCreateErrorText` for the sheet and the dialog: no raw "API request failed with status" text
- [x] 9.3 Project field with inline project creation and several projects
- [x] 9.4 Target pickers start above the lowest current value; snap up; disable when nobody can advance
- [x] 9.5 Planned goals as icon rows (shared `CompactStars`, rank icons, a row per ability track)
- [x] 9.6 Unowned MoW Unlock: API accepts it (`allow-mow-unlock-goals` in tacticus-planner-api); no apps change
