# Tasks

## 0. Prerequisite

- [x] 0.1 `add-project-deadline-fit` has merged (#625) (it provides `resolveProjectDeadline`, `useProjectDeadline` and `legendaryEventRunDates` in `entities/legendary-event`)
- [ ] 0.2 Companion `tacticus-planner-api` change `add-project-deadline-targets` merges first; regenerate `apps/web/src/fsd/shared/api/schema.d.ts` and update the hand-written `entities/project/model/types.ts` target union and mapper (absent `run` reads as null)

## 1. Season windows move to an entity

- [ ] 1.1 Create `entities/game-event` with `resolveSeasonWindows` and `SeasonWindows` moved from `features/goal-planning/model/season-fit/season-windows.ts` (tests move with it); add `seasonStartMs`, tested against the Battle Pass, Guild Raid and Guild War worked examples and an authored-occurrence override
- [ ] 1.2 Point Season fit (`features/goal-planning/model/season-fit/`) at `@/entities/game-event`; its existing tests pass unchanged
- [ ] 1.3 Run `pnpm lint:fsd` after the move

## 2. Deadline model

- [ ] 2.1 Extend `entities/project/model/deadline/resolve-project-deadline.ts` with season and date branches, and add `nextTarget` and `projectTargetLabel`; tests for every worked example in `specs/project-deadline`, unserved definition (unavailable), loading, and the ended cases
- [ ] 2.2 `useProjectDeadline(project)` reads the season definitions through `entities/game-event/@x/project.ts`; hook test for a season target

## 3. Form, chip and actions

- [ ] 3.1 Related to becomes kind then detail (`project-target-field.tsx`): LE event and run, season list (rolling first, next 5), date field; disabled kinds with reason; tests for create, edit, clear, Default and each kind
- [ ] 3.2 Target chip for every kind with the tooltip, Ended suffix, and LE link (`project-target-chip.tsx`); tests
- [ ] 3.3 Projects row menu: Move to next season / Move to next run for ended targets; test the update payload
- [ ] 3.4 Plan wizard (`pages/legendary-events/ui/plan-wizard/use-plan-create.ts`) sends the planned run; test
- [ ] 3.5 Target kind filter on the Projects page: chips derived from listed projects, hidden below 2 kinds, `?kind=` state, reset when the kind disappears; tests for each scenario and for the back-navigation case
- [ ] 3.6 The deadline header from `add-project-deadline-fit` shows Move to next season / Move to next run for an ended target; test

## 4. Copy and tour

- [ ] 4.1 `goals.project.*` keys (kinds, Run options, season rows, Date field, chips, tooltips, Ended, Move to next season/run, disabled reason, kind filter chips) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; key parity test passes and no de/es/fr value is English
- [ ] 4.2 Update `pages/goals/ui/projects/projects-list-page.tutorial.tsx` so the Related to step describes targets and deadlines, and add a `kindFilter` step targeting `[data-testid="projects-kind-filter"]` (skipped when the chips are hidden), in the desktop and mobile steps, with `tour.projects.steps.*` in en/de/es/fr; tutorial test passes

## 5. Gates

- [ ] 5.1 Targeted tests for the touched files, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 6. Desktop verification (viewport at or above 768px)

Required data states: one project per kind (LE with run, LE next run, rolling and pinned Battle Pass, pinned Guild Raid, pinned Guild War, a future date), one ended pinned Battle Pass season, one ended date, and the Default project.

- [ ] 6.1 Related to: kind then detail for each kind, season rows and dates match the resolver, Default shows no field
- [ ] 6.2 Chips and tooltips for each kind; Ended suffix; LE chip links to the event
- [ ] 6.3 Move to next season on the ended season project; no action on the ended date
- [ ] 6.4 Kind filter chips, `?kind=` survives reload, reset when the kind disappears
- [ ] 6.5 Projects tour shows the updated Related to step and the kind filter step

## 7. Mobile verification (viewport below 768px)

Same data states as group 6, through a 420px same-origin iframe.

- [ ] 7.1 Related to in the mobile Sheet for each kind
- [ ] 7.2 Chips, Ended suffix and the row-menu action on mobile cards
- [ ] 7.3 Horizontally scrolling kind chips; Projects tour on mobile
