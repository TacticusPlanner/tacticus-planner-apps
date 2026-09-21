## Context

See proposal.md - Why. `GoalFilters` (`entities/goal/ui/goal-filters.tsx`) is a shared component used by both Goals Overview and project detail (`showSort`/`showTypeFilter` already vary per caller). `ProjectDetailPage` persists the Group selection via `usePersistedSelection("goals.projectDetail.group", isGoalGroupValue, "type")` (`apps/web/src/fsd/pages/goals/ui/projects/project-detail-page.tsx`), and the header card is a separate component, `ProjectDetailHeader`.

## Goals / Non-Goals

- Goal: project detail's three browsing controls (Project, Filter, Group By) live together, labeled, inside the header card.
- Goal: "by unit" disappears from project detail's Group control without breaking a browser that has it persisted from before.
- Non-goal: no change to Goals Overview's controls, its Group options, or its own layout (`goals-navigation`'s "Overview's controls share one row on desktop" is untouched).
- Non-goal: no change to what Group actually does (rendering-only clustering, priority order untouched) beyond removing the "unit" option — covered already by the surviving "Group=Unit..." removal in the spec delta.

## Decisions

- **Restrict `GoalFilters`' Group options via a new prop, not a second component.** Add `groupOptions?: GoalGroupValue[]` (default: all three, i.e. today's behavior for Overview) to `GoalFilters`; pass `groupOptions={["none", "type"]}` from `ProjectDetailPage`. Alternative considered: a project-detail-only fork of the Select — rejected, it would duplicate the existing accessible-label/testid wiring for no behavioral gain.
- **Move rendering, not state.** `ProjectDetailPage` keeps owning `tab`/`group` state (via `useState`/`usePersistedSelection`) and passes both value+setter down; `ProjectDetailHeader` just renders `StatusFilterSelect` and `GoalFilters` where the project switcher used to sit alone. No state moves into the header component.
- **Persisted "unit" fallback lives where the value is read, not written.** `usePersistedSelection`'s stored value is shared storage keyed `goals.projectDetail.group` — do not migrate or rewrite it (Overview code elsewhere does not touch this key, and a future revert should still see the raw stored value). Instead, `ProjectDetailPage` clamps `group === "unit" ? "type" : group` for the value it actually renders with, exactly once, immediately after reading it.
- **Labels are plain text, not `FormLabel`/ARIA-only.** "Project" / "Filter" / "Group By" render as small visible text above each control (mirrors how other labeled controls in this app are done - see `shadcn` skill), not just an `aria-label` — the whole point of this change is a returning user recognizing the controls without reading their current value.

## Risks / Trade-offs

- [Removing "by unit" is a real feature removal, not just a relayout] → Called out explicitly in the proposal's Capabilities section and the spec's `REMOVED Requirements` block so this doesn't slip through as "just UI".
- [A user mid-session with "unit" already selected in the `GoalFilters` control (not just persisted) could see the value silently change under them if they had it open across this deploy] → Not a real scenario: the option list itself is what's changing in this deploy; there's no live client to observe the transition.
