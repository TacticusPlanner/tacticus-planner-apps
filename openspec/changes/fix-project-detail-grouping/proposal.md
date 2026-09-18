# Make grouping work on project detail

## Why

A closed-beta tester reported that the Group By Type control has no effect on a
project's detail route (`GP-32`, P1). Verified in source: `project-detail-page.tsx`
holds `group` state and passes it to the shared `GoalFilters` control, but nothing
ever reads it — every row goes into one flat `GoalsList`. The control is inert.

The same gap leaves an existing requirement unimplemented. `project-management`
already requires project detail to group goals by unit, with each unit appearing
once; that has never been built either. So the route currently satisfies neither
the grouping requirement it has nor the grouping control it renders.

## What Changes

- Project detail applies its Group selection, grouping rows by unit or by goal
  type and rendering a labeled block per group — the presentation Overview already
  produces and this route does not.
- **Project detail's Group defaults to goal type** rather than to "none". Opening a
  project shows its goals organised by what kind of work they are.
- The Group control keeps all three options here (none, unit, type), so a flat list
  and the unit view both remain one selection away.
- Grouping applies to whichever rows the status filter is showing, including
  Archived, and never changes stored unit priority.
- When grouped by unit, Sort orders the unit blocks while the goals inside each
  block keep their dependency-first order, so a prerequisite is never rendered
  below the goal that depends on it.
- The Group selection persists when switching projects through the detail route's
  project switcher, as status, Type and Sort already do; goal type is the value on
  first opening the route.

**BREAKING (spec-level, no data or API impact):** project detail no longer groups
by unit unconditionally. Unit grouping becomes one selectable dimension rather than
the route's mandated presentation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-management`: replaces "Project goals are grouped by unit" — which
  mandated unit blocks as the route's presentation — with requirements that
  grouping follows the user's selected dimension and defaults to goal type, that
  Sort orders unit blocks rather than their contents, that historical goals stay
  outside the in-flight ordering, and that the browsing controls persist across
  project switches. Unit grouping remains available and still shows one block per
  unit when selected. Two further requirements — "Projects has a list route and a
  single-project detail route" and "The detail route's current-project row matches
  the list route's row" — describe the detail route's content as "unit-grouped" and
  are modified to say "grouped", so the capability does not keep mandating unit
  grouping from three other places.

## Impact

- **Frontend only.** No API change, no data migration, no contract change. The
  data this needs (`entityType`, `entityId`, `goalType` per row) is already on
  every row the route renders.
- Affected code: `pages/goals/ui/projects/project-detail-page.tsx` (apply the
  grouping and change the initial `group` state), and its tests. The grouping
  logic itself already exists in `pages/goals/ui/goals-board/goals-page.tsx`;
  whether it is extracted for reuse or mirrored is a design decision, not a scope
  change.
- i18n: no new keys for the grouped view itself — the headings reuse the existing
  goal-type labels (`goals.create.goalTypes.*`) and the unit names Overview's
  grouped view already resolves. Tour copy is the exception: any
  `tour.projectDetail.steps.*` wording that assumes a flat list changes, and those
  keys are translated in `de`, `es`, and `fr` as part of this change.
- Consequence recorded deliberately: the route's unit-centric model — unit
  ordering, Reprioritize Units, and `project-management`'s "Users prioritize units
  rather than goals" — is no longer visible on arrival, because units are spread
  across type blocks. Reprioritize Units remains the surface for seeing and
  changing unit order.
- Out of scope: Cluster 9's `GP-19`/`GP-20` (grouped views on Overview) build on
  the same control and should reuse whatever shared grouping this change settles
  on rather than adding a third implementation.
