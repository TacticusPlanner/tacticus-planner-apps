## 1. Aggregate over the reachable subset

- [x] 1.1 In `apps/web/src/fsd/pages/goals/model/insights/plan-insights-calc.ts`,
      remove the `if (anyUnreachable) completionDate = null` collapse (`:365`).
      Verify the existing `energyTotal` behavior — already computed over the
      estimable subset in the same loop — is untouched.
- [x] 1.2 Count exclusions against the project's member goals, not `goalNeeds`:
      `unestimatedGoalCount` is `params.details.length` minus the number of
      goals that produced a non-blocked outcome. Do **not** count skips inside
      the `for (const goal of goalNeeds)` loop — `goalNeeds` is pre-filtered at
      `:253` (needs-or-stages plus a resolved priority) and orb-only Ascension
      goals go to `orbGoalNeeds`, so that count would undercount (design
      Decision 2).
- [x] 1.3 Gate the Onslaught extension (`:433`) on an existing date so the
      token-accumulation day extends a real completion date and never becomes
      one. Verify an all-blocked project with a token shortfall now reports no
      date, where today it reports the bare token date.
- [x] 1.4 Add `unestimatedGoalCount: number` to `PlanInsightsResult` and its
      empty default in
      `apps/web/src/fsd/pages/goals/model/insights/use-plan-insights.domain.ts`.
      Verify `pnpm --filter web typecheck` passes.
- [x] 1.5 **Add** (not rewrite) the new cases to `plan-insights-calc.test.ts` —
      the suite has no mixed blocked-plus-estimable case today, and its two
      existing absent-date expectations (line 361, no costable goals; line 542, a
      single all-blocked goal) must still pass unchanged: - two estimable goals (3 and 7 days) plus one blocked goal reports the
      7-day goal's date with `unestimatedGoalCount` 1; - an all-blocked project reports no date, with the count equal to the
      project's goal count; - an all-blocked project **with an Onslaught token shortfall** reports no
      date (the 1.3 gate); - a project whose goals are all orb-only or priority-less reports no date
      with a non-zero count, distinguishing it from an empty project (the 1.2
      fix).
      Verify `pnpm --filter web exec vitest run src/fsd/pages/goals/model/insights/plan-insights-calc.test.ts` passes.
- [x] 1.6 Add a test pinning that, for a project with at least one estimable
      goal, an Onslaught shortfall still pushes the date past every goal's own
      date — so 1.3 gates the create case only and does not delete the extension.

## 2. Extract the date formatter

- [x] 2.1 Create `apps/web/src/fsd/shared/lib/format-estimate-date.ts` holding
      the localized, UTC-safe formatting `EstimateCell` performs inline
      (`goal-row-shared.tsx:34-54`: `Intl.DateTimeFormat` with `month: "short"`,
      `day: "numeric"`, `timeZone: "UTC"`, and explicit `Date.UTC` component
      parsing of the `YYYY-MM-DD` value). Export it from `shared/lib/index.ts`
      alongside `format-relative-time`. Verify a unit test covers a viewer west
      of UTC not rolling the day back.
- [x] 2.2 Repoint `EstimateCell` (`pages/goals/ui/goals-board/goal-row-shared.tsx`)
      and `pages/goals/ui/goal-detail/goal-estimate-section.tsx` at the shared
      helper, with no change to their rendered output. Verify the existing goal
      row and detail-section tests pass untouched.

## 3. Format and label the date

- [x] 3.1 Render the date on `ui/insights/insights-summary.tsx` through
      `formatEstimateDate`, keeping the `insights-completion-date` test id and
      its existing `goals.insights.completionUnknown` placeholder. Verify the
      same project shows the same date string here and on its latest estimable
      goal's row.
- [x] 3.2 Do the same on `ui/projects/project-detail-header.tsx` and
      `features/project-management/ui/project-row.tsx` (the features-layer
      consumer the 2.1 extraction exists for), and change
      `goals.project.completionSummary` from "Target {{date}}" to copy that
      reads correctly with a bare short date. Leave both surfaces omitting the
      line when there is no date — neither has a placeholder today and neither
      gains one (design Decision 5).
