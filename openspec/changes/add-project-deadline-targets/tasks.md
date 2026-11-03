# Tasks

## 0. Prerequisite

- [ ] 0.1 Companion `tacticus-planner-api` change `add-project-deadline-targets` merges first; regenerate `apps/web/src/fsd/shared/api/schema.d.ts` and update the hand-written `entities/project/model/types.ts` target union and mapper (absent `run` reads as null)

## 1. Shared resolvers move to entities

- [ ] 1.1 Create `entities/game-event` with `resolveSeasonWindows` and `SeasonWindows` moved from `features/goal-planning/model/season-fit/season-windows.ts` (tests move with it); add `seasonStartMs`, tested against the Battle Pass, Guild Raid and Guild War worked examples and an authored-occurrence override
- [ ] 1.2 Move `legendaryEventRunDates` and its types from `pages/legendary-events/lib/run-dates.ts` to `entities/legendary-event`; update the LE page imports; regression tests for the LE Overview and plan wizard dates still pass
- [ ] 1.3 Point Season fit (`features/goal-planning/model/season-fit/`) at `@/entities/game-event`; its existing tests pass unchanged
- [ ] 1.4 Run `pnpm lint:fsd` after the moves

## 2. Deadline model

- [ ] 2.1 `entities/project/model/deadline/resolve-project-deadline.ts` (`resolveProjectDeadline`, `nextTarget`, `projectTargetLabel`) with tests for every worked example in `specs/project-deadline`, LE next run and run 3 started, unannounced run (estimated), unserved event or definition (unavailable), loading, and the ended cases
- [ ] 2.2 `useProjectDeadline(project)` with `@x` imports from `entities/game-event` and `entities/legendary-event`; export from `@/entities/project`; hook test for loading, unavailable and ready

## 3. Form, chip and actions

- [ ] 3.1 Related to becomes kind then detail (`project-target-field.tsx`): LE event and run, season list (rolling first, next 5), date field; disabled kinds with reason; tests for create, edit, clear, Default and each kind
- [ ] 3.2 Target chip for every kind with the tooltip, Ended suffix, and LE link (`project-target-chip.tsx`); tests
- [ ] 3.3 Projects row menu: Move to next season / Move to next run for ended targets; test the update payload
- [ ] 3.4 Plan wizard (`pages/legendary-events/ui/plan-wizard/use-plan-create.ts`) sends the planned run; test

## 4. Copy and tour

- [ ] 4.1 `goals.project.*` keys (kinds, Run options, season rows, Date field, chips, tooltips, Ended, Move to next season/run, disabled reason) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; key parity test passes and no de/es/fr value is English
- [ ] 4.2 Update `pages/goals/ui/projects/projects-list-page.tutorial.tsx` so the Related to step describes targets and deadlines (desktop and mobile steps), with `tour.projects.steps.*` in en/de/es/fr; tutorial test passes

## 5. Gates

- [ ] 5.1 Targeted tests for the touched files, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 6. Desktop verification (viewport at or above 768px)

Required data states: one project per kind (LE with run, LE next run, rolling and pinned Battle Pass, pinned Guild Raid, pinned Guild War, a future date), one ended pinned Battle Pass season, one ended date, and the Default project.

- [ ] 6.1 Related to: kind then detail for each kind, season rows and dates match the resolver, Default shows no field
- [ ] 6.2 Chips and tooltips for each kind; Ended suffix; LE chip links to the event
- [ ] 6.3 Move to next season on the ended season project; no action on the ended date
- [ ] 6.4 Projects tour shows the updated Related to step

## 7. Mobile verification (viewport below 768px)

Same data states as group 6, through a 420px same-origin iframe.

- [ ] 7.1 Related to in the mobile Sheet for each kind
- [ ] 7.2 Chips, Ended suffix and the row-menu action on mobile cards
- [ ] 7.3 Projects tour on mobile
