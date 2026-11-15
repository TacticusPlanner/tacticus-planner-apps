# Tasks

## 1. Portraits

- [x] 1.1 `project-unit-portraits.tsx` (first 4 distinct units by priority, "+N", sizes for card and widget, one accessible label); tests for ordering, "+N", no goals, and skeleton
- [x] 1.2 Use on Projects page cards and home widget cards; test that the widget still issues only the projects and goals reads

## 2. Copy

- [x] 2.1 `goals.project.portraits.*` keys (accessible label with "and N more") in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; parity test passes

## 3. Gates

- [x] 3.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 4. Desktop verification (viewport at or above 768px)

Required data states: projects with 0, 3 and 6 distinct units.

- [ ] 4.1 Portraits and "+N" on Projects page cards
- [ ] 4.2 Smaller portraits on home widget cards

## 5. Mobile verification (viewport below 768px)

Same data states as group 4, through a 420px same-origin iframe.

- [ ] 5.1 Portraits on mobile Projects cards and the home widget
