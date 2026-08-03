## 1. Recipe-aware requirement derivation

- [x] 1.1 Add a shared crafted-inventory-aware recipe expansion operation that consumes exact top-level and nested crafted ids while leaving unrelated crafted inventory and loose base inventory untouched; add focused unit tests
- [x] 1.2 Update Rank need derivation to remove applied slot occurrences before crafted-inventory consumption, and add coverage preventing applied slots and loose inventory from satisfying the same requirement twice
- [x] 1.3 Update MoW Ability need derivation to use the same recipe-aware operation and add a nested crafted-inventory regression test
- [x] 1.4 Preserve the distinction between an inapplicable staged derivation and an applicable but fully inventory-covered empty stage, with a regression test preventing fallback from recreating covered demand

## 2. Share one ordered inventory pool across consumers

- [x] 2.1 Thread one mutable crafted-inventory pool through farming stages and through priority-ordered goal derivation without changing the existing loose base-material allocation API
- [x] 2.2 Make Dailies Today, Bonus Raids, and Raids Plan construct and consume that pool once per selected-project calculation; add cross-goal priority and cross-stage ordering tests
- [x] 2.3 Make Goals/Insights use the same pool and derivation path, with a consumer regression test asserting identical material demand for identical inputs
- [x] 2.4 Add a compact multi-goal parity fixture modeled on the observed Neurothrope/Ahriman/Abraxas case, using synthetic player data, and assert Today equals the first Raids Plan day after crafted inventory is applied

## 3. Inclusive completion dates

- [x] 3.1 Add one shared inclusive completion-date helper and use it for isolated goal outcomes, combined-plan goal outcomes, and whole-plan summaries
- [x] 3.2 Add zero-day, one-day, and multi-day date tests, updating existing expectations that encoded the exclusive off-by-one behavior

## 4. Verification

- [x] 4.1 Run focused goal-farming, Dailies derivation, and Goals/Insights tests, then run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, strict OpenSpec validation, and `git diff --check`
- [x] 4.2 In the Aspire-hosted signed-in app, manually verify a populated project with owned crafted upgrades: Today matches Raids Plan Day 1, satisfied crafted recipes do not reappear as ingredient farming, and the summary completion date matches the final rendered day
