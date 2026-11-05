# Tasks

## 1. Bulk add to several projects

- [ ] 1.1 Multi-select destination picker (desktop popover with checkboxes, mobile sheet); sequential per-destination requests with the existing stale retry; combined and partial-failure toasts with Retry for failed destinations only; tests for every `goal-bulk-actions` scenario

## 2. Add to another project

- [ ] 2.1 Row menu item after Edit (scoped and unscoped, desktop and mobile) opening the membership picker; membership-only save; disabled while projects load; tests

## 3. Portraits

- [ ] 3.1 `project-unit-portraits.tsx` (first 4 distinct units by priority, "+N", sizes for card and widget); tests for ordering, "+N", no goals, and skeleton
- [ ] 3.2 Use on Projects page cards and home widget cards; test that the widget still issues only the projects and goals reads

## 4. Target kind filter

- [ ] 4.1 Chips derived from listed projects, hidden below 2 kinds, `?kind=` state, reset when the kind disappears; tests for each scenario and for the back-navigation case

## 5. Copy and tour

- [ ] 5.1 `goals.bulk.*` and `goals.project.*` keys (multi-select picker, toasts, Retry, row menu item, kind chips, portraits' accessible label) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; parity test passes
- [ ] 5.2 Add a `kindFilter` step targeting `[data-testid="projects-kind-filter"]` to desktop and mobile steps in `projects-list-page.tutorial.tsx` (skipped when hidden), with `tour.projects.steps.kindFilter.*` in en/de/es/fr; tutorial test passes

## 6. Gates

- [ ] 6.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 7. Desktop verification (viewport at or above 768px)

Required data states: projects with 0, 3 and 6 distinct units; projects with at least 2 target kinds and one without a target; at least 3 goals to bulk-select.

- [ ] 7.1 Bulk Add to project with two destinations; partial failure toast (simulated) with Retry
- [ ] 7.2 Add to another project… from a row menu, scoped and unscoped
- [ ] 7.3 Portraits and "+N" on Projects page and home widget cards
- [ ] 7.4 Kind filter chips, `?kind=` survives reload, reset when the kind disappears
- [ ] 7.5 Projects tour shows the kind filter step

## 8. Mobile verification (viewport below 768px)

Same data states as group 7, through a 420px same-origin iframe.

- [ ] 8.1 Bulk picker sheet with checkboxes; Add to another project… sheet from a card menu
- [ ] 8.2 Portraits on mobile cards and the home widget
- [ ] 8.3 Horizontally scrolling kind chips; Projects tour on mobile
