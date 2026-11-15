# Tasks

## 0. Legendary Event deadline

- [x] 0.1 Move `legendaryEventRunDates` and its types from `pages/legendary-events/lib/run-dates.ts` to `entities/legendary-event`; update the LE page imports; its tests move with it and the LE Overview and plan wizard tests still pass
- [x] 0.2 `entities/project/model/deadline/resolve-project-deadline.ts` (`resolveProjectDeadline` for Legendary Event targets: named run or next run, estimated, loading, unavailable, ended) reading `entities/legendary-event` through `entities/legendary-event/@x/project.ts`; tests for every `specs/project-deadline` scenario
- [x] 0.3 `useProjectDeadline(project)` exported from `@/entities/project`; hook test for loading, unavailable and ready; run `pnpm lint:fsd`

## 1. Fit logic

- [x] 1.1 `features/goal-planning/model/deadline-fit/deadline-fit.ts` (`deadlineFit`, `deadlineFitSummary`, `deadlineCutoffGoalId`), reusing Season fit's `isSeasonFitEligible` and `completionInstantMs`; tests for the Legendary Event worked example, the deadline-day boundary, Reached/Completed counting as fit, Paused/Blocked/unestimated counted as not estimated, "All N done", and cut-off placement
- [x] 1.2 `useProjectDeadlineFit` and `useProjectFitCounts`, exported from `features/goal-planning/index.ts`; hook tests for off, loading, unavailable, ended and ready

## 2. Goals page

- [x] 2.1 Deadline header in the scope bar (desktop) and above the cards (mobile), with skeleton, ended and unavailable states (Move to next season/run is added by `add-project-deadline-targets`)
- [x] 2.2 Fit label and accent beside Done By in Table rows and in cards (desktop Cards view and mobile); divider with Group None in Table view, desktop Cards view (full grid width) and mobile, including mobile reorder mode
- [x] 2.3 Season fit override: read-only chip in the select slot in a targeted scope; stored choice kept; tests for override, return to unscoped, and untargeted scope
- [x] 2.4 Page tests for every `project-deadline-fit` scenario

## 3. Cards

- [x] 3.1 `fitSummary` slot on `project-summary-row.tsx`; `pages/goals` Projects route and `pages/home` widget pass `useProjectFitCounts`; test that the home widget runs no plan when no project has a target and still issues only the projects and goals reads

## 4. Copy and tour

- [x] 4.1 `goals.deadlineFit.*` keys (header, counts, not estimated, all done, ended, no date, labels, divider, override chip) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; parity test passes and no de/es/fr value is English
- [x] 4.2 Add a `deadlineFit` step targeting `[data-testid="goals-deadline-fit"]` to both desktop and mobile steps in `goals-page.tutorial.tsx`, shown only in a targeted scope, with `tour.overview.steps.deadlineFit.*` in en/de/es/fr; tutorial test passes

## 5. Gates

- [x] 5.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 6. Desktop verification (viewport at or above 768px)

Required data states: a project targeting a Legendary Event whose next run is in the future, with goals that fit, miss by 1 to 7 days and miss by more than 7 days, plus a Reached and a Paused goal; a project targeting an event whose run 3 has started (ended); a project targeting an event the catalog doesn't serve; an untargeted project; Season fit set to Battle Pass.

- [x] 6.1 Header text and counts, labels, accents and divider in the targeted scope, in Table and Cards view
- [ ] 6.2 Ended project header and no labels; unavailable project header reads No date available
- [x] 6.3 Override chip in the targeted scope; Battle Pass returns on unscoped Goals and in the untargeted project
- [x] 6.4 Fit count on Projects page and home widget cards
- [x] 6.5 Goals tour shows the deadline step in the targeted scope

## 7. Mobile verification (viewport below 768px)

Same data states as group 6, through a 420px same-origin iframe.

- [x] 7.1 Header above the cards; labels, accents, divider (also in reorder mode)
- [x] 7.2 Override chip in the second control row
- [x] 7.3 Fit count on mobile project cards and the home widget
- [ ] 7.4 Goals tour on mobile
