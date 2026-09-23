## 1. Contract and canonical planning input

- [ ] 1.1 Consume the paired API's global priority, order revision, and reorder contract in the goal entity public API; verify typed API tests and remove calls to retired project-order mutation.
- [ ] 1.2 Build one deduplicated Active-goal selector in canonical global order, retaining Paused positions for display; verify fixtures with a shared goal, cross-project goals, mixed Character/Machine-of-War goals, and terminal goals.
- [ ] 1.3 Refactor the planning engine integration to produce one account-wide result containing per-goal needs, inventory/XP/token allocations, blockers, dates, and day rows, then derive filtered summaries from it; verify existing Today, Raids Plan, Insights, and estimate regression suites plus cross-project contention tests.
- [ ] 1.4 Reproduce RAID-004 with an interleaved Character/Machine-of-War fixture, tracing requirement derivation, inventory allocation, and rendered order; verify the fixture passes in both Today and Raids Plan and fix a type-specific sort only if it fails.

## 2. Global Goals interaction

- [ ] 2.1 Add `/goals/plan` with each in-flight goal once and distinct loading, failure/retry, no-goals, and no-actionable-demand states; verify route and component tests at both breakpoints.
- [ ] 2.2 Implement desktop drag and mobile collapsed-card reorder mode with complete-set/revision submission and no filtered reorder; verify interaction tests for cross-project moves, dependency inversion, Paused goals, and keyboard/touch accessibility.
- [ ] 2.3 Preserve attempted moves on stale order conflicts, refresh canonical state, and require reviewed retry; verify concurrent goal creation/status-change tests and absence of false success feedback.
- [ ] 2.4 Make project detail a filtered global-order projection, replace its drag UI with a Global Plan link, and update project dashboard/Current plan explanations; verify project route, empty-state, membership, and responsive regression tests.

## 3. Planning consumers and presentation

- [ ] 3.1 Remove the Raids sub-tabs' project execution selector and feed Today, Bonus Raids, and Raids Plan the global Active-goal input while preserving Today's Attempts as account-wide; verify tab parity and distinct goal-load versus empty states.
- [ ] 3.2 Audit Shop, Arena, Onslaught, and Salvage recommendation inputs: retain project focus only as an explicitly labeled browsing/team lens, never as the canonical raid/estimate resource pool; verify regression tests that changing the focus leaves the global raid plan unchanged.
- [ ] 3.3 Make Insights, project completion outlook, goal detail/list Done By, and Actual/Potential progress project filtered projections of the same global run, preserving explicitly isolated estimates; verify cross-surface per-goal date/need parity and shared XP-book/token allocation tests.
- [ ] 3.4 Audit cache keys/invalidation for reorder, goal creation/status/deletion, membership, synced inventory, catalog, and planning settings; verify no stale plan survives any input change and no failed fetch is presented as a zero estimate.
- [ ] 3.5 Add real en/de/es/fr translations for Global Plan, Current plan browsing-only meaning, conflict/empty/error states, and revised estimate captions in existing namespaces; verify locale completeness and rendered-copy tests.
- [ ] 3.6 Create/update the co-located Goals tutorial and revise Dailies tutorial with `tour.goals.steps.*` and relevant Dailies keys in all locales; verify automated desktop/mobile tour selectors and copy, including priority and project-projection steps.

## 4. Dependency and end-to-end verification

- [ ] 4.1 Reconcile the planning artifacts for `make-global-plan-the-goals-landing`, `improve-bulk-project-membership`, and `surface-goal-farming-guidance` with `/goals/plan`, Default membership, and global-run estimates using `openspec-update-change` where needed; verify their strict validation before applying any dependent change.
- [ ] 4.2 Manually verify with the authenticated Aspire stack below 768px and at/above 768px: empty and populated Global Plan, shared goal, Paused goal, mixed Character/Machine-of-War contention, non-current and empty project, stale reorder, Today/Raids Plan/Insights parity, and both Goals/Dailies tours; verify persistence after reload.
- [ ] 4.3 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all gates pass.
