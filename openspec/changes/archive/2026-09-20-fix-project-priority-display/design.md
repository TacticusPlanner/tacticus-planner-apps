## Context

`GoalFilters` (`entities/goal/ui/goal-filters.tsx`) renders Type, Sort, and Group as one bundled row, consumed by both `goals-page.tsx` (Overview) and `project-detail-page.tsx` (Project Detail). `GoalRow` already carries `priority` (`model/shared/types.ts`, sourced from `ProjectGoalSummary.priority` — already returned by the existing goals-list endpoint). Project Detail's own filter/sort state and comparator live in `project-detail-page.tsx`; Overview's are separate and untouched by this change. See proposal.md for why Type and Sort are removed rather than merely defaulted to all-types/priority.

## Goals / Non-Goals

**Goals:**

- Project Detail renders only the status filter and Group control from the shared filter row — no Type, no Sort.
- Project Detail's goal list is unconditionally ordered by `GoalRow.priority` ascending — no state, no comparator branch, just the one order.
- Update `entities/goal-filters` tests, `project-detail-page.test.tsx` for the removed controls and the now-unconditional priority order.

**Non-Goals:**

- Any change to Goals Overview — its Type/Sort/Group/Status controls, and its own comparator, are untouched.
- Any change to `allocateXpBooksAcrossGoals`/`level-potential-allocation.ts` or any other calculation — those are already correct (see proposal.md); this change only makes their input order the only one visible.
- TIME-04 and GP-16 — investigated in proposal.md, already satisfied / moot.

## Decisions

**`GoalFilters` gains `showTypeFilter?: boolean` and `showSort?: boolean` props, both defaulting to `true`.** Project Detail passes both `false`; Overview passes neither and is unaffected. A pair of booleans (rather than the `includePrioritySort` flag this change's first cut added, now removed) matches the actual shape of the need: exactly one caller hides exactly these two controls, nothing more granular is required. Group and the status filter render unconditionally for every caller — only Type and Sort become caller-controlled.

**Project Detail drops its `goalType`/`sort` state entirely, not just their UI.** With no Type filter or Sort control to drive them, keeping the state (fixed to `"all"`/`"priority"`) would be dead weight — every place that read `goalType`/`sort` either drops the check (`filteredAllRows`/`filteredNonArchivedRows` collapse into `allRows`/`nonArchivedRows`) or hardcodes the priority comparator (`(a, b) => a.priority - b.priority`) with nothing to branch on.

**`GoalSortValue` and `GoalTypeFilterValue` are unchanged** (this change's first cut had added `"priority"` to `GoalSortValue`; reverted). Since no UI ever offers Priority as a selectable Sort value anymore on either route, there's no reason for the type to carry it.

## Risks / Trade-offs

[A user who wanted to see only one goal type on Project Detail loses that ability] → Accepted per this change's premise (proposal.md): project detail is the project's whole priority-ordered plan, not a filtered view of it. Overview still offers full Type filtering for cross-project browsing.

[Two `GoalFilters` boolean props (`showTypeFilter`, `showSort`) with only one caller ever setting them to `false`] → Simpler than the alternative (two separate components, or Project Detail hand-rolling its own Group-only control and duplicating the shared trigger's mobile/`position="popper"` behavior); a future second caller with different needs can still extend the same pattern deliberately.
