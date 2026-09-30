## Context

See proposal.md — Why. Relevant current state (all under `apps/web/src/fsd`):

- `pages/goals/ui/goals-board/goals-page.tsx` owns the Goals page: local
  `projectFilter` state fed to `ProjectFilterSelect` (`goals-project-filter.tsx`),
  `OverviewProjectQuicknav` above the control row (desktop chip row that
  navigates; mobile reuses `useHomeProjects`/`ProjectSummaryRow` as a card
  widget), a full-width `goals.order.listNote` paragraph, and a
  `goals-page-filtered-empty` fallback. Group is persisted under
  `goals.overview.group`.
- `pages/goals/ui/projects/project-detail-page.tsx` + `project-detail-header.tsx`
  - `project-detail-goals.tsx` render the same `GoalsList` with the same
    `useGoalsOverviewMetrics`/`usePlanInsights`/`useGoalAttainment` pipeline,
    plus header metrics, a switcher, `AddGoalsToProjectSheet`, a pause/resume-all
    menu, a farming-guidance line, and a separate `goals.projectDetail.group`
    persistence key with a "type" default and a "unit"→"type" clamp.
- `features/project-management/ui/project-row.tsx` already renders the Projects
  page row with a `…` `DropdownMenu` holding Edit and Archive/Restore.
  `AddGoalsToProjectSheet` and `useProjectActions` (including `setGoalsStatus`)
  are exported from that feature.
