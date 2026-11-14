## Context

The Goals page already computes one global-plan estimate per goal (Done By) and Season fit's per-goal offset from it (`features/goal-planning/model/season-fit/`). `add-project-deadline-targets` adds `useProjectDeadline(project)` in `entities/project`. Project cards render in `features/project-management/ui/project-summary-row.tsx`, used by the Projects page and the home widget (`pages/home/ui/projects/projects-widget.tsx`).

## Goals / Non-Goals

**Goals:** a fit per goal for the project's own deadline, a count on cards, and Season fit kept as is outside targeted scopes.

**Non-Goals:** the "This project alone" basis (`add-project-fit-basis`), reordering (`add-move-project-goals`), and fits on the unscoped Goals page, Dailies, Schedule or Insights.

## Decisions

1. **Owning slice: `features/goal-planning/model/deadline-fit/`.** It holds the pure functions `deadlineFit(estimateDate, deadlineMs)` (returning `{ fits: true } | { fits: false; daysLate }`), `deadlineFitSummary(rows, fits, reached)` and `deadlineCutoffGoalId(orderedIds, fits)`, plus `useProjectDeadlineFit(project, rows, estimates, reached)` and `useProjectFitCounts(projects)`. They reuse `isSeasonFitEligible` and `completionInstantMs` from Season fit rather than a second eligibility path. Exported from `features/goal-planning/index.ts`.
2. **One canonical result.** `ProjectDeadlineFit = { status: "off" | "loading" | "unavailable" } | { status: "ended"; deadline } | { status: "ready"; deadline; byGoalId: Map<goalId, Fit>; summary: { fit, total, notEstimated, allDone }; cutoffGoalId }`. The header, labels, divider and card count all derive from it. The card count is `summary` from the same function.
3. **Days late.** `daysLate = ceil((completionInstant − deadlineMs) / 86 400 000)`, in whole UTC days, where the completion instant is 00:00 UTC on Done By + 1 day (Season fit's rule). Fits when the completion instant is at or before the deadline.
4. **Cards without a feature-to-feature import.** `features/project-management` cannot import `features/goal-planning`. The card gets an optional `fitSummary` render slot. `pages/goals` (Projects route) and `pages/home` call `useProjectFitCounts(projects)` and pass each summary in. Both pages already run the global plan for the Default card or the Goals list, so the home page computes it only when at least one non-archived project has a target. It reads player data locally, so the widget still issues only the projects and goals reads.
5. **Override.** `pages/goals` decides: in a targeted scope it renders the read-only chip in the Season fit slot and passes the deadline fit to the list instead of the Season fit state. The persisted Season fit choice is kept and applies again when the scope changes.
6. **Desktop and mobile.** The header sits in the scope bar on desktop and as the first line above the cards on mobile. Labels, accents and the divider reuse Season fit's desktop row and mobile card placements, so there is no other split. The Goals tour step targets `[data-testid="goals-deadline-fit"]` on both.

## Risks / Trade-offs

- The home page gains a plan run when any project has a target. It is skipped otherwise, and covered by a test that counts runs.
