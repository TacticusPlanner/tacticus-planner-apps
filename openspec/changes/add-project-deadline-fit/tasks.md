# Tasks

## 0. Prerequisite

- [ ] 0.1 `add-project-deadline-targets` provides `useProjectDeadline` (Legendary Event targets can be built and tested first)

## 1. Fit logic

- [ ] 1.1 `features/goal-planning/model/deadline-fit/deadline-fit.ts` (`deadlineFit`, `deadlineFitSummary`, `deadlineCutoffGoalId`), reusing Season fit's `isSeasonFitEligible` and `completionInstantMs`; tests for the Guild War season 29 worked example, the deadline-day boundary, Reached/Completed counting as fit, Paused/Blocked/unestimated counted as not estimated, "All N done", and cut-off placement
- [ ] 1.2 `useProjectDeadlineFit` and `useProjectFitCounts`, exported from `features/goal-planning/index.ts`; hook tests for off, loading, unavailable, ended and ready

## 2. Goals page

- [ ] 2.1 Deadline header in the scope bar (desktop) and above the cards (mobile), with skeleton, ended and unavailable states and Move to next season/run
- [ ] 2.2 Fit label and accent beside Done By on rows and cards; divider with Group None, including mobile reorder mode
- [ ] 2.3 Season fit override: read-only chip in the select slot in a targeted scope; stored choice kept; tests for override, return to unscoped, and untargeted scope
- [ ] 2.4 Page tests for every `project-deadline-fit` scenario

## 3. Cards

- [ ] 3.1 `fitSummary` slot on `project-summary-row.tsx`; `pages/goals` Projects route and `pages/home` widget pass `useProjectFitCounts`; test that the home widget runs no plan when no project has a target and still issues only the projects and goals reads

## 4. Copy and tour

- [ ] 4.1 `goals.deadlineFit.*` keys (header, counts, not estimated, all done, ended, no date, labels, divider, override chip) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; parity test passes and no de/es/fr value is English
- [ ] 4.2 Add a `deadlineFit` step targeting `[data-testid="goals-deadline-fit"]` to both desktop and mobile steps in `goals-page.tutorial.tsx`, shown only in a targeted scope, with `tour.overview.steps.deadlineFit.*` in en/de/es/fr; tutorial test passes

## 5. Gates

- [ ] 5.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 6. Desktop verification (viewport at or above 768px)

Required data states: a project targeting a future Guild War season with goals that fit, miss by 1 to 7 days and miss by more than 7 days, plus a Reached and a Paused goal; a project with an ended Battle Pass season; an untargeted project; Season fit set to Battle Pass.

- [ ] 6.1 Header text and counts, labels, accents and divider in the targeted scope
- [ ] 6.2 Ended project header with Move to next season and no labels
- [ ] 6.3 Override chip in the targeted scope; Battle Pass returns on unscoped Goals and in the untargeted project
- [ ] 6.4 Fit count on Projects page and home widget cards
- [ ] 6.5 Goals tour shows the deadline step in the targeted scope

## 7. Mobile verification (viewport below 768px)

Same data states as group 6, through a 420px same-origin iframe.

- [ ] 7.1 Header above the cards; labels, accents, divider (also in reorder mode)
- [ ] 7.2 Override chip in the second control row
- [ ] 7.3 Fit count on mobile project cards and the home widget
- [ ] 7.4 Goals tour on mobile
