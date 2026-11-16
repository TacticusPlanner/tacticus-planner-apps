# Tasks

## 1. Order logic

- [x] 1.1 Add `before` and `after` to `moveProjectGoals` with tests for the order worked example (before, after), the goal-in-both rule, and an empty reference

## 2. UI

- [x] 2.1 `move-project-goals-dialog.tsx` (desktop dialog, mobile bottom sheet, project select, disabled states); component tests
- [x] 2.2 Rename the row menu item and callback to Move goals… / `onMoveGoals`; the header button opens the dialog; menu order test still passes

## 3. Copy and tour

- [x] 3.1 `goals.order.projectMove.*` keys (dialog title, choices, select label, disabled reasons) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; parity test passes
- [x] 3.2 Update `tour.projects.steps.moveGoals.*` text for the dialog in en/de/es/fr; tutorial test passes

## 4. Gates

- [x] 4.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 5. Desktop verification (viewport at or above 768px)

Required data states: three projects whose in-flight goals interleave in the order, one goal shared by two of them, an archived project, and an empty project.

- [x] 5.1 Before and After produce the worked-example orders; the goal in both projects stays
- [x] 5.2 The select lists only usable projects; with none, only To the top is enabled
- [x] 5.3 Undo still works from the dialog's moves

## 6. Mobile verification (viewport below 768px)

Same data states as group 5, through a 420px same-origin iframe.

- [x] 6.1 Bottom sheet from the card menu and the scoped header; the project select opens inside it
- [x] 6.2 Before and After behave as on desktop
