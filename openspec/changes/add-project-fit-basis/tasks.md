# Tasks

## 0. Prerequisite

- [ ] 0.1 `add-project-deadline-fit` for the fit labels; dates-only behaviour can ship without it

## 1. Logic

- [ ] 1.1 `useProjectAloneEstimates(projectId, enabled)` in `features/goal-planning/model/estimate/`, reusing `computePlanInsights` with the project's Active goals and the global inputs; tests for the worked example, relative order kept, Paused excluded, not computed while disabled, and memoization
- [ ] 1.2 Export from `features/goal-planning/index.ts`

## 2. Goals page

- [ ] 2.1 Segmented control (desktop beside the header or scope bar, mobile full width above cards) persisted with `usePersistedSelection("goals.overview.fitBasis", "fullPlan")`; hidden unscoped
- [ ] 2.2 Done By cells show the alone date with "if prioritised"; fits, header and divider follow the selected basis; skeleton while computing
- [ ] 2.3 Page tests for every `project-fit-basis` scenario, including cards ignoring the toggle

## 3. Copy and tour

- [ ] 3.1 `goals.fitBasis.*` keys (segment labels, hint, accessible name) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; parity test passes
- [ ] 3.2 Add a `fitBasis` step targeting `[data-testid="goals-fit-basis"]` to desktop and mobile steps in `goals-page.tutorial.tsx`, with `tour.overview.steps.fitBasis.*` in en/de/es/fr; tutorial test passes

## 4. Gates

- [ ] 4.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 5. Desktop verification (viewport at or above 768px)

Required data states: a targeted project with a goal that misses under Full plan but fits alone, a higher-priority goal from another project, and an untargeted project.

- [ ] 5.1 Toggle in the header; alone dates with the hint; fit labels and header change
- [ ] 5.2 Toggle on the untargeted project shows dates only
- [ ] 5.3 Projects page cards unchanged by the toggle
- [ ] 5.4 Goals tour shows the fit basis step

## 6. Mobile verification (viewport below 768px)

Same data states as group 5, through a 420px same-origin iframe.

- [ ] 6.1 Full-width control above the cards; cards show the alone dates and labels
- [ ] 6.2 Goals tour on mobile
