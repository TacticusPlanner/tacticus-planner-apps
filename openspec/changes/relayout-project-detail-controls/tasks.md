## 1. `GoalFilters` supports a restricted Group option set

- [x] 1.1 Add `groupOptions?: GoalGroupValue[]` to `GoalFilters` (default: `["none", "unit", "type"]`, i.e. today's behavior); render only the `SelectItem`s named in it. Update/add unit tests in `goal-filters.test.tsx` covering the restricted case.

## 2. Project detail clamps a persisted "unit" selection

- [x] 2.1 In `project-detail-page.tsx`, clamp the value read from `usePersistedSelection("goals.projectDetail.group", ...)` so `"unit"` renders as `"type"` on this route (without rewriting the stored value), and pass `groupOptions={["none", "type"]}` to `GoalFilters`. Add a test asserting a pre-seeded `"unit"` persisted value renders grouped by type.

## 3. Move the browsing controls into the header, with labels

- [x] 3.1 Add label strings to all 4 locale files (`en`/`de`/`es`/`fr`): "Project", "Filter", "Group By" (reuse existing keys if any already say exactly this; otherwise add new `goals.project.*Label` keys). Validate JSON syntax on all 4.
- [x] 3.2 In `project-detail-header.tsx`, accept the status-filter and Group control's props (value/onChange/counts, and the Group value/onChange/`groupOptions`) and render `StatusFilterSelect` and `GoalFilters` inside the header card next to `ProjectSelect`, each preceded by its visible label. Update `data-testid`s only if the existing ones (`projects-status-filter`, `projects-goal-project-select`) need to move with the elements — keep the same testids so existing tests relying on them by id, not position, still pass.
- [x] 3.3 In `project-detail-page.tsx`, remove the now-redundant status-filter row and the `GoalFilters` render below the header, passing that state/props into `ProjectDetailHeader` instead.
- [x] 3.4 Update `project-detail-page.test.tsx` and any `project-detail-header` tests for the new control locations and labels; update `project-detail-page.tutorial.tsx` step targets if any `data-testid` moved into the header changes the tour's step order or copy.

## 4. Verify

- [x] 4.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and the scoped goals test suite (`pnpm exec vitest run src/fsd/pages/goals src/fsd/entities/goal`) for fast iteration - all clean.
- [x] 4.2 Before calling this done, run the full PR-validation set AGENTS.md requires: `pnpm test:run` and `pnpm build` - all clean.
- [ ] 4.3 Manually verify on the running dev server: project detail shows Project/Filter/Group By labeled together in the header, Group offers only "No grouping"/"By type" (no "By unit"), and Goals Overview's own Group control still offers "By unit" unchanged. (Not done in this worktree - needs a running dev server; automated test coverage above stands in for it.)
