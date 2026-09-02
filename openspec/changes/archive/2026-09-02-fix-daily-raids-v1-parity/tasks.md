## 1. Resource urgency ordering

- [x] 1.1 Derive each scheduled resource's total completion-time and energy estimate in the shared goal-farming/Dailies calculation path, preserving the existing priority-based allocation and canonical schedule.
- [x] 1.2 Order Today and Bonus Raids resource groups by descending duration, descending energy, then a stable resource-identity tie-breaker, while preserving existing goal-group and per-resource location ordering.
- [x] 1.3 Add focused calculation and Dailies UI regression tests for longer-first ordering, energy tie-breaking, deterministic ties, and unchanged cross-goal priority.

## 2. Historical attempt counts

- [x] 2.1 Update Today's Attempts to display every resolved positive `attemptsUsed` value as a numeric raid count, including exhausted locations, without changing simulated schedule or Bonus Raids max-raid indicators.
- [x] 2.2 Add focused live-progress mapping and Today-page tests covering an exhausted node with a positive used count, an unexhausted attempted node, an unrelated attempted node, and the no-attempt empty state.

## 3. Verification

- [x] 3.1 Run focused goal-farming and Dailies tests, then `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`.
- [x] 3.2 In the Aspire-hosted signed-in app, verify a populated project with multiple resources in one goal: longest-running resources appear first, equal-duration resources use energy as the tie-breaker, and goal priority remains unchanged. Verify Today's Attempts displays a numeric actual count for both exhausted and non-exhausted standing nodes, plus the explicit empty state when no attempts are synced.
