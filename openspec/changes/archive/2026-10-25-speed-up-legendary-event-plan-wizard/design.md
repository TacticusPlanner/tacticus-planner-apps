# Design

## Context

See proposal.md, Why. The search is `recommendUpgrades` (`plan-upgrades.ts`), already a generator that yields once per greedy round. The hook `useRecommendations` (`use-plan-draft.ts`) drives it with `setTimeout(step, 0)`, and its job is keyed on `farming`, `inputs`, `economy`, `syncedCeiling`, `goalTargets`, `masterTotal` and `hordeMultiplier`. Evaluations go through `createPlanEvaluator` (`plan-evaluator.ts`), which caches each lane's generated teams by the roster changes of the units that lane allows. React 19 without the compiler, so memoization is explicit. Everything stays in the `pages/legendary-events` slice: the wizard is the only consumer, so nothing moves between FSD slices.

## Goals / Non-Goals

**Goals:**

- No main-thread task from the search longer than one slice (8 ms) plus one evaluation, measured on the reference account.
- A run-input click never restarts the search on its own; only a settled change does.
- Create becomes available as soon as the chosen target's recommendations are final.
- The recommendations are exactly the same: same list, order, gains, ready dates and verdicts once the search ends.

**Non-Goals:**

- A Web Worker (follow-up `move-plan-search-to-worker`, gated on the measurement in tasks 5.4).
- Pruning candidates with an upper bound, or changing the greedy algorithm, the candidates, the 12-recommendation cap or the tie-breaks.
- The wizard UX and correctness items from the same audit (Runs step sections, mobile footer, ticks during the search, step in the URL, Teams editing).

## Decisions

1. **Yield per evaluation, slice by deadline.** `recommendUpgrades` gains finer-grained yields: after each candidate evaluation it yields `{ kind: "progress" }`, and after each round it yields `{ kind: "round", recommendations }` as today. A new `runSliced(iterator, { budgetMs: 8, now, schedule, onRound, onDone })` in `run-sliced.ts` calls `next()` until the budget is spent, then reschedules. `schedule` prefers `scheduler.yield()` when available, falls back to a `MessageChannel` post (no 4 ms timer clamping), and returns a cancel function so the hook can stop on unmount or restart. `now` and `schedule` are injected so the test runs on a fake clock. Alternative considered: a Web Worker now. Rejected for this change because the generator closes over the evaluator, the farming estimator and catalog maps, which would all have to be rebuilt in the worker. Slicing gets most of the responsiveness with no data plumbing, and the worker follow-up stays open if the measurement asks for it. `recommendUpgradesNow` keeps running the generator to the end, ignoring progress yields, so the existing tests are unchanged.

2. **A target's recommendations are final once they reach it.** The search is greedy and sequential, so a recommendation, once yielded, never changes, and the prefix up to the first recommendation whose `ceilingAfter ≥ target.points` is fixed the moment it appears. `RecommendationsState` gains `targetSettled: boolean`, computed in `usePlanDraft` from the chosen target, the synced ceiling and the list so far: true when the target is Reachable now, when a yielded recommendation reaches it, or when the search is done, and always false while the live `economy` differs from the debounced `searchEconomy` (decision 3), so Create cannot run on the previous inputs' recommendations during the 400 ms settle window. The Upgrades step hides "Still looking for upgrades…" and Create's `exploring` guard (`plan-wizard.tsx`) uses `!targetSettled` instead of `status === "running"`. Verdicts for other steps still need the full search (the spec's Needs upgrades rule uses the ceiling with every recommended upgrade), so those keep **Checking** until `status === "done"`. Once the target is settled, the driver lowers its priority. Where `requestIdleCallback` exists, each slice runs inside an idle callback (with a 1 s `timeout` so a busy page still makes progress) and stops at the earlier of the 8 ms budget and the idle deadline (`deadline.timeRemaining()`). Without it (Safari), the driver keeps the `MessageChannel` schedule, which already lets input run between slices, rather than adding a fixed gap: a 50 ms timer per slice would add about 26 s to the 68-unit fixture's ~516 slices across 12 rounds. Alternative: stop the search at the target. Rejected because the other steps' verdicts and the "highest step within reach" line would then be wrong.

