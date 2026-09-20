## Why

`add-inline-goal-reprioritize` made priority a flat, per-goal, directly-draggable order, but there is still no way to actually _see_ that order: Project Detail's Sort control offers Character/Type/Status/Recently-updated, never Priority, and its default stays "Recently updated." A goal's true priority only exists as an invisible number driving downstream calculations (shared-inventory allocation, Level-goal XP-book potential, completion-date estimates) — a user reordering goals, or reading two goals' differing "potential progress" percentages, has no way to confirm what order those calculations actually used, and adjacent-looking rows under any other sort can be far apart in real priority. This was diagnosed live this session from a "potential progress looks wrong" report that turned out to be a correctly-functioning priority-ordered allocator read against the wrong (non-priority) row order.

**Revised mid-implementation**: adding Priority as one more selectable Sort option (this change's first cut, fully built and tested) still let a user navigate away from priority order — a Type filter could also hide part of the sequence. Since project detail's whole point is showing _this project's_ priority-ordered plan, not a filtered/re-sortable view of it, the simpler and more robust fix is to remove the Type filter and Sort control from project detail entirely: every goal type is always shown, and priority order is the only order, never optional. Goals Overview is unaffected — its own independent Type/Sort/Group/Status controls, and the reasoning that a cross-project list has no single priority to sort by, are untouched by this change.

## What Changes

- **Remove the Type filter and Sort control from Project Detail.** The route keeps its status filter and Group control; Type and Sort no longer render there at all.
- **Project Detail's goal list is always ordered by stored per-goal priority** (in-flight goals 1..N in their true order, historical goals after, matching how the API's two-zone renumbering already works) — not a default among choices, the only order, with no UI path to change it.
- **Every goal type is always shown** on Project Detail — there is no way to filter it down by type anymore.
- Goals Overview is untouched: it keeps its own Type/Sort/Group/Status controls exactly as before, still without a Priority option (a goal there can belong to several projects, each with its own priority, so there is no single number to sort by).

**Investigated and found already resolved / out of scope**, from the original Cluster 4 scoping of this change:

- **TIME-04** ("reordering should immediately update the timeline"): already true today — `usePlanInsights`'s recompute key includes priority, so any reorder already triggers a fresh completion-date calculation with no manual refresh needed (and, since this session's `usePlanInsights` fix, without blanking the display while it recomputes). No further work.
- **GP-16** ("grid reading order is unintuitive"): the goal list has since been redesigned into a single-column table (desktop) / stacked card list (mobile) — there is no multi-column CSS grid anywhere in `goals-list.tsx`, `goals-mobile-cards.tsx`, or `project-detail-goals.tsx` for a "reading order" to be ambiguous in. Moot.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `project-management`: Project detail's Type filter and Sort control are removed; its goal list is always shown unfiltered by type and always ordered by stored priority. Group and the status filter are unaffected.

## Impact

- `entities/goal/ui/goal-filters.tsx` (`GoalFilters` — Project Detail stops rendering its Type and Sort controls; Overview is unaffected and keeps using the component as before)
- `pages/goals/ui/projects/project-detail-page.tsx` (drops `goalType`/`sort` state and the Type-filter/Sort-comparator logic; goal list unconditionally ordered by `priority`)
- No API change: `priority` is already returned by `GET /me/projects/{id}/goals` and already carried on `GoalRow`
- Apps-only change, no companion API-repo change needed
