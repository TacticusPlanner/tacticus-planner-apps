## Why

Pause/resume and archive/unarchive are both buried together in the per-row "⋯" overflow menu with no bulk action, even though a bulk pause/resume endpoint already exists unused (GP-21/22). Separately, Pause and Archive read as two overlapping ways to say "not right now" with no clear distinction (GP-24/TERM-03) — the real distinction is a lifecycle one: Pause is for a goal you're not working on yet, Archive is for a goal whose target has already been reached and you're done with it. Today nothing enforces that, so a user can archive a goal they haven't even started. Clarifying Pause vs Archive by _when each applies_, rather than by wording alone, resolves GP-24/TERM-03 without removing Archive as CLUSTERS.md's original 2026-09-19 product decision proposed. That decision was itself reversed during this change's own scoping (2026-09-20, recorded in CLUSTERS.md) once a cross-repo removal turned out to be a bigger, riskier change than gating Archive's availability instead — this proposal implements that reversed, current decision, not a novel one.

## What Changes

- **Pause/resume becomes a primary, always-visible row action** (GP-21) — an icon button in the Actions column, not a menu item requiring the "⋯" menu to be opened first.
- **A bulk "pause all" / "resume all" action is wired to the project header's overflow menu** (GP-22), calling the already-built `UpdateProjectGoalsStatusEndpoint` via the already-exported, currently-uncalled `updateProjectGoalsStatus()` client function. Project-scoped only (matching the endpoint), so it appears on Project Detail, not Goals Overview.
- **Archive is only offered once a goal has reached its target.** The "⋯" menu's Archive item is hidden for a goal that hasn't reached its target (attainment-computed, via the same `useGoalAttainment`/`reached` signal the status filter's Reached count already uses) — client-side only; the api already accepts `Archived` as a valid transition target for any goal today and continues to (no api change). Unarchive remains available on an already-archived goal regardless of its reached state, since un-archiving is about restoring tracking, not re-entering an "in progress" lifecycle.
- **Pausing or resuming a goal cascades to its planner-linked prerequisites** (GP-23, `dependsOn`): pausing a goal also pauses each prerequisite it lists in `dependsOn`, but only a prerequisite with no _other_ goal depending on it (a prerequisite shared by more than one dependent is left alone, since pausing it could stall a sibling goal that's still active). Resuming a goal resumes every prerequisite it lists unconditionally — a shared prerequisite being made active never harms another dependent.

## Capabilities

### New Capabilities

- `goal-status-actions`: how a user changes a goal's lifecycle status from the goals list — the primary pause/resume action, the prerequisite cascade, Archive's reached-only availability, and the project-scoped bulk pause/resume action. Split out from `goal-list-layout` (purely visual/column layout) and `goal-project-membership` (project membership, not lifecycle status) since none of the existing capabilities own this behavior today.

### Modified Capabilities

- `goal-list-layout`: "Desktop table uses fixed-width, static columns at a fixed row height" states the Actions column "SHALL keep the existing '⋯' row-actions menu unchanged" — no longer true once pause/resume moves to a primary control alongside it.

## Impact

- `apps/web/src/fsd/pages/goals/ui/goals-board/goal-row-actions.tsx` — add the primary pause/resume icon button; gate the Archive menu item on a new `reached` prop; wire cascade into the pause/resume handlers.
- `apps/web/src/fsd/pages/goals/model/goals-data/use-goal-actions.ts` — extend `setStatus` (or add a sibling) to accept the prerequisite ids to cascade to and the current row set needed to compute "no other dependent" for pause.
- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-page.tsx`, `apps/web/src/fsd/pages/goals/ui/projects/project-detail-page.tsx` — thread `reached` (already computed via `useGoalAttainment`) and the dependency-count lookup down to `GoalRowActions`.
- `apps/web/src/fsd/pages/goals/ui/projects/project-detail-header.tsx` — add "Pause all goals" / "Resume all goals" to the existing overflow menu, calling `updateProjectGoalsStatus()`.
- `apps/web/src/fsd/entities/project/api/project.api.ts`, `entities/project/index.ts` — `updateProjectGoalsStatus` already lives and is already cleanly exported here; confirm the export during implementation rather than add a new one. No new endpoint, this function already exists.
- No API change — every endpoint this needs (`UpdateGoalStatusEndpoint`, `UpdateProjectGoalsStatusEndpoint`) already exists and already behaves correctly for this scope; confirmed during scoping (see design.md).
