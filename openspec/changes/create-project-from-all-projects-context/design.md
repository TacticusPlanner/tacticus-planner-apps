## Context

See `proposal.md` for motivation and `specs/overview-project-quicknav/spec.md` for behavior. `GoalsPage` owns the Overview membership filter and passes its loaded projects to `OverviewProjectQuicknav`; mobile quick-nav uses `useHomeProjects` independently. The Projects dashboard already renders `ManageProjectsSheet` in create mode and saves through `useProjectActions`. The desktop quick-nav is currently absent for an empty or failed project list, while mobile renders a separate widget state.

## Goals / Non-Goals

**Goals:** Reuse the existing create form and mutation from Overview without changing browsing context. Keep the creation control available when the quick-nav list itself has no rows or fails.

**Non-Goals:** Do not create a project from text typed into a goal-membership picker (`PLAN-006`), change default/Current plan selection rules, or add a new API contract.

## Decisions

1. Treat MArkFIA's “All projects” wording as the Goals Overview project area, not the Projects dashboard (which already has a New project FAB). Add a distinct Create project action beside the desktop All projects quick-nav destination and in the mobile widget area. Do not turn “All projects” into a creation action, and do not put a mutating item inside the Overview membership `Select` used only for filtering. This preserves the filter's semantics and keyboard behavior.
2. Keep the create-sheet open state in `GoalsPage`, pass an `onCreateProject` callback into `OverviewProjectQuicknav`, and render the existing feature-owned `ManageProjectsSheet` with `project` undefined. Use the feature's `useProjectActions` public API; a page must not import another page or duplicate project validation. A successful mutation already invalidates project queries, allowing both the desktop list and mobile widget to refresh. Keep the current filter value, Current plan, and route untouched.
3. Render the creation control outside the list-only loading/empty/error branches, so a failed project query does not hide it. Retain the existing branch-specific skeleton, retry, empty teaching, and project cards. On desktop, the chip row can still be absent with no projects while the adjacent creation control remains. On mobile, retain the home-widget-derived list/copy and add the action at the Overview wrapper, not inside `ProjectsWidget`, so other pages are unchanged.
4. Desktop and mobile share the same sheet and mutation, but differ in the location and accessible target of the entry point. Update the co-located Goals Overview tour with breakpoint-appropriate selectors/copy if the current quick-nav step cannot target the new control at both widths. Do not create a separate tour for an existing page.

## Risks / Trade-offs

- [The report might have meant another “All projects” control] → Verify the affordance on the reported viewport during manual review; this proposal deliberately covers the Goals Overview project area where that label is already visible.
- [Overview uses two different project-list subscriptions by breakpoint] → Test successful creation and query failure on each breakpoint rather than assuming one invalidation path proves both.
- [The create sheet could reset the filter or navigate] → Keep the state local to `GoalsPage` and assert route/filter/Current plan stability after save and failure.