3. **The search economy settles before it is used.** `usePlanDraft` keeps `economy` as the live value for the form, and passes `searchEconomy = useDebouncedValue(economy, 400)` to `useRecommendations` and to `syncedCeiling`. The synced ceiling uses the debounced economy too, so the verdict and the search always use the same inputs. While `economy !== searchEconomy`, or while the search is not done, a target option whose last settled verdict was anything but Reachable now renders that verdict dimmed (`opacity-60`) with the **Checking** badge, instead of flipping to Checking with no verdict. The last settled options are held in a ref keyed on the step. A local `useDebouncedValue` lives in `plan-wizard/` unless `shared/lib` already exports one (check at implementation).

4. **Freeze the planning inputs when they first become ready.** `usePlanSource` keeps the first non-null `ready` value in state (`useState` set once, like `nowMs`) and returns it for the life of the page, along with the `goalTargets` map present at that moment. This stops restarts from `unitName` identity changes (lazy namespaces), plan refetches and goal refetches. Create stays correct: `writeLane` and the run-input writes go through `usePlanWriteQueue`, which sends each write on the latest stored revision, and the Create snapshot already freezes the writes. Trade-off: a roster sync while the wizard is open is not picked up until the page is reopened. That is acceptable for a page that is open for minutes, and it is what the frozen clock already implies. Alternative: compare `inputs` deeply. Rejected because it costs a deep walk of the roster on every render.

5. **One evaluator per economy and adjustments.** The search itself stays on the default team adjustments, as today (`useRecommendations` builds its evaluator with `NO_TEAM_ADJUSTMENTS` and does not depend on `adjustments`), so Teams-step edits never restart it; making the search follow team edits is out of scope. `usePlanDraft` memoizes `createPlanEvaluator(inputs, searchEconomy, adjustments)` once, and the draft evaluation, `syncedCeiling` (with `NO_TEAM_ADJUSTMENTS` it is the same instance the search uses) and tick changes all call `evaluate` on it, so the lane cache survives across ticks and rounds. The search builds its evaluator from the same memo when adjustments are the default. `teamSwaps` and `planPotentials` read `useDeferredValue(evaluation)`.

6. **The farming estimator builds the shared upgrades map once.** `createFarmingDaysEstimator` builds `baseUpgrades = new Map(inputs.upgradesById)` once. `estimateChain` passes `baseUpgrades` straight through when the chain has no shard entries, and otherwise a map built from `baseUpgrades` plus the shard entries, memoized per unit, since a unit's shard entries depend only on the unit. Results stay identical. A test asserts equal outputs on the existing farming-days fixtures.

7. **Verification is measured, not inspected.** Task 1.1 records a baseline with the React Profiler and the Performance panel on the reference account (desktop, and Chrome 4× CPU throttle): the longest task while the wizard opens, total time to "highest step within reach" settled, and the input delay of a run-input click. Task 5.4 records the same numbers after. The fixture benchmark from the audit is committed as `plan-search.bench.ts` (run with `vitest bench`, not part of `test:run`), so the per-slice numbers can be reproduced.

## Risks / Trade-offs

- [Slicing adds scheduling overhead and makes the full search take longer in wall-clock time] → the budget (8 ms) keeps overhead small, and Create no longer waits for the full search (decision 2).
- [`scheduler.yield` and `requestIdleCallback` aren't available everywhere, e.g. Safari] → `MessageChannel` and `setTimeout` fallbacks; the driver's behaviour is tested with an injected scheduler.
- [A single farming estimate may itself exceed the budget on a phone] → recorded in 1.1/5.4; it is the trigger for the worker follow-up.
- [Frozen inputs ignore a mid-wizard sync] → documented, matching the frozen clock.

## Migration Plan

Front end only, no data migration. It ships behind no flag. Rollback is reverting the PR.
