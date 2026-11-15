# Tasks

## 1. Bulk add to several projects

- [x] 1.1 Multi-select destination picker (desktop popover with checkboxes, mobile sheet); sequential per-destination requests with the existing stale retry; combined and partial-failure toasts with Retry for failed destinations only; tests for every `goal-bulk-actions` scenario

## 2. Add to another project

- [x] 2.1 Row menu item after Edit (Table and Cards view, scoped and unscoped, desktop and mobile) opening the membership picker; membership-only save; disabled while projects load; tests

## 3. Copy

- [x] 3.1 `goals.bulk.*` and `goals.project.*` keys (multi-select picker, toasts, Retry, row menu item) in `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations; parity test passes

## 4. Gates

- [x] 4.1 Targeted tests, `pnpm typecheck`, `pnpm lint` (changed files), `pnpm lint:fsd`, `git diff --check`; the full suite runs in CI

## 5. Desktop verification (viewport at or above 768px)

Required data states: at least 3 projects and at least 3 goals to bulk-select, one already in a chosen project.

- [ ] 5.1 Bulk Add to project with two destinations; partial failure toast (simulated) with Retry
- [ ] 5.2 Add to another project… from a row menu in Table and Cards view, scoped and unscoped

## 6. Mobile verification (viewport below 768px)

Same data states as group 5, through a 420px same-origin iframe.

- [ ] 6.1 Bulk picker sheet with checkboxes
- [ ] 6.2 Add to another project… sheet from a card menu
