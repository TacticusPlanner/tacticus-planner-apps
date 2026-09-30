## Why

The Goals page's top area shows "project" twice with two different meanings — a
row of chips that _navigate away_ to `/plan/projects/{id}`, and an "All projects"
select in the control row below that _filters in place_ — and the project detail
route those chips lead to is the Goals page rebuilt in a different frame: the same
`GoalsList`, the same status filter, the same global-order drag, minus the Type
filter, plus a header card. That duplication costs ~930 lines, three spec files
that already disagree with each other (bulk pause/resume is both required and
forbidden), and a user model where "look at one project" means leaving the page
that has all the controls.

## What Changes

- **BREAKING**: remove the project detail route. `/plan/projects/{id}` is no
  longer served (no redirect — greenfield). The already-"temporary" legacy
  `/goals/*` redirect mapping is deleted with it rather than re-pointed.
- The Goals page's project filter becomes URL state (`?project={id}`) and is
  presented as a single row of project scope chips above the control row —
  "All goals" first, then the Default project, then the other non-archived
  projects, each with its goal count. This one row replaces both today's
  quick-nav chip row and the "All projects" select. Same presentation on
  desktop and mobile (a horizontally scrolling row; mobile no longer reuses the
  home page's project card widget here).
- "New project" leaves the Goals page; the Projects tab's existing New project
  action is the one creation entry point.
- The Projects page row's existing `…` menu gains the project-specific actions
  the detail header used to hold: **Create goal** (preselecting that project) and
  **Manage goals** (the bulk membership sheet), ahead of Edit and
  Archive/Restore. Activating a project row opens that project on Goals
  (`/plan/goals?project={id}`); the home page's Your Projects cards do the same.
- **Pause all / Resume all is dropped** entirely (it was forbidden by
  `project-management` and required by `goal-status-actions`; the user chose to
  remove it). The client hook and its API call are deleted.
- The detail header's metrics line (units, "N of M goals", reached/blocked/done
  by), the "Farming guidance — Preview" line, the project switcher, and the
  detail-only "Group by type on first visit" persistence are removed, not
  relocated. Project-level completion outlook remains on Insights and the
  Projects row.
- Goals' priority-order explanation collapses from a full-width paragraph to an
  info affordance beside the controls; when a project scope is selected it also
  explains the account-wide position gaps (1, 3, 5) the detail route used to
  explain.
- Goals' contextual Create goal action and the global entry points (sidebar,
  bottom nav, Ctrl/Cmd+G) preselect the scoped project while
  `/plan/goals?project={id}` is open, replacing the detail-route prefill.
- An empty scoped list (the project has no goals) says so and points at Manage
  goals on the Projects page and Create goal, instead of the generic
  "no goals match" copy.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `project-management`: the detail route and every requirement that only
  existed for it are removed; project-specific actions move into the Projects
  row's overflow menu; a project row opens the scoped Goals page; bulk
  pause/resume is removed on every surface.
- `goals-navigation`: the project filter becomes URL-backed scope chips in their
  own row above the control row; the control row loses the membership select;
  scope switching preserves status/type/group; scoped Goals adjusts the Create
  goal prefill, the order explanation, and the empty state; the compact order
  explanation.
- `overview-project-quicknav`: retired — every requirement is removed (the chip
  row is now the filter defined in `goals-navigation`). Delete the spec
  directory at archive.
- `home-projects-widget`: a card navigates to `/plan/goals?project={id}`.
- `plan-completion-outlook`: the projected completion date's surfaces are the
  Insights summary and the Projects row only.
- `goal-list-layout`: the four requirements that name "a project detail route"
  as a second rendering context now name the Goals page with or without a
  project scope; no layout behavior changes.
- `goal-creation-entry-points`: the project-scoped launch contexts become the
  Projects row menu, the Manage goals sheet, and Goals while scoped to a
  project; the detail-route-specific requirement is removed.
- `goal-status-actions`: "Bulk pause and resume for a project" is removed.
- `app-navigation`: the legacy `/goals/*` redirect requirement is removed.

## Impact

- **Deleted**: `apps/web/src/fsd/pages/goals/ui/projects/project-detail-page.tsx`,
  `project-detail-header.tsx`, `project-detail-goals.tsx`,
  `project-detail-page.tutorial.tsx` and their tests;
  `pages/goals/model/projects/use-project-goal-reorder.ts`;
  `features/project-management`'s `setGoalsStatus` action and its API client
  call; `pages/goals/ui/goals-board/goals-project-filter.tsx`; the mobile
  home-widget branch of `overview-project-quicknav.tsx`;
  `app/legacy-goals-path.ts` (+ test), the `LegacyGoalsRedirect` route in
  `app/routes.tsx`, and its call in `app/resolve-next-path.ts`.
- **Rewritten**: `overview-project-quicknav.tsx` → the scope chip row;
  `goals-page.tsx` (URL scope, control row, order hint, empty state, prefill);
  `pages/goals/route.tsx` (detail path removed);
  `features/project-management/ui/project-row.tsx` (menu items) and
  `pages/goals/ui/projects/projects-list-page.tsx` (hosts the Manage goals
  sheet, navigates to scoped Goals); `pages/home/ui/projects/projects-widget.tsx`
  (navigation target); `app/layout/app-shell.tsx` (Create goal prefill reads the
  query param); `app/layout/nav-items.ts` (`isLandingPage` on Projects is no
  longer needed).
- **i18n**: remove detail-only keys under `goals.project.*`
  (`projectSwitcherLabel`, `statusFilterFieldLabel`, `groupByFieldLabel`,
  `backToProjects`, `notFoundTitle/Description`, `pauseAllGoals`,
  `resumeAllGoals`, `unitGoalSummaryOfAccount`, `projectGuidance*`, the
  quicknav keys) and `tour.projectDetail.*`; add chip-row, order-hint, and
  scoped-empty-state copy and tour steps in en/de/es/fr.
- **Tutorials**: delete the project detail tour; update the Goals tour (chip
  row step) and the Projects tour (menu step).
- **In-flight changes touching the same code/specs**:
  `add-goals-overview-density-option` (0/14 tasks) modifies the same
  `goals-navigation` control-row requirements — whichever archives second
  rebases its delta on the other's text; `goals-edit-dialog` (22/25) edits row
  actions in `goals-board`, not the top area.
- No backend/API changes beyond the client no longer calling
  `POST me/projects/{projectId}/goals/status`; no companion
  `tacticus-planner-api` change.
