## Context

See `proposal.md` for motivation and `specs/overview-project-quicknav/spec.md` for behavior. Confirmed against the code on `feat/global-goal-priority`:

- `GoalsPage` (`/plan/goals`) owns the project-membership filter and passes its loaded projects (`projects`, `projectsLoading`, `projectsFailed`) to `OverviewProjectQuicknav`. The component keeps its "Overview" name and its `overview-quicknav-*` testids after the Goals page rename.
- Desktop (`DesktopQuicknav`): loading skeleton; `null` when the list failed or is empty; otherwise a scrollable `<nav>` of project chips (Default first via `orderDefaultFirst`, archived not in the list) ending in an "All projects" ghost button to `/plan/projects`.
- Mobile (`MobileQuicknav`): reuses `useHomeProjects(3)` (feature-level) with distinct loading, error+retry, empty (teaching card whose action navigates to `/plan/projects`) and list (3 rows plus "+N more") states.
- The Projects dashboard already renders `ManageProjectsSheet` in create mode and saves through `useProjectActions().create`, which toasts and lets the project queries refresh; it also has the `NewProjectFab`.
- Every provisioned account has an undeletable, non-archivable Default project (`default-project` in the API), so "no projects" is now an edge case rather than a normal first-run state. The empty branches are kept for robustness, not as a designed journey.

## Goals / Non-Goals

**Goals:** Reuse the existing create form and mutation from the Goals page without changing browsing context. Keep the creation control available when the quick-nav list itself has no rows or fails.

**Non-Goals:** Do not create a project from text typed into a goal-membership picker (`PLAN-006`), change the Default project's rules, rename the quick-nav component/capability/testids, or add a new API contract.

## Decisions

1. Treat MArkFIA's "All projects" wording as the Goals page's project quick-nav (whose trailing "All projects" link is the visible label), not the Projects dashboard (which already has a New project FAB). Add a distinct Create project action beside that link on desktop and in the mobile widget area. Do not turn "All projects" into a creation action, and do not put a mutating item inside the Goals membership filter `Select`, which only filters. This preserves the filter's semantics and keyboard behavior.
2. Keep the create-sheet open state in `GoalsPage`, pass an `onCreateProject` callback into `OverviewProjectQuicknav`, and render the feature-owned `ManageProjectsSheet` with `project` undefined. Use the feature's `useProjectActions` public API; a page must not import another page or duplicate project validation. A successful mutation already refreshes project queries, updating both the desktop list and the mobile widget. The current filter value and route are untouched, and no project is selected or made "current" by creation.
3. Render one shared Create project control (`data-testid="overview-quicknav-create-project"`, labeled with the existing `goals.project.newProject` copy) from `OverviewProjectQuicknav` itself, outside the per-state branches, so the failed or empty desktop state renders a row containing only that control instead of `null`, and mobile shows it under the loading, error, empty and list states. Retain each branch's existing skeleton, retry, empty teaching and project cards.
4. Desktop and mobile share the same sheet and mutation, but differ in the location of the control: at the end of the chip row (after "All projects") on desktop; on its own line under the widget card on mobile, at touch-target size.
5. **Decided (confirmed by the user):** on mobile, the empty teaching card keeps its explanatory copy but hides its own "go to Projects" navigate action whenever the shared Create project control is shown, so the state offers a single action. The home widget itself is unchanged: the card takes an option (for example `hideAction`) that only the quick-nav passes.
6. Tour: `goals-page.tutorial.tsx` has no quick-nav step today. Add one `createProject` step (target `overview-quicknav-create-project`, placed before the status filter, copy under `tour.overview.steps.createProject.*` — the namespace the page tour actually uses) that applies at both breakpoints because the control has one testid; Joyride skips it if the control is not mounted. Do not create a separate tour for an existing page.

## Risks / Trade-offs

- [The report might have meant another "All projects" control] → Verify the affordance on the reported viewport during manual review; this proposal deliberately covers the Goals page project area where that label is visible.
- [The Goals page uses two different project-list subscriptions by breakpoint] → Test successful creation and query failure on each breakpoint rather than assuming one invalidation path proves both.
- [The create sheet could reset the filter or navigate] → Keep the state local to `GoalsPage` and assert route/filter stability after save and failure.
- [The main spec's "No projects yet" and "Loading and failure states" say the desktop row renders nothing] → modified in this change's delta so the requirements and the new control agree.
