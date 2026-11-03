# Tasks

## 1. Picker

- [ ] 1.1 `priorityPickerOptions` in `features/goal-planning/model/goal-order/` with tests for the five-goal example, hidden-by-filter goals counted, and the current marker
- [ ] 1.2 `PriorityPicker` combobox (desktop popover, mobile full width with pinned search, virtualized past 100 rows); search by number, unit name and goal type; component tests for the search scenarios
- [ ] 1.3 Export through `features/goal-planning/index.ts` and `@x/goal-create.ts`; run `pnpm lint:fsd`

## 2. Consumers

- [ ] 2.1 Edit goal dialog: Priority uses the picker and moves first; regression tests for the existing priority scenarios (move up, move down, unchanged, stale order) and the field order
- [ ] 2.2 Move to priority… uses the picker; regression tests for the existing scenarios

## 3. Copy and tour

- [ ] 3.1 `goals.order.*` / `goals.edit.*` keys (search placeholder, current marker, no match, accessible names) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; parity test passes
- [ ] 3.2 `goal-edit-dialog.tutorial.tsx`: priority step first in desktop and mobile lists, copy mentions the goal hints; update `tour.editGoal.steps.priority.*` in en/de/es/fr; tutorial test passes

## 4. Gates

- [ ] 4.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 5. Desktop verification (viewport at or above 768px)

Required data states: at least six in-flight goals across several units and goal types, one Paused, and a filter that hides some of them.

- [ ] 5.1 Edit goal dialog shows Priority first; options name each goal; search by number and unit; save moves the goal
- [ ] 5.2 Move to priority… uses the picker and counts hidden goals
- [ ] 5.3 Edit goal tour starts with the priority step

## 6. Mobile verification (viewport below 768px)

Same data states as group 5, through a 420px same-origin iframe.

- [ ] 6.1 Full-width picker with pinned search in the Edit goal sheet and Move to priority…
- [ ] 6.2 Edit goal tour on mobile starts with the priority step
