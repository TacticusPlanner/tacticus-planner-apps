## Why

Project priority reordering today happens at unit granularity: goals are grouped into contiguous unit blocks, and the only way to reorder is a dedicated "Reprioritize Units" dialog/Sheet that drags whole blocks. A 2026-09-19 product decision (Cluster 4/7 of the feedback backlog) replaces this with flat per-goal priority, reordered inline — a drag handle on every goal row on desktop, and a collapse-to-reorder mode on mobile with no separate dialog and no explicit Save step. This is simpler for users and unblocks Cluster 7's "rank range" goals (two real, linked goals of the same type for one unit) from being forced to sit adjacent to each other.

## What Changes

- **BREAKING**: Remove the "Reprioritize Units" dialog/Sheet and its unit-block drag surface.
- Add a drag handle to every goal row on desktop (`@dnd-kit/core`/`sortable`, already a dependency and already used for the surface being removed — `reprioritize-units-sheet.tsx`) for direct inline reordering; no separate "reorder mode" trigger needed on desktop.
- Add a mobile reorder mode: a button collapses every card to its minimal identifying info and makes cards directly draggable in place; no dialog, no explicit Save — each completed drag commits immediately, same as desktop.
- Priority becomes a flat per-project list of individual goals, not unit blocks — a goal can be dragged to any position regardless of whether a prerequisite it `DependsOn` has been reached (priority is now a pure ordering/scheduling preference, decoupled from dependency validity; the existing Restricted/Blocked indicator is unaffected and remains the signal for "this goal can't actually proceed yet").
- Group=Unit remains available as a display/view option (goals visually clustered by unit when selected) but becomes purely a rendering choice over the flat per-goal priority list — it no longer reflects how priority is stored or ordered.
- Calls the companion API change's new goal-keyed reorder endpoint instead of the unit-keyed `PUT /me/projects/{id}/unit-order`.
- **Folded in from Cluster 7's Level-goal decision** (not an ordering change, but bundled here since it's the same goal-list rendering surface): a Level goal stops rendering as its own row when it's the sole thing exactly one Rank or Ability goal `DependsOn`s — its existing progress bar/percent/remaining-text (already fully spec'd by `goal-progress-display`, unchanged) renders as a sub-line nested under that parent goal's row instead. `GoalType.Level` is **not** removed — it stays a real, independently addressable `Goal` (still creatable, still has its own status/priority/actions) — only the _list rendering_ changes. A Level goal with no single unambiguous dependent (none, or more than one) falls back to rendering as its own row, unchanged from today.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `project-management`: at least 5 requirements are being replaced, not incrementally revised —
  - "Users prioritize units rather than goals" (states normal goal rows SHALL NOT render move-up/down controls — the opposite of the new per-row drag handle)
  - "Goal order inside a unit is automatic" (states the user SHALL NOT manually reorder goals inside a unit — superseded by direct per-goal drag)
  - "Unit order drives priority-sensitive calculations" (Dailies/Insights/estimates described under a unit-order framing — needs reframing to goal order, no calculation change)
  - "Project management is deliberately responsive" (its mobile reorder scenario describes the per-unit-drag Sheet being removed)
  - "Sort orders unit blocks rather than their contents" (Group=Unit's Sort behavior — needs reframing now that Group=Unit is display-only over a flat list)
- `goal-list-layout`: two independent deltas on the same spec —
  1. the desktop table's static, fixed column set and fixed row height need to accommodate a per-row drag handle where reordering is available (Project Detail) without affecting the non-reorderable Goals Overview list (which this doesn't touch) — needs a delta describing where the handle renders and that it's conditional on context.
  2. a new rule for when a Level goal's row is absorbed into its dependent Rank/Ability goal's row as a sub-line instead of rendering as its own row (and the fallback-to-standalone-row conditions) — applies wherever the Goals list renders (both Project Detail and Goals Overview), independent of the reorder work above.

## Impact

- **UI**: `reprioritize-units-sheet.tsx` (removed), the goal list/row rendering shared by Project Detail (drag handle addition, desktop and mobile), `project-detail-page.tsx`'s Group=Unit view (becomes display-only).
- **API dependency**: consumes the companion `tacticus-planner-api` change's new goal-keyed reorder endpoint; that change applies first.
- **Cross-reference**: Cluster 7's `add-rank-range-progression` (GP-05) depends on this change landing (or at least being decided) for its two-linked-goals interleaving to work as intended — sequence after this one.
