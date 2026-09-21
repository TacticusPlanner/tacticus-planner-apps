## Context

See `proposal.md` — Why.

`runPlanSchedule` (`estimate-plan.ts:42`) is the single day-by-day engine behind
every V2 estimate consumer: `estimatePlan` (Goals list, Insights, project
headers), `estimatePlanSchedule` (Raids Plan), `estimateTodaySchedule` (Today),
and `estimateBonusRaids`. Its day loop is:

```
while (pending.size > 0 && days < maxDays) {
  days++
  let energy = dailyEnergy                 // one pool, per calendar day
  for (const goal of ordered) {            // ordered by goal.priority, ascending
    ...
    while (stages.length > 0 && energy > 0) {
      const spent = spendDay(stage.remaining, stage.nodesById, energy, attemptsUsedByBattle)
      energy -= spent.energySpent          // the contention
    }
  }
}
```

Two further couplings share the same day and are **not** in scope here, but
explain why a per-goal budget is not a one-line change:

- `attemptsUsedByBattle` is a per-day map shared across goals, so two goals
  farming the same battle also contend for that battle's daily attempt cap.
- Flat suppliers (shop offers, Onslaught) are applied _before_ the energy loop
  and deliberately ignore the pool (`estimate-plan.ts:147-177`) — a lower-priority
  goal can still complete from its own shop/Onslaught sources on a day with zero
  energy left.

On the display side, `EstimateCell` (`goal-row-shared.tsx:28`) already solves the
date formatting correctly, including the UTC-parsing trap its comment documents
(`estimate.date` is a `YYYY-MM-DD` string produced in UTC; parsing via
`Date.UTC` keeps the day from rolling back west of UTC). `GoalEstimateSection`
(`goal-estimate-section.tsx`) renders `goals.create.previewEstimate` — days only.

## Goals / Non-Goals

**Goals:**

- The energy-allocation model is a stated, tested requirement rather than an
  emergent property of one loop.
- A user reading a date can tell whether it is isolated or plan-aware.
- The goal-detail estimate shows the same date the Goals list shows for the same
  goal, formatted the same way.

**Non-Goals:**

- No change to node selection, inventory allocation, flat-supplier semantics,
  attempt caps, or the `UNUSED_ENERGY_THRESHOLD` reporting.
- No change to Raids Plan, Today, Bonus Raids, or Dailies.
- Not reconciling V1's estimates to V2's, or vice versa, beyond the decision
  below — V1 is in production and is not modified by this change.
- Not adding a project- or sequence-level completion date (TIME-03) — that is
  `add-plan-completion-outlook`, sequenced after this change.

## Decisions

### 1. Which energy model is correct — **DECIDED 2026-09-21: Option A**

**Decided by the repository owner on 2026-09-21: Option A — keep V2's shared
daily energy pool, state it in the spec, and communicate it in the UI.** The
engine is untouched; `runPlanSchedule` keeps its one-pool-per-day loop. V1's
dates are accepted as the divergent ones, and task 1.2's Option B re-scope does
not apply.

**Option A — keep V2's shared pool, state and communicate it (recommended).**
A player has one energy budget per day; spending it on a high-priority goal
genuinely delays a lower-priority one. V1's per-material silo produces a set of
dates no single player can actually hit simultaneously. Under this option the
engine is untouched, the spec delta in `specs/goal-farming-estimates/spec.md`
stands as written, and the work is §2-§4 of `tasks.md`.

**Option B — restore V1's per-goal budget.** Each goal is estimated as if it had
the whole daily budget to itself. Restores tester-visible V1 parity and makes a
goal's date independent of everything above it in the list, at the cost of a
plan whose goal dates cannot all be true at once. Under this option:

- the added requirement is replaced by one stating that a goal's estimate is
  computed against the full daily budget and is independent of other goals'
  farming, with the reverse worked example;
- `runPlanSchedule` gains a per-goal budget reset inside the `for (const goal of
ordered)` loop, and `attemptsUsedByBattle` must be decided alongside it
  (sharing the cap while not sharing energy is incoherent);
- Raids Plan's day columns, `summary.totalEnergy`, and `daysWithUnusedEnergy`
  all change meaning — they currently describe one real day's spending — so
  `daily-raids-plan`'s spec becomes part of this change;
