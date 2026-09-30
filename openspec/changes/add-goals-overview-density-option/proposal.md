## Why

`GUI-01`'s acceptance criteria ask for scanability through "grouping,
sorting, filtering, and/or denser presentation" on the Goals page.
Grouping and filtering already ship (`goal-filters.tsx`), and the page is one
priority-ordered list (there is no sort to add); the one gap is density —
there is no way to see more goals at once without scrolling. The list's
current single fixed row height/card structure (`goal-list-layout`) already
ships one deliberately tightened density; this adds a second, denser option
a user can opt into for high-volume scanning, without touching that existing
default.

## What Changes

- Add a two-value density preference — the existing presentation (kept as
  the default) and a new, denser one — persisted per browser the same way
  `goals.overview.group` already is.
- Add a density toggle control to the Goals page toolbar (`/plan/goals`),
  alongside the existing Type/Group and project-membership filters.
- In the denser option: the desktop table drops each row's secondary
  caption line (the goal-type subtext under the unit name, and the "Done
  by" line under the status label) and uses a shorter fixed row height; the
  mobile card tightens its padding and spacing while retaining its
  remaining-text/info footer. Every other structural element (six-column
  table contract, the leading drag handle, one-card-per-goal structure,
  level-requirement sub-lines, the shared legend, priority order and
  reordering) is unchanged in both densities. A row showing level-requirement
  sub-lines keeps the Comfortable height.
- Scoped to the Goals page only — Project Detail's goal list is unaffected.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `goal-list-layout`: adds a second, denser row/card presentation alongside
  the existing one, selectable via a new preference; the existing
  fixed-height, six-column, drag-handle, one-card-per-goal, and legend
  requirements otherwise stand.
- `goals-navigation`: the Goals control row's enumerated control set
  (desktop single-row requirement, mobile icon-only-compression
  requirement) gains the density toggle and a wrap rule for the narrowest
  width.

## Impact

- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-page.tsx` — new
  persisted density state and toolbar toggle control.
- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-list.tsx` and
  `goals-mobile-cards.tsx` — accept and apply the density value.
- `apps/web/src/fsd/entities/goal` — a new `GoalDensityValue` type/guard,
  mirroring the existing `GoalGroupValue` pattern.
- Translation additions (all four locales) for the toggle's label/options
  and the Goals tour's density step.
- Scoped to the Goals page; Project Detail's goal list (which reuses
  `GoalsList`) keeps rendering at the existing default density only — it
  gets no toggle of its own.
- No backend/API changes — apps-only, no companion `tacticus-planner-api`
  change.
- Archive order: this change edits requirements that
  `integrate-level-progression-into-rank-goals` (mobile card requirement
  rename, level-requirement sub-lines) and
  `consolidate-goals-into-plan-and-remove-active-project` (Goals page
  rename, drag handle, control-row renames) create or modify, so both are
  archived first. It also lands after `add-goals-bulk-actions`, which
  splits the desktop control area into an actions row and a filters row
  (and adds the mobile select toggle) — the density toggle goes on the
  filters row.
