## Context

See `proposal.md` — Why.

`computePlanInsights` (`plan-insights-calc.ts`) is the single producer of the
project-level figure. Three parts of it matter here, and they run in this order:

**1. The needs loop** builds `goalNeeds`, but not from every member goal:

```
if ((needs.length > 0 || stages !== null) && priority !== undefined) {   // :253
  goalNeeds.push({ goalId, priority, needs, ... })
}
```

An Ascension goal whose remaining demand is orbs only goes to `orbGoalNeeds`
instead (`:245-251`), and a goal with no resolved priority is dropped outright.
The same loop accumulates `onslaughtTokens += onslaughtTokensDelta` (`:193`) for
_every_ goal it visits, estimable or not.

**2. The aggregation:**

```
let completionDate = null, anyUnreachable = false
for (const goal of goalNeeds) {                                          // :354
  const result = estimateResults.get(goal.goalId)
  if (!result || result.status === "Blocked") { anyUnreachable = true; continue }
  energyTotal += result.energyTotal
  if (!completionDate || result.date > completionDate) completionDate = result.date
}
if (anyUnreachable) completionDate = null                                // :365
```

`energyTotal` is already reported over the estimable subset — blocked goals are
skipped, not zeroed — so the posture this change wants already exists one line
above the collapse it removes.

**3. The Onslaught term**, ~60 lines later and _after_ the collapse:

```
const onslaughtDays = Math.max(0, onslaughtTokens - currentOnslaughtTokens) / 1.5
if (onslaughtDays > 0) {
  const value = today plus ceil(onslaughtDays)
  if (!completionDate || value > completionDate) completionDate = value   // :433
}
```

The `!completionDate` branch is why an all-blocked project can still show a date
today, and why simply deleting the collapse is not sufficient.

Two further properties of the current value:

- **It is not `estimatePlanSchedule`'s `summary.completionDate`.** The
  schedule's own summary (`estimate-plan.ts:260`) is the last _scheduled day_,
  and Raids Plan uses it (`daily-raids-plan` spec). Insights maxes over per-goal
  dates instead. The two agree when every goal is estimable and diverge
  otherwise; this change keeps Insights on the per-goal max, because that is the
  value that can degrade gracefully.
- **The three display surfaces are not symmetric.** Only
  `insights-summary.tsx:169` has an unknown placeholder
  (`completionDate ?? t("goals.insights.completionUnknown")`).
  `project-detail-header.tsx:249` and `project-row.tsx:90` render the date only
  when it is present and otherwise render nothing — they simply omit the line.

Formatting: `EstimateCell` (`goal-row-shared.tsx:28`) already renders the
localized, UTC-safe short date for a goal row. The three project surfaces
interpolate the raw string into `goals.project.completionSummary`
("Target {{date}}") and `goals.insights.completionDate` instead.

Projects list scope: `projects-list-page.tsx:117` attaches `completionDate` only
where `project.isActivePlan` is true — every other row shows no date, because
insights are computed for the current project only.

## Goals / Non-Goals

**Goals:**

- A project with some blocked goals still reports a date, with the caveat stated.
- A project with nothing estimable reports no date — not a token-accumulation
  day standing in for one.
- The project date is formatted the way every other date in Goals is.
- The value's meaning — last estimable goal in this priority order, extended by
  Onslaught token accumulation — is written down.

**Non-Goals:**

- Not computing a completion date for projects other than the active one (see
  Decision 6).
- Not changing any per-goal estimate, `estimatePlanSchedule.summary`, Raids
  Plan, Today, or Dailies.
