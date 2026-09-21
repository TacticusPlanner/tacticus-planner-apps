## Why

Testers who configured the same goals in V1 and V2 and synced both profiles get
systematically later dates from V2, and the gap grows with priority position
(CALC-03: Trajann unaffected, Aesoth +5d, Laviscus +11d, Gulgortz +21d, Lucien
+22d). A "Done By" date whose only explanation is "V1 said something else" is
not a trustworthy planning output.

The divergence is not a bug. It is an undocumented architectural difference:

- **V1** (`tacticusplanner/src/fsd/3-features/goals/upgrades.service.ts:2680`,
  `getUpgradeEstimate`) gives every _material_ its own full daily energy budget
  (`dailyEnergy = loc.dailyBattleCount * loc.energyCost`). Priority order
  (`getGoalPriorityEstimates`, line 2606) only decides who claims **held
  inventory** first; it never gates one goal's farming _time_ on another's
  energy spend.
- **V2** (`apps/web/src/fsd/features/goal-farming/lib/estimate-plan.ts:137-187`,
  `runPlanSchedule`) drains one literal `energy = dailyEnergy` pool per calendar
  day, goal by goal in priority order, so a lower-priority goal farms only with
  what survives every higher-priority goal's turn that day.

A player has one energy budget per day, so V2's model is the defensible one and
V1's per-material silo is the latent bug V2 implicitly corrects — but nothing in
the specs or the UI says so, which is why the difference reads as a defect. This
change makes the model an explicit, tested, stated requirement instead of an
emergent property of one loop, and closes the one place a user can see a date
with no way to tell which model produced it.

It also closes TIME-02's residual gap: the goal-detail sheet
(`goal-estimate-section.tsx:30`) renders only `≈ {{days}} days` and never a
date, unlike the Goals list rows, which show a localized date and the day count
(`goal-row-shared.tsx:55`, `EstimateCell`). TIME-02's original hover-only
complaint is already resolved — that section renders plain text with an explicit
"Isolated estimate" badge — so only the missing date remains, and it belongs in
the same change as the model it displays.

## What Changes

- **The shared daily energy pool becomes a specified requirement**, with an
  assumption list and a worked example, so the model that produces a date is
  stated rather than inferred from `runPlanSchedule`'s loop. No behavior change
  under the recommended option — see `design.md` Decision 1, which is **open**
  and carries the alternative (restore V1's per-goal budget) with what the spec
  delta and task list become if the team picks it.
- **A regression test pins the contention semantics**: two goals sharing one
  pool produce the later date for the lower-priority goal, and swapping their
  priority swaps their dates.
- **The goal-detail estimate shows a date, not only a day count**, reusing the
  Goals list's existing localized, UTC-safe formatting rather than a second
  formatter.
- **The detail estimate says which model produced it, and only when there is a
  figure to label** — the existing "Isolated estimate" badge keeps its meaning,
  a plan-aware estimate gains a matching short caption, and both move inside the
  estimate-present branch. Today the badge renders unconditionally
  (`goal-estimate-section.tsx:23`), so a Blocked goal reads "Isolated estimate"
  above a blocked reason and no estimate at all. "Isolated" here describes how
  the displayed number was computed, not whether the goal belongs to a project —
  the Goals page estimates goals one at a time even for a goal that does.

No change to node selection, inventory allocation, flat suppliers, attempt caps,
Raids Plan, Today, or Dailies. Frontend repo only — no companion
`tacticus-planner-api` change.

## Capabilities

### New Capabilities

- `goal-detail-estimate-display`: what the goal-detail sheet's Estimate section
  shows — date and day count, isolated vs. plan-aware framing, blocked and
  unavailable states. Deliberately separate from `goal-list-estimate-display`,
  which scopes itself to the Goals list and explicitly disclaims this surface.

### Modified Capabilities

- `goal-farming-estimates`: gains the shared-daily-energy-budget requirement
  covering how a plan estimate allocates one day's energy across several goals.

## Impact

- `apps/web/src/fsd/features/goal-farming/lib/estimate-plan.test.ts` — the
  contention regression test.
- `apps/web/src/fsd/pages/goals/ui/goal-detail/goal-estimate-section.tsx` —
  renders the date via the list's already-exported `EstimateCell`; keeps its own
  blocked and unavailable text; moves the framing labels inside the
  estimate-present branch.
- New `apps/web/src/fsd/pages/goals/ui/goal-detail/goal-estimate-section.test.tsx`
  — the directory has no per-section test today.
- `apps/web/public/locales/{en,de,es,fr}/common.json` — the plan-aware caption
  under `goals.detail.*`, with real de/es/fr translations.
- Tests: `goal-estimate-section` coverage for the date, the isolated badge, and
  the blocked path.
- No tutorial change: no page flow, route, or Joyride anchor moves.
