# Tasks

## 1. Dialog

- [x] 1.1 Move the Priority field first in `features/goal-planning/ui/goal-edit/` on desktop and mobile; test the field order for a Rank goal and an Unlock goal; the existing priority scenarios still pass

## 2. Tour

- [x] 2.1 `goal-edit-dialog.tutorial.tsx`: priority step first in the desktop and mobile step lists; tutorial test passes

## 3. Gates

- [x] 3.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 4. Desktop verification (viewport at or above 768px)

Required data states: an Active Rank goal and an Unlock goal.

- [ ] 4.1 Edit goal dialog shows Priority first for both goals
- [ ] 4.2 Edit goal tour starts with the priority step

## 5. Mobile verification (viewport below 768px)

Same data states as group 4, through a 420px same-origin iframe.

- [ ] 5.1 Edit goal sheet shows Priority first
- [ ] 5.2 Edit goal tour on mobile starts with the priority step
