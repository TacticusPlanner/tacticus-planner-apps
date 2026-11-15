# Tasks

## 1. Order logic

- [ ] 1.1 `moveProjectGoals(order, movedIds, { kind: "top" })` in `features/goal-planning/model/goal-order/` with tests for the order worked example, Paused goals, a shared goal, and an already-first block
- [ ] 1.2 `useMoveProjectGoals` (one `PUT /api/v1/goals/order`, announcement, undo with stale handling); tests with a mocked API for success, stale move, undo and stale undo

## 2. UI

- [ ] 2.1 Projects row menu item via an `onMoveGoalsToTop` callback from `pages/goals`; menu order test; hidden for empty and archived projects; disabled when already first
- [ ] 2.2 Scoped Goals header button (icon-only with an accessible name on mobile); deadline header button when a miss is shown (once `add-project-deadline-fit` exists)

## 3. Copy and tour

- [ ] 3.1 `goals.order.projectMove.*` keys (menu item, disabled reason, announcement, toast, undo, stale undo) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; parity test passes
- [ ] 3.2 Add a `moveGoals` step targeting `[data-testid="project-move-goals"]` to the desktop and mobile steps of `projects-list-page.tutorial.tsx`, with `tour.projects.steps.moveGoals.*` in en/de/es/fr; tutorial test passes

## 4. Gates

- [ ] 4.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 5. Desktop verification (viewport at or above 768px)

Required data states: three projects whose in-flight goals interleave in the order, one goal shared by two of them, a Paused goal in the moved project, an archived project, and an empty project.

- [ ] 5.1 Row menu shows Move goals to top in the right place; hidden for the empty and archived projects
- [ ] 5.2 The move produces the worked-example order; the shared goal moves; the Paused goal stays Paused
- [ ] 5.3 Undo restores; Undo after another drag shows the stale message
- [ ] 5.4 Projects tour shows the Move goals step

## 6. Mobile verification (viewport below 768px)

Same data states as group 5, through a 420px same-origin iframe.

- [ ] 6.1 Move goals to top from the card menu and the scoped header button
- [ ] 6.2 Move and undo behave as on desktop
- [ ] 6.3 Projects tour on mobile
