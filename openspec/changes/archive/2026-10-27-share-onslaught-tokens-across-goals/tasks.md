# Tasks

## 1. Estimate

- [x] 1.1 Pool Onslaught runs per day in `applyFlatSuppliers` under `onslaught:runs`, converting
      through `shardsPerRun`; rename the pool parameter to `dailySupplyUsed`.
- [x] 1.2 Update the `FlatSupplier` doc comment to describe the shared Onslaught pool.

## 2. Tests

- [x] 2.1 `estimate-plan.test.ts`: two Onslaught goals — the first gets all runs, the second gets
      none until the first finishes, then inherits the leftover runs on the finishing day; dates move
      accordingly.
- [x] 2.2 Run the goal-farming, daily-raids and goal-planning tests, typecheck and lint (185 files, 2181 tests pass; `tsc` clean).
