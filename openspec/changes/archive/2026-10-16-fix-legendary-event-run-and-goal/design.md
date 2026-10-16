# Design

## Context

Run-dependent logic reads the run in four ways today: `currentLegendaryEventRun(progress)` (`entities/legendary-event/lib/current-run.ts`: the synced `currentEventRun` clamped to 1..3, or 1), `runTokenSupply` (`features/legendary-event-tokens/lib/token-supply.ts`: for an upcoming event, `lastEnded` = the synced run or 0), the reward projection's `futureRuns` (`RUNS.filter(run > currentRun)` when a synced entry exists) and the event page / master table's depth reads. All of them depend on the synced number, which is `null` between runs (proposal.md). The lifecycle (`deriveLegendaryEventLifecycle`) already reads `eventStageStartDatesUtc` and treats each element as a 7-day window but ignores which run it is; the API half makes the element index the run number. The ascension goal comes from `nextAscensionStep(shards, progression)` which sums the six steps from `unlock` and never looks at the unit. Companion API change: same name in `tacticus-planner-api` (capability `legendary-event-run-schedule`).

Facts relied on (2026-10-16): `currentEventRun`, `currentEventTokens`, `hasUsedAdForExtraTokenToday` and `extraCurrencyPerPayout` are all `null` for the three synced events; the roster record carries `progressionIndex` (for example `Legendary:RedThreeStars`) and `unitId`; V1 maps the six steps to the states in the reward-projection spec and takes the next step from the unit's rarity and stars.

## Goals / Non-Goals

**Goals:**

- One pure resolution of ended, current and next run that every consumer reads.
- Between runs show the right next run (Uthar: run 3) and count only runs that have not started.
- An unknown run never produces a wrong number: it produces number-free copy and a conservative plan.
- The reward goal and the forecast's steps follow the unit's actual step (Uthar: Red 4★, 25 / 120).

**Non-Goals:**

- Fetching the run from anywhere but the catalog and the synced entry (no new storage, no per-account memory of the last seen run).
- Carrying manual clear depths from one run to the next (depths stay stored per run; an open question below).
- Changing the Run status card's "Event N of 3" (still the synced value while active) or the Home widget.
- Inferring progress in the unit's own progression beyond the synced `progressionIndex`.

## Decisions

**D1. A pure resolver in the entity layer.** `resolveLegendaryEventRuns({ lifecycle, schedule, syncedRun, hasProgress, nowMs })` returns `{ kind: "known" | "unknown", endedRuns, currentRun, nextRun, nextStartMs }` and is exported from `entities/legendary-event`. `currentLegendaryEventRun` stays as a thin adapter for the depth run (`currentRun ?? nextRun ?? 1`), so callers that only need a depth key change nothing; the three that need more (supply, projection, Next token card) call the resolver. Alternative: extend `deriveLegendaryEventLifecycle` with run fields. Rejected: lifecycle is a state machine over time, the resolver also needs the synced run and progress presence; mixing them would put roster/progress inputs into a pure schedule function.

**D2. Synced run wins while active, never otherwise.** While a run is in progress the game's number is the best source and also protects against a hand-kept schedule that is slightly off; between runs it is null and the schedule decides. When the synced run is null during an active window the schedule window index is used. Alternative: schedule always wins. Rejected: a wrong date would then override the game.

**D3. Unknown only when progress contradicts the schedule.** An event with no synced progress and an empty schedule is not unknown (nothing has been played: next run 1). An event with progress but no run shown as started by the schedule is unknown (no live event once the owner's dates are in; unit tests keep the state covered). This keeps the common new-event case clean and confines the degraded copy to missing data.

**D4. The unknown state is conservative, not clever.** One Next run of 68 tokens, no future inputs, depth key run 1, no run numbers. Alternative: assume a default run count (for example `endedRuns = 1` when progress exists). Rejected: that reintroduces the guess that caused the bug.

**D5. The goal starts from the unit's next step, by comparing progressions.** A constant table maps the six steps to the progression states they reach; the unit's next step is the first whose state is later than its `progressionIndex` (compared with the game-domain progression order), `unlock` for a unit not in the roster. `nextAscensionStep(shards, progression, fromStep)` gains the starting step; the reward projection and the run forecast call it with the same `fromStep`, so the Run status card, the forecast's "steps reached" and the markers agree. Alternative: derive the step from the event shards alone (today). Rejected: it cannot know the unit is already unlocked. Alternative: V1's exact-match lookup of rarity and stars. Rejected: a unit between table states (for example Legendary:RedThreeStars with extra shards) would fall off the table; ordering by progression index is total.

**D6. Depth stays keyed by the resolved run.** For an upcoming event the key is the next run, so a depth set now applies to the run being planned; depths set during earlier runs stay stored under theirs (history keeps them). The consequence is that a new run starts with no manual depth and the estimate shows. See Open Questions.

**D7. Desktop and mobile are unchanged.** All changes are data derivation and copy; no layout, tour or interaction differs between the forms.

## Risks / Trade-offs

- [The catalog dates are hand-kept and may be wrong or missing] → Wrong dates only move the derived run when the synced run is also null (between runs); while active the game's number wins. Missing dates degrade to the unknown state, not to a wrong number.
- [The unknown state hides run numbers on events users know well] → Only events with progress and no dates are affected, and the fix is a data edit in the API repo; the copy says "next run" so it is never wrong.
- [A manual depth set for run 2 is not shown for run 3] → Same as today's per-run model; surfaced as an open question rather than changed here.
- [Goal rule differs from the shard count V1 shows for locked units] → For locked units both start at Unlock; fixture cases from V1 are kept (Dante, 13,000 and 12,500) with the unit not in the roster.
- [`progressionIndex` strings for the six step states must exist in the game-domain order] → The mapping table is unit-tested against the domain's progression order, and a test fails if a state is missing.

## Migration Plan

Client-only after the API half is deployed. Order: API half (dates served), then this change. With the API half deployed but the dates still empty, every event with progress shows the unknown state; with dates added the correct run shows without a client release. Roll back by reverting the commit; the API half is independent.

## Open Questions

- Should a team's manual depth carry forward to the next run when that run has none (for example read the latest earlier run's depth)? It would stop depths from "disappearing" between runs but changes the depth requirement and the history model; it can be decided later without changing this change's specs or tasks.
