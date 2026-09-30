## 1. Density type and persisted state

- [ ] 1.1 In `apps/web/src/fsd/entities/goal/model/types.ts`, add `GoalDensityValue = "comfortable" | "compact"` and an `isGoalDensityValue` type guard, mirroring `GoalGroupValue`/`isGoalGroupValue`'s exact shape. Export both from `apps/web/src/fsd/entities/goal/index.ts`. Verify with `pnpm typecheck`.
- [ ] 1.2 In `goals-page.tsx`, add persisted density state via `usePersistedSelection("goals.overview.density", isGoalDensityValue, "comfortable")`, following the existing `group` state's pattern. Verify by reading the updated component.

## 2. Density toggle control

- [ ] 2.1 Add a `GoalDensityToggle` component to `apps/web/src/fsd/entities/goal` (new file, e.g. `ui/goal-density-toggle.tsx`, exported from `index.ts`), rendering a two-option control (Comfortable/Compact) following `GoalFilters`' (`ui/goal-filters.tsx`) existing icon-with-hidden-label-on-mobile pattern, with `data-testid="goals-density-toggle"` and an accessible name distinct from its current-value label (matching `GoalFilters`' `typeFilterAriaLabel`-style pattern). Verify by reading the new component.
- [ ] 2.2 Add the toggle to `goals-page.tsx`'s desktop filters row (`goals-filters-row`, introduced by `add-goals-bulk-actions`), next to the existing Group control, and to the mobile icon row (`goalFilters` group) before the reorder/select toggles and Create Goal/Planning Settings buttons. Let the mobile control row wrap (`flex-wrap`) instead of clipping. Verify at 360px, below 768px and at/above 768px with the mobile reorder toggle visible.
- [ ] 2.3 Add `goals.filters.density*` translation keys (label, aria-label, and the two option labels "Comfortable"/"Compact") to `apps/web/public/locales/en/common.json` (next to the existing `goals.filters.*` keys), with matching real translations in `de/common.json`, `es/common.json`, `fr/common.json`. Verify by re-reading each edited file and `pnpm typecheck` (typed i18n keys).

## 3. Apply density to the desktop table

- [ ] 3.1 Add an optional `density?: GoalDensityValue` field to `GoalsListProps` (`goal-row-utils.ts`), defaulting to `"comfortable"` at each read site per design.md's "Decisions". Update the props' stale comment claiming reorder is project-detail only. Verify with `pnpm typecheck`.
- [ ] 3.2 In `goals-list.tsx`'s `GoalsTable`, when `density === "compact"`: omit the Character column's goal-type caption line and the Status column's "Done by" second line (`EstimateCell`) and use the shorter fixed row height (never shorter than the drag handle's usable target); keep the leading drag-handle cell, the avatar/linked name, from→to Goal column, Progress, Remaining, status label(s), and Actions unchanged; a row that renders level-requirement sub-lines keeps the Comfortable `h-14` height. Verify by reading the updated component.
- [ ] 3.3 Add tests to the desktop-table coverage (`goals-list.test.tsx`) asserting: Compact keeps the priority number beside the drag handle (that number ships with `consolidate-goals-into-plan-and-remove-active-project` task 3.7); Compact hides the goal-type caption and Done-by line; Comfortable (default, and explicit) shows both; the other columns' content is unchanged between densities; the drag handle (`goal-row-drag-handle`) still renders at Compact when `reorderEnabled`; a Rank row with level-requirement sub-lines keeps its sub-lines and Comfortable height at Compact. Verify with `pnpm --filter web test:run goals-list`.

## 4. Apply density to mobile cards

- [ ] 4.1 In `goals-mobile-cards.tsx`, when `density === "compact"`, tighten card padding and vertical gaps on the standard card list while retaining the remaining-text/info footer, its expandable explanation, project badges and level-requirement sub-lines; leave the collapsed drag-only reorder cards (`goals-list-reorder-cards`) unchanged. Verify the layout at a narrow viewport.
- [ ] 4.2 Add tests asserting both densities retain the footer and explanation interaction while Compact uses tighter spacing, and that reorder mode renders identically at both densities; verify with `pnpm --filter web test:run goals-mobile-cards` (or `goals-list`/`goals-page.reorder`, whichever covers it).

## 5. Project Detail is unaffected

- [ ] 5.1 Confirm `project-detail-goals.tsx`'s `GoalsList` call passes no `density` prop (so it defaults to Comfortable) and add a regression test asserting Project Detail always renders at Comfortable regardless of the Goals page's last-persisted density value. Verify with `pnpm --filter web test:run project-detail`.

## 6. Tutorial

- [ ] 6.1 In `goals-page.tutorial.tsx`, add a tour step for the new toggle (`createStep('[data-testid="goals-density-toggle"]', "density")`, extending the `key` union and placed beside the `filters` step, matching sibling steps' naming), and add its `tour.overview.steps.density.title`/`.content` keys to all four locales. Verify with the existing `goals-page.tutorial.test.tsx`.

## 7. Verification and gates

- [ ] 7.1 Manually verify in the browser (Aspire AppHost stack): on the Goals page (`/plan/goals`) with several goals including a project-context Actual/Potential bar and a Rank goal below its required level, toggle between Comfortable and Compact at 360px, below 768px and at/above 768px, confirming more rows/cards are visible, drag reordering still works at both densities, the mobile explanation remains operable, the control row is fully reachable, and the preference survives a reload. Test a representative large plan at screenshot dimensions for `GUI-04`; record whether a separate presentation is needed. Confirm Project Detail remains Comfortable.
- [ ] 7.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