- Five navigations target `/plan/projects/:id`: desktop + mobile quick-nav,
  `projects-list-page.tsx` rows, `pages/home/ui/projects/projects-widget.tsx`,
  the detail switcher. `app/layout/app-shell.tsx` matches that path to prefill
  Create Goal for global entry points; `app/legacy-goals-path.ts` (used by
  `routes.tsx`'s `LegacyGoalsRedirect` and `resolve-next-path.ts`) maps
  `/goals/projects/{id}` to it; `app/layout/nav-items.ts` flags Projects as
  `isLandingPage` only because a route nests under it. Unknown paths already
  hit `NotFoundRedirect` (`path: "*"`).
- Reordering under a filter already writes the global order correctly
  (`useGoalsPageReorder` + `global-goal-priority` filtered-list scenarios), so a
  scoped Goals page needs no reorder changes.
- `useIsMobile()` (768px) is the shared platform switch;
  `pages/goals/ui/shared/info-hint.tsx` is an existing click/focus-triggered
  info affordance.

## Goals / Non-Goals

**Goals:**

- One project concept on the Goals page: a URL-backed scope, rendered once as a
  chip row.
- Delete the detail route and everything that existed only for it.
- Keep every project-specific action reachable from the Projects page row menu.
- No change to estimates, ordering, or the goal row itself.

**Non-Goals:**

- Redesigning the Projects page cards or their summary metrics (Default-only
  richer metrics stay as they are).
- Any change to the Insights page.
- Redirects of any kind for removed URLs (greenfield; user decision).
- The density toggle (`add-goals-overview-density-option`) — see D10.

## Decisions

### D1. Scope lives in `?project=` via `useSearchParams`, replace semantics

A small hook `useGoalsProjectScope(projects)` in
`pages/goals/model/projects/` reads `project` from `useSearchParams`, validates
it against the loaded non-archived project list, and exposes
`{ projectId, setProjectId }`. `setProjectId` calls `setSearchParams(…, {
replace: true })`. Validation outcomes:

| projects query state                  | param             | result                |
| ------------------------------------- | ----------------- | --------------------- |
| success, id is a non-archived project | kept              | scoped                |
| success, id unknown or archived       | dropped (replace) | all goals             |
| loading or error                      | kept              | all goals until known |

Alternatives: keep local state (loses deep links — rejected by the user); a path
segment `/plan/goals/:projectId` (would nest a route under Goals and reintroduce
the landing-page special-casing in `section-tabs.tsx`); push semantics (would
make Back step through filter changes, which no other filter on the page does).

### D2. The chip row is the filter; one component for both breakpoints

`overview-project-quicknav.tsx` is rewritten as `goals-project-scope.tsx`: an
"All goals" chip plus `orderDefaultFirst(projects)` chips, `aria-pressed` on the
selected one, counts from the page's already-computed `nonArchivedRows` ×
`projectsByGoalId` (no new query). Horizontal overflow scrolls
(`overflow-x-auto overflow-y-hidden`, as today's desktop row does). The mobile
`useHomeProjects`/`ProjectSummaryRow` branch is deleted — a navigation widget
made sense when chips navigated; a filter should look like a filter on both
forms. `ProjectFilterSelect` (`goals-project-filter.tsx`) and `ALL_PROJECTS` are
deleted; `GoalsCreateProjectSheet` and its `createProjectOpen` state go with
them (project creation is Projects-page-only).

Loading: skeleton chips (reuse today's desktop skeleton). Failure: "All goals"
only, no message. Empty: "All goals" only.

Desktop/mobile: identical markup; on mobile the row is the first of three
stacked rows (chips, status, icon controls) and the existing `isMobile` branch in
`goals-page.tsx` just renders it first.

### D3. Order explanation becomes an `InfoHint` in the control row

The `goals-order-note` paragraph is replaced by the existing `InfoHint`
component placed after the Group filter. Content = `goals.order.listNote` (kept)
plus, when scoped, the account-wide-number sentence currently in
`goals.order.projectNote` (reworded to drop "here" / the link). Rendered under
the same condition as the paragraph today (`reorderAvailable && rows.length >
0`). Same component at both breakpoints — InfoHint already handles tap.

Alternative: keep the paragraph — rejected as the single most space-hungry line
in the top area while carrying static text.

### D4. Create goal prefill reads the scope

- Goals' contextual button: `launchCreateGoal(projectId ? { projectIds:
[projectId] } : undefined)`.
- `app-shell.tsx`'s `onCreateGoal`: replace `matchPath("/plan/projects/:projectId")`
  with "pathname is `/plan/goals` and `new URLSearchParams(search).get("project")`".
  The shell does not validate the id (the Goals page already dropped an invalid
  one from the URL, per D1).

### D5. Projects page hosts the project-specific actions

- `ProjectRow` (feature) gains two menu items for non-archived rows, via two new
  optional callbacks `onCreateGoal(project)` and `onManageGoals(project)`; the
  row stays presentational.
- `ProjectsListPage` owns `manageGoalsProject: ProjectSummary | undefined` and
  renders one `AddGoalsToProjectSheet` (`open={!!manageGoalsProject}`,
  `onCreateGoal={() => launchCreateGoal({ projectIds: [id] })}`), and passes
  `launchCreateGoal` for the Create goal item. `openProjectDetail` becomes
  `navigate(`/plan/goals?project=${id}`)`.
- `NewProjectFab` unchanged.
- Pause all / Resume all: `setGoalsStatus` removed from `useProjectActions`; the
  corresponding API client method in `entities/project` (and its test) is deleted
  if nothing else calls it. The server endpoint is left alone (no API change).

Alternative considered and rejected by the user: keeping bulk pause/resume in
the row menu.

### D6. Routes: remove, don't redirect

- `pages/goals/route.tsx`: drop the `projects/:projectId` entry and the
  `ProjectDetailPage` lazy import. `/plan/projects/{id}` falls through to the
  existing `NotFoundRedirect`.
- Delete the legacy `/goals/*` mapping in full: `legacy-goals-path.ts` (+ test),
  the `LegacyGoalsRedirect` component and its route in `routes.tsx`, and the
  call in `resolve-next-path.ts` (+ its test cases). It was marked temporary at
  creation and would otherwise point at a removed route.
- `nav-items.ts`: drop `isLandingPage` on Projects and the comment that
  justified it; `section-tabs.test.tsx` adjusted. (The generic landing-page
  mechanism stays for Library raid bosses.)
- `home/ui/projects/projects-widget.tsx`: navigation target only.

### D7. Group persistence collapses to one key

`goals.projectDetail.group` (and its "unit"→"type" read-site clamp) disappears
with the detail page. Goals keeps `goals.overview.group` with default `none` and
options none/type/unit. No migration of the old key — it is simply no longer
read.

### D8. Empty scoped state

`showPristineEmptyState` stays as is (no goals at all). A new branch: scope
selected, `nonArchivedRows.filter(inScope).length === 0`, not loading, no error
→ `goals-page-empty-project` card using `goals.project.emptyProjectTitle` and a
reworded `emptyProjectDescription` ("Use Manage goals on the Projects page… or
Create goal…"). Filter-caused emptiness keeps `goals-page-filtered-empty`.

### D9. Tutorials and copy

- Delete `project-detail-page.tutorial.tsx` and `tour.projectDetail.*`.
- `goals-page.tutorial.tsx`: the quick-nav step becomes a "project scope" step
  targeting the chip row (`data-testid="goals-project-scope"`); desktop and
  mobile steps share the target because the markup is shared.
- `projects-list-page.tutorial.tsx`: the row-actions step copy names Create
  goal and Manage goals.
- Copy removed/added per proposal Impact; all four locales in the same task.

### D10. Sequencing against in-flight changes

`add-goals-overview-density-option` (untouched, 0/14) modifies the same
`goals-navigation` requirements ("Goals controls share one row on desktop",
"Goals controls compress on mobile"). This change's deltas are written against
main. Whichever change archives second must re-copy the other's landed
requirement text into its MODIFIED block before `openspec sync`; the semantic
merge is trivial (density toggle is one more control in the same row).
`goals-edit-dialog` touches row actions, not the top area; no overlap expected.

## Risks / Trade-offs

- [A project's header metrics disappear] → Accepted by the user; the Projects
  row keeps units/goals (and the Default project's richer metrics), Insights
  keeps the per-project outlook.
- [Chip row width with many projects] → Horizontal scroll, identical to the
  current desktop row; counts are short. No cap on purpose (a hidden project is
  worse than a scroll).
- [`?project=` collides with a future param name] → It is the only param on the
  page today; documented in D1.
- [Existing links to `/plan/projects/{id}` or `/goals/*` break] → Accepted:
  greenfield, pre-production; they land on the not-found handling.
- [FSD boundary] → `ProjectRow` stays presentational in `features/project-management`;
  the page wires the sheet and the goal launcher. No new cross-slice imports.
- [Density change conflict] → D10.

## Migration Plan

Frontend-only, one PR, no data or URL migration. Rollback = revert.
