## Why

TIME-03 asks for "a meaningful projected completion timeline for ordered goals
or project plans" so an LRE or raid-season start can be planned against a date.
V2 already computes and shows one — `computePlanInsights`
(`plan-insights-calc.ts:352-365`) takes the maximum completion date across the
project's goals, and it is rendered on Insights (`insights-summary.tsx:169`),
the project detail header (`project-detail-header.tsx:251`), and the projects
list row (`project-row.tsx:90`).

The gap is that the number is fragile, unreadable, and — in one case — quietly
wrong:

- **One blocked goal erases the date.** `if (anyUnreachable) completionDate =
null` (`plan-insights-calc.ts:365`) collapses the project to "no date" as soon
  as a single goal is Blocked — no farm location, no selected acquisition
  source, a campaign node not yet reached. A plan with nine estimable goals and
  one blocked one reports nothing at all, which is precisely the plan a player
  most needs a date for. (`energyTotal`, computed one line above over the same
  loop, is already reported over the estimable subset — the "partial totals are
  still useful" posture exists; the date is the exception.)
- **Except when Onslaught rescues it with something worse.** The Onslaught
  token-accumulation term at `plan-insights-calc.ts:423-434` runs _after_ the
  collapse and does `if (!completionDate || value > completionDate)
completionDate = value`. So a project whose goals are all blocked, but whose
  Ascension needs exceed the account's token balance, currently shows a bare
  token-accumulation date anchored to no goal at all. The collapse and this term
  together mean the current date is neither reliably present nor reliably
  goal-derived.
- **It renders as a raw `YYYY-MM-DD`.** All three surfaces interpolate the
  estimate's raw string ("Target 2026-10-11"), while a goal row two lines away
  shows "📅 Oct 11 · in 22 days" through `EstimateCell`'s localized, UTC-safe
  formatter. The same date reads two different ways on the same page.
- **Nothing says what the date covers.** With the project's own goals contending
  for one daily energy budget (see `fix-plan-estimate-energy-model`), the
  project date is "when the last goal in this order finishes" — a fact that
  changes when priorities change, and that no label currently states.

## What Changes

- **A blocked goal no longer erases the date.** The projected completion date is
  computed over the goals that _can_ be estimated, and the count of the
  project's goals excluded from it is reported alongside, so the figure is
  always either a date with a stated caveat or an explicit "no goal in this
  project can be estimated".
- **The Onslaught term extends a date; it never creates one.** When no goal
  could be estimated there is no date to extend, and the surfaces say so rather
  than showing a token-accumulation day on its own.
- **Exclusions are counted over the project's goals, not the estimator's
  inputs.** `goalNeeds` is already filtered before estimation
  (`plan-insights-calc.ts:253` requires needs-or-stages _and_ a priority;
  orb-only Ascension goals go to `orbGoalNeeds` instead), so counting skips
  within that loop would silently undercount. The count is taken against the
  project's member goals.
- **The date is formatted like every other date in Goals** — localized short
  date, UTC-safe — on all three surfaces, via a formatter extracted to
  `shared/lib` so the features-layer `project-row.tsx` can use it without
  importing from `pages`.
- **The date is labeled for what it is**: the day the last estimable goal in
  this project's current priority order finishes, with the excluded-goal count
  when there is one.

No change to how any individual goal's estimate is computed, to Raids Plan's own
plan summary, to Today, or to Dailies. Frontend repo only — no companion
`tacticus-planner-api` change.

**Sequenced after `fix-plan-estimate-energy-model`**, whose Decision 1 settles
what a per-goal date means; a project rollup can be no more trustworthy than the
dates it maxes over.

## Capabilities

### New Capabilities

- `plan-completion-outlook`: the project-level projected completion date — what
  it aggregates, how it behaves when some goals cannot be estimated, how the
  Onslaught term interacts with it, how it is formatted, and which surfaces show
  it. Previously unspecified behavior that already ships.

### Modified Capabilities

_None._

## Impact

- `apps/web/src/fsd/pages/goals/model/insights/plan-insights-calc.ts` — drop the
  `anyUnreachable → null` collapse; count exclusions against the project's goal
  details; gate the Onslaught extension on an existing date.
- `apps/web/src/fsd/pages/goals/model/insights/use-plan-insights.domain.ts` —
  `PlanInsightsResult` and its empty default gain `unestimatedGoalCount`.
- New `apps/web/src/fsd/shared/lib/format-estimate-date.ts` (+ barrel export),
  alongside the existing `format-relative-time.ts`; `EstimateCell`
  (`goal-row-shared.tsx`) and `goal-estimate-section.tsx` repoint at it.
- `apps/web/src/fsd/pages/goals/ui/insights/insights-summary.tsx`,
  `ui/projects/project-detail-header.tsx`,
  `ui/projects/projects-list-page.tsx`, and
  `features/project-management/ui/project-row.tsx` — formatted date plus the
  excluded-goal caveat.
- `apps/web/public/locales/{en,de,es,fr}/common.json` — the caveat and relabeled
  `goals.insights.*` / `goals.project.completionSummary` copy, with real de/es/fr
  translations.
- Tests: `plan-insights-calc.test.ts` for the mixed, all-blocked, and
  Onslaught-with-nothing-estimable cases, plus the three rendering surfaces.
- No tutorial change: no page flow, route, or Joyride anchor moves.