- Not changing `onslaughtTokens` itself, or the Onslaught totals shown elsewhere
  (see Decision 3's residual).
- Not introducing a "sequence" concept distinct from a project. TIME-03 asks for
  "ordered goals or project plans"; a project _is_ V2's ordered goal list, and a
  second grouping primitive is not needed to answer the question.
- Not addressing GP-36 (multiple simultaneously active projects) — its decision
  changes which project's insights are current, not what this date means.

## Decisions

### 1. Estimate over the reachable subset, report the rest as a count

`completionDate` becomes the max over goals with a non-blocked outcome, and
`unestimatedGoalCount` reports how many of the project's goals are not behind
it.

Alternative (rejected): keep it absent whenever anything is blocked. That is the
current behavior and is what TIME-03 reports as the missing feature; a plan is
usually planned _because_ parts of it are not yet reachable.

Alternative (rejected): substitute a pessimistic sentinel date for blocked
goals. Invents a number no calculation produced.

### 2. Count exclusions against the project's goals, not `goalNeeds`

The obvious implementation — increment a counter in the aggregation loop where
`anyUnreachable` is set today — undercounts, because `goalNeeds` is already
filtered at `:253`: an orb-only Ascension goal, or any goal without a resolved
priority, never enters that loop and so would be silently neither estimated nor
counted. A project made entirely of such goals would report "no date, zero
excluded", indistinguishable from an empty project.

So `unestimatedGoalCount` is `params.details.length` minus the number of goals
that produced a non-blocked outcome. It is derived from the member goals the
function was handed, which is what the user-facing caveat claims to count.

### 3. The Onslaught term extends a date, it never creates one

Change the `!completionDate ||` branch at `:433` so the token-accumulation date
extends only an existing date. "Your Ascension goals need more Onslaught tokens
than you hold, so the plan cannot finish before the day they accumulate" is a
meaningful extension of a real completion date; presented alone, with every goal
blocked, it is a date for nothing.

**Residual, accepted:** `onslaughtTokens` accumulates at `:193` for every goal
the needs loop visits, including ones later found unestimable. So a blocked
goal's token demand can still push out the date of a project that has at least
one estimable goal. Correcting that means attributing token demand per goal and
dropping the excluded ones — a larger change to a figure also reported as a
standalone total. Out of scope; noted here so the next reader does not mistake
it for an oversight.

### 4. Reuse the Goals list's date formatting — via `shared/lib`

Extract the formatting `EstimateCell` performs inline into
`shared/lib/format-estimate-date.ts` (alongside the existing
`format-relative-time.ts`), and repoint `EstimateCell`,
`goal-estimate-section.tsx`, and the three project surfaces at it.

The extraction is **required**, not a preference: `project-row.tsx` lives in
`features/project-management/ui`, and importing from `pages/goals/ui` is a
features-to-pages layer violation that `fsd/forbidden-imports` rejects
(`steiger.config.ts` enables `fsd.configs.recommended` and disables only
`fsd/insignificant-slice`), failing the `lint:fsd` gate. This supersedes
`fix-plan-estimate-energy-model` Decision 2's rejection of a shared formatter,
which was correct for that change's pages-to-pages reuse and is not for this
one.

Note the resulting string is a bare short date ("Oct 11"), so the surrounding
copy must supply the year-free context — `goals.project.completionSummary`
becomes a label plus the formatted date rather than "Target 2026-10-11".

### 5. Only Insights gets an "unknown" placeholder

The three surfaces are already asymmetric and stay that way: Insights keeps
`goals.insights.completionUnknown`; the project detail header and the projects
list row keep omitting the date line entirely. Adding a placeholder to a summary
line that is a run of inline spans would put a dangling "—" next to the
reached/blocked counts for every project that has nothing estimable.

What all three _do_ share is the exclusion caveat — it renders whether or not a
date does, which is what keeps the omission from reading as "no information".

### 6. Other projects keep no date

Computing a completion date for every project in the list means running
`computePlanInsights` per project — every project's goals, needs, inventory
allocation, and a full day-by-day simulation each. That is the whole insights
pipeline multiplied by the project count, for a value shown in a list row.

Deferred deliberately: the projects list keeps a date only on the active plan,
and this change does not add a placeholder or an empty state implying otherwise
for the rest. Revisit if users ask to compare projects by date — and note that
GP-36's outcome (multiple active projects) changes what "the active plan" even
selects, so the question is better answered after it.

## Risks / Trade-offs

- **A date over a partial set can read as more complete than it is.** Mitigated
  by requiring the excluded-goal count to be shown wherever the date is, never
  the date alone.
- **The Onslaught term makes the date not purely goal-derived**, and Decision
  3's residual means an excluded goal can still influence it. Specified rather
  than hidden, but a user comparing the project date against every goal's Done
  By may still find it later than all of them.
- **Removing the collapse is not covered by an existing failing test.** The two
  absent-date expectations in `plan-insights-calc.test.ts` (line 361, no
  costable goals; line 542, a single all-blocked goal) both survive the new rule
  unchanged — there is no existing mixed blocked-plus-estimable case. The new
  behavior therefore needs _new_ tests, not rewritten ones, and nothing in the
  current suite would have caught the regression this change fixes.

## Migration Plan

None — no persisted data, API contract, or route changes.

## Open Questions

None. Decisions 3 (residual) and 6 are deliberate deferrals, not open questions.
