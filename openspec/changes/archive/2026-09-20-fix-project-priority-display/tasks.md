## 1. Shared filter component

- [x] 1.1 Revert `GoalSortValue` to `"entity" | "type" | "status" | "updated"` (drop `"priority"`) and remove the `includePrioritySort` prop and its rendering branch from `GoalFilters` (`entities/goal/ui/goal-filters.tsx`) — this change's first cut added both; neither is needed once Project Detail's Sort control is removed rather than defaulted.
- [x] 1.2 Add `showTypeFilter?: boolean` and `showSort?: boolean` props to `GoalFilters`, both defaulting to `true`; when `false`, that trigger does not render at all (Group and the caller's status filter are unaffected — `GoalFilters` itself never rendered a status filter). Verify with a component test: both omitted renders Type+Sort+Group as today; both `false` renders Group only.
- [x] 1.3 Update `entities/goal/ui/goal-filters.test.tsx`: remove the `includePrioritySort`/Priority-option tests from this change's first cut, add coverage for `showTypeFilter={false}`/`showSort={false}` hiding those triggers.

## 2. Project Detail

- [x] 2.1 Pass `showTypeFilter={false} showSort={false}` to `<GoalFilters>` on `project-detail-page.tsx`. Remove the `goalType`/`sort` state, the `GoalTypeFilterValue`/`GoalSortValue` imports they required, and the Type-filter/Sort-comparator logic; `filteredAllRows`/`filteredNonArchivedRows` become plain aliases for `allRows`/`nonArchivedRows` (no type filtering left), and the goal list's sort becomes the single unconditional `(a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER)`.
- [x] 2.2 Verify Goals Overview (`goals-page.tsx`) is unaffected: it does not pass `showTypeFilter`/`showSort`, so both default `true` and its Type/Sort controls render exactly as before (`pnpm typecheck` clean, its own tests unchanged).

## 3. Tests

- [x] 3.1 Update `project-detail-page.test.tsx`: remove/replace tests that exercised the Type filter or the Sort control on project detail (they no longer exist there — assert their triggers are absent instead, e.g. `queryByTestId("goals-type-filter")`/`queryByTestId("goals-sort")` are not in the document), and update every test that previously changed Sort or Type mid-test to no longer do so. Keep/adjust the priority-ordering and historical-goals-follow-in-flight assertions this change's first cut added, since the underlying behavior (unconditional priority order) still holds — only how it's reached (no longer via a Sort selection) changes.
- [x] 3.2 Remove the "Priority is unavailable on Goals Overview" test this change's first cut added to `goals-page.test.tsx` only if it becomes redundant with an unchanged, already-passing assertion — otherwise leave Overview's tests as they were before this change (Overview is not in scope for the revised direction). Kept: it's the only test explicitly guarding that Overview's Sort control has no Priority option.

## 4. Repository gates

- [x] 4.1 `pnpm test:run` — 235 files, 1823 tests passing.
- [x] 4.2 `pnpm typecheck`
- [x] 4.3 `pnpm lint` (eslint + knip)
- [x] 4.4 `pnpm lint:fsd`
- [x] 4.5 `git diff --check`
- [x] 4.6 Manual verification against the running Aspire stack (reuse the already-running local stack and its signed-in browser session if available): open a project with several in-flight goals under an established (non-trivial) priority order at both a desktop width (≥768px) and a mobile width (<768px); confirm no Type filter or Sort control renders on project detail, confirm the goal list is in priority order (historical goals following in-flight ones), and confirm Goals Overview's Type and Sort controls are both still present and working as before.
