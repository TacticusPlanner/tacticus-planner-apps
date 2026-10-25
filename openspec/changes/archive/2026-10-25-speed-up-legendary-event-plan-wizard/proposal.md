# Proposal

## Why

The 1-click plan wizard (`/legendary-events/:eventId/plan`) is laggy: taps, scrolling and typing stall while it opens and every time a run input changes. The cause is the upgrade recommendation search. It runs on the main thread, one whole greedy round per `setTimeout`, and a round evaluates every candidate unit × every one-to-three-step chain. Each evaluation regenerates the teams of the lanes that unit plays in and rebuilds the token forecast, and each new chain also runs a full goal farming simulation.

Evidence (code audit and node benchmark, 2026-10-23, paths under `apps/web/src/fsd/pages/legendary-events/ui/plan-wizard`):

- `use-plan-draft.ts:96-125` (`useRecommendations`) calls `iterator.next()` once per `setTimeout(…, 0)`. One `next()` is one full round of `recommendUpgrades` (`plan-upgrades.ts:135-222`), so each round is one long task.
- Benchmark on the Uthar fixtures (desktop CPU, farming estimate stubbed to a constant): 8 owned units with one lane of battle powers took 130–160 ms per round (~95 evaluations); 68 owned units with all three lanes took 360–440 ms per round (~170 evaluations, ~2.3 ms each). A phone is typically 3–5× slower, which is a 1–2 s freeze per round, for up to 12 rounds.
- The real farming estimate is not in that number: `farming-days.ts:212-222` caches per chain, but every uncached chain runs `estimatePlan` and first copies the whole upgrades map (`farming-days.ts:314-318`). Round 1 is all cache misses.
- `use-plan-draft.ts:61-91` keys the search job on `economy`, so every mission-count or bundle click on the Target step restarts the search from round 1 and flips every unsettled verdict back to **Checking**.
- `use-plan-draft.ts:66` searches with `targetPoints: Infinity`, so the search always runs to the 12-recommendation cap or until nothing gains, even when the chosen target needed one upgrade. `plan-wizard.tsx:174` keeps Create disabled until the whole search is done.
- `use-plan-source.ts:150-243` rebuilds `inputs` whenever any read's identity changes (the lazily loaded `characters` namespace changes `t` and so `unitName`; a plan or goal-target refetch), and a new `inputs` restarts the search.
- On every round, `usePlanDraft` builds a fresh `createPlanEvaluator` (empty lane cache) for the draft evaluation (`use-plan-draft.ts:229-235`), and the Teams step recomputes `teamSwaps` synchronously (`teams-step.tsx:27-36`). Each is small (3–4 ms measured), but they land in the same frames as the search.

## What Changes

- The recommendation search is time-sliced. The generator yields between candidate evaluations, not only between rounds, and the wizard runs it in slices of about 8 ms, yielding to the browser between slices, so no search task blocks input for longer than one slice plus one evaluation.
- Run-input edits on the Target step reach the search only after they settle (400 ms with no further change). While the inputs settle or the search is rerunning, each step keeps its last verdict shown dimmed, with the **Checking** badge, instead of dropping it.
- The search explores at the chosen target's priority. As soon as the recommendations found so far reach the chosen target (or the target is Reachable now), that target's recommendations are final: the Upgrades step stops saying it is still looking and Create is enabled. The search then carries on to the cap at idle priority, only to settle the other steps' verdicts and the "highest step within reach" line, which keep **Checking** until it ends.
- The wizard freezes its planning inputs when they first become ready, the same way it already freezes the clock. Background refetches and late translation loads no longer restart the search. The plan's write queue still sends Create on the latest stored revision.
- One plan evaluator, with its lane cache, is shared by the draft's evaluations for a given economy and team adjustments. The Teams step's swap offers and the Target step's potential maps compute at deferred priority.
- The farming-days estimator builds the shared upgrades map once and adds only each chain's shard entries.
- A deterministic test locks the slicing in (a slice never runs more than one evaluation past its deadline, using an injected clock), and a fixture benchmark (not run in CI) records the per-slice and total search time.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `legendary-event-plan-generation`: adds three requirements: the search runs in slices, restarts only when its inputs change, and a step's recommendations are final once they reach it. The greedy algorithm, its candidates, scores, tie-breaks and cap are unchanged, so it recommends exactly the same upgrades.
- `legendary-event-plan-wizard`: adds three requirements: run-input edits settle before they are planned, verdicts being rechecked keep their last value, and Create waits only for the chosen target.

## Impact

- `pages/legendary-events/ui/plan-wizard/`: `plan-upgrades.ts`, `use-plan-draft.ts`, `use-plan-source.ts`, `farming-days.ts`, `plan-wizard.tsx`, `target-step.tsx`, `upgrades-step.tsx`, `teams-step.tsx`, and a new `run-sliced.ts` (the slice driver) with its test.
- No new dependencies, no API change, no companion `tacticus-planner-api` change. No new user-facing copy: the existing **Checking…**, "Still looking for upgrades…" and verdict strings are reused.
- Out of scope, as a follow-up change (`move-plan-search-to-worker`): running the search in a Web Worker. It is taken up if, after this change, a slice still exceeds 50 ms on the reference account under Chrome's 4× CPU throttle (most likely a single farming estimate), as recorded in tasks 1.1 and 5.4.
- Out of scope, from the same audit (logged in `/mnt/project-files/lre/plan-page-performance.md`): the Runs step's collapsed sections and dead leftover link, the mobile footer under the bottom nav, ticks freezing when the user ticks during the search, and the other wizard UX items.
