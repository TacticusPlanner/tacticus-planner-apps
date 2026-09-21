## Why

`GUI-01`'s acceptance criteria ask for scanability through "grouping,
sorting, filtering, and/or denser presentation" on Goals Overview.
Grouping, sorting, and filtering already ship (`goal-filters.tsx`); the one
gap is density — there is no way to see more goals at once without
scrolling. The list's current single fixed row height/card structure
(`goal-list-layout`) already ships one deliberately tightened density; this
adds a second, denser option a user can opt into for high-volume scanning,
without touching that existing default.

## What Changes

- Add a two-value density preference — the existing presentation (kept as
  the default) and a new, denser one — persisted per browser the same way
  `goals.overview.group` already is.
- Add a density toggle control to the Goals Overview toolbar, alongside the
  existing Type/Sort/Group and project-membership filters.
- In the denser option: the desktop table drops each row's secondary
  caption line (the goal-type subtext under the unit name, and the "Done
  By" line under the status label) to a strict single line per row,
  reducing the fixed row height further; the mobile card drops its
  remaining-text/info footer line, reducing each card's height. Every other
  structural element (six-column table contract, one-card-per-goal
  structure, the Level-goal merge-into-dependent rule, the shared legend)
  is unchanged in both densities.
- Scoped to Goals Overview only — Project Detail's goal list is unaffected.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `goal-list-layout`: adds a second, denser row/card presentation alongside
  the existing one, selectable via a new preference; the existing
  fixed-height, six-column, one-card-per-goal, and legend requirements
  otherwise stand.
- `goals-navigation`: the Overview toolbar's enumerated control set
  (desktop single-row requirement, mobile icon-only-compression
  requirement) gains the new density toggle alongside the filters it
  already lists.

## Impact

- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-page.tsx` — new
  persisted density state and toolbar toggle control.
- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-list.tsx` and
  `goals-mobile-cards.tsx` — accept and apply the density value.
- `apps/web/src/fsd/entities/goal` — a new `GoalDensityValue` type/guard,
  mirroring the existing `GoalGroupValue` pattern.
- Translation additions (all four locales) for the toggle's label/options.
- Scoped to Goals Overview; Project Detail's goal list (which reuses
  `GoalsList`) keeps rendering at the existing default density only — it
  gets no toggle of its own.
- No backend/API changes — apps-only, no companion `tacticus-planner-api`
  change.
