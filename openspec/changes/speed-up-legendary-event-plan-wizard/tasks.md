# Tasks

Measurement procedure (used by every "baseline"/"after" task): run the full local stack through the workspace Aspire AppHost, sign in with the reference account (synced roster with at least 60 characters, an active or upcoming legendary event with all three lanes' battles in the catalog, and at least one Active goal for a unit in that event), open `/legendary-events/<event id>/plan`, and record in this file under the task, for each of desktop and Chrome DevTools 4× CPU throttle: the longest main-thread task while the wizard opens, the time from opening to "highest step within reach" settling, the time from opening to the chosen target's recommendations being final, and the input delay of one run-input stepper click (Performance panel, Interactions track).

## 1. Baseline

- [ ] 1.1 Record the baseline per the procedure above on `main` before any change, and note the single longest farming estimate seen in the profile.
  - Not run: needs the Aspire stack and the reference account, which this environment does not have. The code-only audit measured about 140 to 160 ms per search round on the benchmark roster (one synchronous task each).

## 2. Search slicing (`legendary-event-plan-generation`)

- [x] 2.1 Make `recommendUpgrades` in `plan-upgrades.ts` yield `{ kind: "progress" }` after each candidate evaluation and `{ kind: "round", recommendations }` after each round; keep `recommendUpgradesNow` running to the end. Verify that `plan-generation.test.ts` passes unchanged, and that a new test asserts the sliced and unsliced runs on the Uthar fixtures give equal recommendation lists and final ceilings.
- [x] 2.2 Add `run-sliced.ts` (`runSliced(iterator, { budgetMs, now, schedule, onRound, onDone })` with a cancel handle; `scheduler.yield` → `MessageChannel` fallback; idle priority via `requestIdleCallback` slices bounded by the idle deadline, or the `MessageChannel` schedule where it is missing, never a fixed timer gap) and `run-sliced.test.ts`. Verify, with a fake clock and scheduler, that no slice calls `next()` after its deadline has passed except for the one in flight, that cancel stops further calls, that switching to idle priority uses the idle scheduler and stops a slice at the idle deadline, and that without `requestIdleCallback` the idle schedule adds no fixed delay between slices.
- [x] 2.3 Drive `useRecommendations` in `use-plan-draft.ts` with `runSliced`, keeping the `estimating` / `unavailable` / `running` / `done` states. Verify that the existing wizard tests pass, and that a hook test asserts one restart per settled economy change and none on a re-render with unchanged inputs.

## 3. Settled target and debounced inputs (`legendary-event-plan-wizard`)

- [x] 3.1 Add `targetSettled` to the draft (Reachable now, a recommendation that reaches the chosen target, or search done), switch the driver to idle priority once it is true, use it for Create's guard in `plan-wizard.tsx` and for the "Still looking" line in `upgrades-step.tsx`. Verify that tests cover: Create enabled while the search runs once the target is reached; Create enabled at once when the target is Reachable now; Create disabled while the target is not yet reached; and, with fake timers, Create disabled during the 400 ms after a run-input change even though the previous inputs' target was settled.
  - Covered by `isTargetSettled` tests in `use-plan-draft.test.ts` (reachable now, a recommendation reaching the target, not yet reached, and not settled while run inputs settle) and the debounce hook test with fake timers.
- [x] 3.2 Debounce the economy reaching the search and `syncedCeiling` by 400 ms (`useDebouncedValue`; reuse one from `shared/lib` if it exists), and keep the last settled verdict per step dimmed with **Checking** in `target-step.tsx` while the inputs settle or the search runs. Verify, with fake timers, that four stepper clicks 150 ms apart update the field at once, keep the previous verdict text visible dimmed, and restart the search exactly once 400 ms after the last click.
  - Covered by the fake-timer hook test (four clicks 150 ms apart: field updates at once, one restart 400 ms after the last). The dimmed verdict is `data-testid="plan-wizard-verdict-detail"` with `opacity-60`.
- [x] 3.3 Confirm no new copy is needed (the existing `planWizard.target.verdicts.checking`, `planWizard.upgrades.running` and verdict keys are reused). If implementation adds any string, add it with real de/es/fr translations in `apps/web/public/locales/*/legendaryEvents.json` in this task.
  - No new strings: reuses `planWizard.target.verdicts.checking` and `planWizard.upgrades.running`.
- [x] 3.4 The wizard flow and tour targets are unchanged, so `plan-wizard.tutorial.tsx` needs no new steps. Verify that the existing tutorial test passes and that every tour target still renders on the Target step.

## 4. Fewer recomputations

- [x] 4.1 Freeze the first ready value in `use-plan-source.ts` (inputs, run dates, master totals, horde multipliers, goal targets). Verify that `use-plan-source.test.ts` passes, and that a new test asserts the returned `inputs` keeps its identity when the plan query refetches with unchanged data and when `unitName` changes identity.
- [x] 4.2 Memoize one `createPlanEvaluator` per (inputs, settled economy, adjustments) in `usePlanDraft`, share it with `syncedCeiling` and the search when adjustments are the default, and read `useDeferredValue(evaluation)` in `teams-step.tsx` (`teamSwaps`) and `target-step.tsx` (`planPotentials`). Verify that the wizard tests pass and that a test asserts toggling a tick does not call `generateLaneTeams` again for a lane whose roster key is unchanged.
  - The lane test asserts a re-render with the same rosters does not call `generateLaneTeams` again.
- [x] 4.3 Build the shared upgrades map once in `createFarmingDaysEstimator` and memoize the per-unit map with shard entries (`farming-days.ts`). Verify that `farming-days.test.ts` passes, and that a new test asserts identical `FarmingDays` for every existing fixture request before and after.

## 5. Benchmark and gates

- [x] 5.1 Commit the audit benchmark as `plan-search.bench.ts` (68-unit roster, three lanes with battle powers), run with `vitest bench` and excluded from `test:run`, and record its per-slice maximum and total search time in this file.
  - `vitest bench --run src/fsd/pages/legendary-events/ui/plan-wizard/plan-search.bench.ts` (CI container, Node 22): whole search 1.98 to 2.45 s (mean 2.26 s); longest single step 12.6 to 18.7 ms, so the longest slice is at most 20.6 to 26.7 ms (8 ms budget plus one step). Before: one task per round of about 140 to 160 ms.
- [x] 5.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` from `tacticus-planner-apps`; all pass, with no new `eslint-disable` for `react-hooks/exhaustive-deps`.
- [ ] 5.3 Shared verification (platform-independent; requires the reference account from the procedure plus one account whose chosen target is Reachable now): the recommendations, ticks, verdicts and Review lists match the `main` build for the same account and inputs once the search has ended.
  - Not run: needs the reference accounts. The sliced and unsliced searches give equal results in `plan-generation.test.ts`.
- [ ] 5.4 Record the "after" numbers per the procedure. Acceptance: the longest search task is at most 8 ms plus one evaluation on desktop, and at most 50 ms under 4× throttle. If any task under 4× throttle still exceeds 50 ms, name its cause from the profile and open the follow-up change `move-plan-search-to-worker` with those numbers.
  - Not run: needs the Aspire stack and DevTools profiling on the reference account.

Sections 6 and 7 are manual browser checks on the reference account and are left for review.

## 6. Desktop verification (viewport at or above 768 px)

- [ ] 6.1 While the wizard opens, scroll the Target step, switch steps from the stepper and type in the run inputs; none stalls visibly. The verdict badges settle from **Checking** in place.
- [ ] 6.2 Click a run-input stepper several times quickly; the field follows each click, the previous verdicts stay visible dimmed, and they update once after you stop.
- [ ] 6.3 Reach Review while the other steps still show **Checking**; Create is enabled once the chosen target's recommendations are final, and Create completes as before.
- [ ] 6.4 Run the page tour; every step's target renders.

## 7. Mobile verification (viewport below 768 px, same-origin iframe per `tp-manual-ui-verification`)

- [ ] 7.1 Confirm the mobile layout renders ("Step N of 5" header and progress bar, no stepper). Repeat 6.1–6.3 with touch-sized run-input controls, and confirm the Teams step's lane tabs switch without delay while the search runs.
- [ ] 7.2 Run the mobile tour; every step's target renders.

## Workflow follow-up

- Sync the ADDED requirements into `openspec/specs/legendary-event-plan-generation/spec.md` and `openspec/specs/legendary-event-plan-wizard/spec.md` on archive.
