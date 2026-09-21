## 1. Implementation

- [x] 1.1 In `apps/web/public/locales/en/dailies.json`, change `schedule.raids_one` to `"{{count}} attempt used"` and `schedule.raids_other` to `"{{count}} attempts used"` — verify by re-reading the edited keys.
- [x] 1.2 In the same file, change `schedule.node` from `"{{node}} · {{raids}} raids"` to `"{{node}} · {{raids}} attempts used"` — verify by re-reading the edited key.
- [x] 1.3 Apply the equivalent reworded translations to `apps/web/public/locales/de/dailies.json`, `es/dailies.json`, and `fr/dailies.json` for the same three keys, at the quality of the surrounding sibling strings in each file — this is part of the task, not a placeholder to translate later. Verify by reading each edited file back and confirming no English text remains in the non-English locales.

## 2. Tests

- [x] 2.1 Run the existing `resource-card`/`raid-schedule`/`today-page`/`dailies-pages` test suites and confirm they still pass unchanged — these tests mock `t` to return the key plus its interpolation values, not the rendered English string, so no test assertions should need editing. Verify with `pnpm --filter web test:run dailies`.
- [x] 2.2 Manually verify the reworded label renders correctly in the Today page and Raids Plan page, in English and at least one other locale (e.g. Spanish) — check the Aspire stack is already running before starting a fresh one; if unavailable, report the specific missing state rather than skipping verification silently.

## 3. Gates

- [x] 3.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