- [x] 3.3 Show the excluded-goal caveat on all three surfaces from
      `unestimatedGoalCount`, via a new `goals.insights.completionExcluded` (or
      equivalent) plural key. The caveat renders whether or not a date does —
      it is what keeps the two placeholder-less surfaces from reading as "no
      information" — and a date must never render without it when the count is
      above zero. Thread the count through `projects-list-page.tsx`'s summary
      object to `project-row.tsx`.
- [x] 3.4 Add the new keys to `apps/web/public/locales/en/common.json` with real
      de/es/fr translations in the three sibling files, at the quality of the
      surrounding `goals.insights.*` / `goals.project.*` keys, including each
      locale's plural forms. Verify by opening all four files and confirming the
      keys are present and genuinely translated — **no existing test covers
      `goals.*` key parity** (`*-translations.test.ts` covers only dailies,
      shops, team, events, and library), and `pnpm typecheck` catches only a
      missing **en** key via `i18next.d.ts`. Run `pnpm --filter web typecheck` as
      the en-side check.
- [x] 3.5 Update the rendering tests for all three surfaces: date with no caveat
      when nothing is excluded; date plus caveat when one goal is; on Insights
      the placeholder plus caveat when nothing is estimable, and on the other two
      the caveat alone with no date line.

## 4. Gates

- [x] 4.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`,
      and `git diff --check`. All green — `lint:fsd` in particular, since task
      3.2 is the import the 2.1 extraction exists to make legal.

## 5. Manual verification

Verified 2026-09-21 on the running Aspire stack, signed in, against the real
"My Goals" project (30 goals, 14 of them not behind the date).

- [x] 5.2 State (b) — a project with goals that cannot be estimated: **all three
      surfaces verified**. The projects list row reads "Done by Dec 28 · 14 goals
      not included in this date"; the project detail header reads "1 reached ·
      10 blocked · Done by Dec 28 · 14 goals not included in this date"; Insights
      reads "Completion date: Dec 28" with the same caveat beneath. The date is
      the same on all three and formatted the way the goal rows' own Done By
      dates are ("Sep 22", "Oct 15"), replacing the raw `2026-12-28` that the
      project surfaces showed before this change. Non-current projects ("Verify
      A", "Verify B") show neither a date nor a placeholder, per design
      Decision 6.
- [x] 5.5 Spanish (`LOC-07`'s text-expansion stress case): Insights reads "Fecha
      de finalización · 28 dic" with "14 objetivos no incluidos en esta fecha" —
      correct plural form and localized date, no truncation at desktop width.
      The sub-768px half is deferred, see 6.3.

## 6. Deferred / out-of-session

Same posture as `fix-plan-estimate-energy-model` §6: skipped rather than
mutating a live profile. Every case below is covered by automated tests
(`plan-insights-calc.test.ts`, `insights-summary.test.tsx`,
`project-detail-header.test.tsx`, `project-row.test.tsx`).

Tracking issue: **not yet filed** — open one in
`TacticusPlanner/tacticus-planner-apps` covering this and the sibling change's
§6 before relying on these being picked up.

- [ ] 6.1 (was 5.1) State (a), a project whose goals are **all** estimable —
      the "date with no caveat" case. **Required data state unavailable**: the
      only current-plan project has 14 goals that cannot be estimated, and the
      other two projects are not the current plan so they compute no insights at
      all (design Decision 6). Everything 5.1 asserts other than the absent
      caveat was verified under 5.2; the no-caveat case is covered by a test on
      each of the three surfaces.
- [ ] 6.2 (was 5.3) State (c), a project whose every goal is Blocked — the
      "placeholder on Insights, caveat alone on the other two" case.
      **Required data state unavailable**: producing it means making a project
      current and stripping its goals' acquisition sources, which mutates the
      owner's live profile and the project Dailies/Insights read from.
- [ ] 6.3 (was 5.4 + 5.5's viewport half) State (d), an empty project, and the
      sub-768px repeat. The empty project needs the same "make current" mutation
      as 6.2; `resize_window` reported success without changing the viewport, so
      the responsive check never actually ran.
