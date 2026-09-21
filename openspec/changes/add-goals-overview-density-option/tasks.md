## 1. Density type and persisted state

- [ ] 1.1 In `apps/web/src/fsd/entities/goal/model/types.ts`, add `GoalDensityValue = "comfortable" | "compact"` and an `isGoalDensityValue` type guard, mirroring `GoalGroupValue`/`isGoalGroupValue`'s exact shape. Export both from `apps/web/src/fsd/entities/goal/index.ts`. Verify with `pnpm typecheck`.
- [ ] 1.2 In `goals-page.tsx`, add persisted density state via `usePersistedSelection("goals.overview.density", isGoalDensityValue, "comfortable")`, following the existing `group` state's pattern. Verify by reading the updated component.

## 2. Density toggle control

- [ ] 2.1 Add a `GoalDensityToggle` component to `apps/web/src/fsd/entities/goal` (new file, e.g. `ui/goal-density-toggle.tsx`, exported from `index.ts`), rendering a two-option control (Comfortable/Compact) following `GoalFilters`' existing icon-with-hidden-label-on-mobile pattern (`{isMobile ? null : <SelectValue />}` or equivalent), with `data-testid="goals-density-toggle"` and an accessible name distinct from its current-value label (matching `GoalFilters`' `typeFilterAriaLabel`-style pattern). Verify by reading the new component.
- [ ] 2.2 Add the toggle to `goals-page.tsx`'s `goalFiltersAndSettings` row, next to the existing Group control. Verify by reading the updated component at both a sub-768px and an at/above-768px viewport read.
- [ ] 2.3 Add `goals.filters.density*` translation keys (label, aria-label, and the two option labels "Comfortable"/"Compact") to `apps/web/public/locales/en/common.json`, with matching real translations in `de/common.json`, `es/common.json`, `fr/common.json`. Verify by re-reading each edited file.

## 3. Apply density to the desktop table

- [ ] 3.1 Add an optional `density?: GoalDensityValue` field to `GoalsListProps` (`goal-row-utils.ts`), defaulting to `"comfortable"` at each read site per design.md's "Decisions". Verify with `pnpm typecheck`.
- [ ] 3.2 In `goals-list.tsx`'s `GoalsTable`, when `density === "compact"`: omit the Character column's goal-type caption line and the Status column's "Done By" second line (`EstimateCell`), reducing the row's fixed height accordingly; leave the avatar/linked-name, from→to Goal column, Progress column, Remaining column, status label(s), and Actions column unchanged. Verify by reading the updated component.
- [ ] 3.3 Add tests to the desktop-table test coverage (locate the existing `goals-list.tsx`/`goals-page.tsx` test file(s) covering `GoalsTable`) asserting: Compact hides the goal-type caption and Done-By line; Comfortable (default, and explicit) shows both; the other five columns' content is unchanged between densities. Verify with `pnpm --filter web test:run goals-list`.

## 4. Apply density to mobile cards

- [ ] 4.1 In `goals-mobile-cards.tsx`, when `density === "compact"`, omit the card's remaining-text/info footer line (the `GoalProgressDisplay`... footer content per design.md); leave the header, goal line, and progress bar unchanged. Verify by reading the updated component.
- [ ] 4.2 Add tests asserting: Compact omits the footer line; Comfortable (default, and explicit) shows it; header/goal-line/progress-bar content is unchanged between densities. Verify with `pnpm --filter web test:run goals-mobile-cards` (or the covering test file, whichever currently exists).

## 5. Project Detail is unaffected

- [ ] 5.1 Confirm `project-detail-goals.tsx`'s `GoalsList` call passes no `density` prop (so it defaults to Comfortable) and add a regression test asserting Project Detail always renders at Comfortable regardless of Goals Overview's last-persisted density value. Verify with `pnpm --filter web test:run project-detail`.

## 6. Tutorial

- [ ] 6.1 In `goals-page.tutorial.tsx`, add a tour step for the new toggle (`createStep('[data-testid="goals-density-toggle"]', "density")`, matching sibling steps' naming), and add its `tour.goalsOverview.steps.density.title`/`.content` keys to all four locales. Verify with the existing tutorial test coverage for this file.

## 7. Verification and gates

- [ ] 7.1 Manually verify in the browser (Aspire AppHost stack): on Goals Overview with several goals loaded, toggle between Comfortable and Compact at both a sub-768px and an at/above-768px viewport, confirming more rows/cards are visible on screen at Compact and the preference survives a reload. Confirm a project's detail route still renders at Comfortable regardless of the toggled Overview preference.
- [ ] 7.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
