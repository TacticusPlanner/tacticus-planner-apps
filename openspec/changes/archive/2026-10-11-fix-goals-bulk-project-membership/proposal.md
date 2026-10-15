## Why

Two UserJot reports about project membership on the Goals page:

- **Bulk updates are slow** ([Bulk Goal Updates Are Too Slow](https://tacticusplanner.userjot.com/board/p/bulk-goal-updates-are-too-slow)).
  Add to project sends one `PUT me/goals/{id}/projects` per selected goal, one
  after another, and each success refetches every goal and project query. With
  a few dozen goals selected, it takes several seconds and the list flickers
  while it runs.
- **Goals can't be removed from a project** ([Cannot Remove Goals from a Project](https://tacticusplanner.userjot.com/board/p/cannot-remove-goals-from-a-project)).
  `consolidate-project-views-into-goals` (2026-09-30) folded project detail
  into the Goals page scoped by `?project=`, but it never passed the scoped
  project to the row actions. That made the "Remove from this project" / "Move
  to project" branch unreachable, and `add-goals-bulk-actions` (2026-10-01)
  then deleted it. Since then the only way to remove a goal is to untick it in
  the project's Add goals sheet on the Projects page. `goal-project-membership`
  still requires the action ("Membership is removable from the project
  context", "Project goal rows offer removal alongside deletion"), so the app
  currently violates its own spec.

## What Changes

- **Add to project uses one request.** The selection is added with a single
  `PUT me/projects/{id}/goals`: the destination's current membership plus the
  selected goals, with the membership just read sent as `expectedGoalIds`. If
  the membership changed in between (a `projectMembershipStale` 409), the
  change is applied once more to the membership the 409 reports. The request
  is atomic, so a rejection (for example an occupied goal slot) adds none of
  the goals and is reported once. Previously each goal succeeded or failed on
  its own. Goals already in the project are left as they are, as before.
- **The row menu offers removal while the page is scoped.** On the Goals page
  scoped to a project, each row's "⋯" menu has a "Remove from this project"
  item between Pause/Resume and Delete. When the scoped project is the goal's
  only project, the item reads "Move to project" and opens a destination
  picker (other non-archived projects plus "Create new project"), or goes
  straight to project creation when there is no other project. The item is
  disabled while the projects or the goal's memberships are loading. The
  delete confirmation names removal from the scoped project as the
  alternative.
- **Bulk Remove from project (new).** While the page is scoped, the bulk
  actions gain "Remove from project (N)" between Add to project and Delete.
  Selected goals that belong to another project are just removed. If any
  selected goal has the scoped project as its only project, one picker asks
  where to move those goals. The move adds them to the destination first and
  then removes the whole selection from the scoped project, in one request per
  project, so an occupied destination slot stops the move before anything is
  removed. One toast reports the outcome.
- All removal paths, single and bulk, share one page-level flow and the same
  membership helper (`changeProjectMembership`), so the row menu and the bulk
  bar cannot drift.

No API change: `PUT me/projects/{id}/goals` already exists and is atomic.

## Capabilities

### Modified Capabilities

- `goal-bulk-actions`: Add to project issues one atomic membership request;
  a fifth bulk action, Remove from project, appears while the page is scoped.
- `goal-project-membership`: the Goals page's scoped row menu is where the
  project-removal action lives.

## Impact

- `apps/web/src/fsd/entities/project/model/change-project-membership.ts`
  (new) and its export.
- `apps/web/src/fsd/pages/goals/model/goals-data/use-goal-actions.ts`
  (`addToProject` rewritten, `removeFromProject` added).
- `apps/web/src/fsd/pages/goals/ui/goals-board/project-removal-flow.tsx`
  (new), `goal-row-actions.tsx`, `goals-bulk-actions.tsx`,
  `goals-bulk-controls.tsx`, `delete-goal-dialog.tsx`, `goals-page.tsx`, and
  the list/row/card prop threading.
- Locales: en/de/es/fr `goals.bulk.removeFromProject*`,
  `goals.project.removeFromProject|moveToProject*|moveSelectionDescription*`,
  `goals.toasts.goalRemovedFromProject|goalRelocated|goalsRemovedFromProject*|goalsRemovedAndMoved*`,
  and `goals.delete.projectAlternative*`.