- §2 of `tasks.md` becomes an engine change plus its own regression tests, and
  every existing `estimate-plan.test.ts` expectation must be re-derived.

**Option C — both, user-selectable.** Rejected: a setting whose two positions
disagree about what "Done By" means moves the trust problem rather than solving
it, and doubles every downstream consumer's test matrix.

Option A was taken for the reason its own paragraph gives, reinforced by Option
B's cost being concentrated in the second and third bullets above — Raids Plan
is a literal day-by-day schedule a player follows, and it cannot be built from
per-goal budgets that overspend the day.

### 2. Reuse `EstimateCell` rather than a second date formatter

`GoalEstimateSection` imports `EstimateCell` from `../goals-board/goal-row-shared`
— both live under `pages/goals/ui`, so this crosses no FSD boundary and needs no
new shared slice. The section keeps its own `Blocked` and `unavailable` text
because `EstimateCell` returns `null` for both (the list surfaces those through
`BlockedIndicator` in an adjacent cell, which the detail sheet has no equivalent
of).

Alternative (rejected _for this change_): extract the formatter into a shared
slice. One extra file and an indirection for a component that already renders
exactly the required output, and `pages/goals/ui` can consume it directly.

Note for the follow-up: `add-plan-completion-outlook` renders this same date from
`features/project-management/ui/project-row.tsx`, and a features→pages import
violates `fsd/forbidden-imports` (`steiger.config.ts` enables
`fsd.configs.recommended` with only `fsd/insignificant-slice` off). That change
therefore **does** extract the formatter into `shared/lib` — alongside the
existing `format-relative-time.ts` — and repoints `EstimateCell` and the detail
section at it. This change deliberately does not pre-build that extraction: if
the follow-up is dropped, nothing here needs it.

### 3. Plan-aware framing is a caption, not a second badge

The existing `goals.detail.isolatedEstimate` badge marks the priority-unaware
case. The plan-aware case gets a muted caption line
(`goals.detail.planAwareEstimate`) rather than a competing badge, so the badge
keeps its "this number is unusual" meaning instead of both states shouting.

Both are moved **inside** the estimate-present branch. Today the badge renders
unconditionally (`goal-estimate-section.tsx:23`, above the blocked/unavailable
`<p>`), so a Blocked goal opened from the Goals page currently shows "Isolated
estimate" with no estimate under it — labelling a figure that is not there. The
new requirement's "neither framing without a date" scenario exists to pin that
fix, so task 3.2 changes the badge's placement rather than leaving it as-is.

### 4. "Isolated" is a property of the surface, not of project membership

`isolated` is a hard-coded prop, not derived per goal: `goals-page.tsx:381`
passes it for every goal on the cross-project Goals page, and
`project-detail-page.tsx:313` passes `isolated={false}` for every goal in a
project detail. That is substantively correct — `use-goal-estimate` really does
compute a plan-of-one on the Goals page, even for a goal that belongs to a
project — so the spec is written in terms of _how the estimate was computed_,
not "is this goal in a project". A goal can therefore legitimately read as
isolated in one sheet and plan-aware in another, and that is the honest label
for two genuinely different numbers.
keeps its "this number is unusual" meaning instead of both states shouting.

## Risks / Trade-offs

- **Option A leaves testers' V1 comparison unresolved.** They will still see
  different numbers; the change only makes V2's answer explicable. Mitigation:
  the caption states the dependency on higher-priority goals, which is the fact
  that makes the difference make sense.
- **The regression test pins a model, not a number.** It asserts relative
  ordering and the worked example's day counts, so an unrelated node-selection
  improvement that changes absolute days still fails it. That is intended — this
  model is exactly the thing that should not change silently again.
- **`completionDate` in `plan-insights-calc.ts:425-434` is extended by an
  Onslaught token-accumulation term** after the per-goal max is taken. It is out
  of scope here, but it means a project's date is not purely a function of the
  model specified in this change. `add-plan-completion-outlook` inherits it.

## Migration Plan

None — no persisted data, API contract, or route changes.

## Open Questions

None. Decision 1 was settled on 2026-09-21 (Option A).
