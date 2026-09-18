# Remove-from-project safety and project assembly

## Why

Closed-beta testers hit a destructive-UX hole in Projects: the only destructive
action offered on a goal inside a project is account-wide delete (`GOAL-01`, P0).
"Remove from this project" exists solely as a small `X` on a chip buried in the
goal's edit form, so a user who wants a goal out of one project reaches for
Delete and loses the goal everywhere. The same buried control is why assembling a
project is slow (`GP-29`) and why membership is hard to see while building one
(`GP-30`), and why membership cannot be used to sift the goal list (`GP-31`).

The API already supports everything needed here — `PUT /me/projects/{id}/goals`
replaces a project's whole membership in one call and is unused by the client —
so this is a frontend-only correction of where membership controls live.

## What Changes

- Project detail offers **Remove from this project** as a peer action to Delete in
  each goal's row menu, so the non-destructive intent has a control of its own.
- Removing a goal's last remaining membership **moves it to the Default project**
  instead of being refused. The API invariant "every goal belongs to at least one
  project" is unchanged and still enforced server-side; the client submits the
  Default project rather than an empty list, so the refusal is never reached.
  - Exception: when the goal's only membership _is_ the Default project, removal
    has no destination and remains unavailable with an inline explanation.
  - The destination slot can already be occupied (project-scoped in-flight
    goal-type uniqueness), so removal pre-flights the Default project for a
    conflicting Active/Paused goal on the same unit and goal type, and explains
    the conflict instead of surfacing a raw 409.
- The Delete confirmation states that deletion is account-wide and names the
  project-scoped alternative, so the two actions are not confusable.
- Project detail gains an **Add goals to this project** assembly surface: search
  the profile's goals, see at a glance which are already members, toggle several,
  and save once through the existing bulk membership endpoint.
- The Goals Overview gains **project membership as a filter dimension**, so a user
  can narrow the list to one project's goals without leaving Overview. The filter
  offers an explicit unfiltered option and is the initial state; there is no "no
  project" bucket, because every goal always belongs to at least one project.
- Unit-name resolution is **promoted to a shared slice** so the assembly surface can
  use it. It exists today only inside a page (`use-goal-catalog`) and, duplicated,
  inside another feature (`use-entity-display-name`); a feature may import neither.
  Both existing copies are refactored onto the shared resolver with their behavior
  unchanged.
- Copy for both actions names the destination project by its live name — the
  Default project is renameable.

Not in scope, and deliberately unchanged: the at-least-one-project invariant
itself, per-goal pause/resume as the activation mechanism, Current plan
semantics, and unit priority ordering.

## Capabilities

### New Capabilities

None. This change corrects and extends behavior already owned by existing
capabilities.

### Modified Capabilities

- `goal-project-membership`: "Every goal retains at least one project membership"
  changes outcome — a last-membership removal relocates the goal to the Default
  project rather than being blocked, except when Default is itself the source.
  Adds requirements for removing membership from the project context, for
  pre-flighting the destination project's goal-type slot, for distinguishing
  project removal from account-wide deletion, and for membership as a filter
  dimension on Overview.
- `project-management`: the detail route gains a bulk "Add goals to this project"
  assembly surface showing current membership, and a per-goal "Remove from this
  project" action in the goal row menu distinct from Delete.
- `goals-navigation`: Overview's desktop single-row and mobile compressed filter
  requirements enumerate the controls in that row; a project-membership filter
  joins that enumeration on both layouts.

## Impact

- **Frontend only. No companion `tacticus-planner-api` change.** Every endpoint
  this needs already exists and is already tested server-side:
  `PUT /me/goals/{goalId}/projects`, `PUT /me/projects/{projectId}/goals`,
  `GET /me/projects/{projectId}/goals`.
- Affected code: `pages/goals/ui/projects/project-detail-page.tsx`,
  `pages/goals/ui/goals-board/goal-row-actions.tsx`,
  `pages/goals/ui/goals-board/goals-list.tsx` (both `GoalRowActions` call sites
  need project scope threaded through),
  `pages/goals/ui/goals-board/delete-goal-dialog.tsx`,
  `pages/goals/ui/projects/goal-projects-field.tsx` (last-chip removal changes
  from refusal to relocation), `pages/goals/model/shared/types.ts`
  (`goalRowFromProjectMember` must carry memberships),
  `pages/goals/model/projects/use-project-goal-conflicts.ts` (reused for both
  the destination pre-flight and the assembly pre-flight),
  `pages/goals/ui/goals-board/goals-page.tsx` (filter, and memberships on
  archived rows), `features/project-management` (the assembly sheet), and the
  `entities/project` public API (`updateProjectGoals`, currently exported but
  never called from production code).
- Beyond this change's own surface, the shared-resolver promotion edits
  `pages/goals/model/shared/use-goal-catalog.ts` and
  `features/v1-import/model/use-entity-display-name.ts` (plus its consumer's
  import). `rewrite-v1-goal-import` also touches `features/v1-import`, but its
  tasks are complete and its gates pass, so the two can land in either order.
- i18n: new keys in `common.json` for the removal action, its destination and
  last-membership explanations, the destination-conflict message, the reworded
  delete confirmation, the assembly surface, and the Overview project filter —
  translated in `de`, `es`, `fr` as part of this change.
- Coordination: Cluster 8's `GP-08` ("Add goal to this project" from the creation
  entry point) is the creation-side twin of this change's assembly surface. It is
  not in this change's scope, but whichever lands second should reuse this
  surface rather than build a second path into project membership.
- Out of scope but adjacent, filed separately: `GP-32` (Group control inert on
  project detail), `GP-33` (section tab does not re-navigate from a detail
  route), `GP-27`/`GP-28`/`GP-25` (what a project _is_), `GP-36` (multiple
  concurrently active projects, blocked on `GP-11`).
