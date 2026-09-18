## Context

See `proposal.md` — Why. The constraints that shape the approach, all verified
against current source:

- **A goal must belong to at least one project.** Enforced on both membership
  endpoints: `UpdateGoalProjectsEndpoint` rejects an empty `ProjectIds` list at
  the validator, and `UpdateProjectGoalsEndpoint` rejects a whole bulk call whose
  removals would orphan any goal (400, "Cannot remove a goal from its only
  remaining project"). `goal-project-membership` states the same rule.
- **The Default project is a guaranteed, permanent destination.** `ProjectType.Default`
  is auto-provisioned per profile, at most one per profile, renameable, and
  `UpdateProjectEndpoint` hard-rejects archiving it (`defaultProjectCannotBeArchived`).
  There is no delete-project endpoint at all — projects are only ever archived.
  So a relocation target always exists and can never disappear.
- **Membership is many-to-many with per-membership priority.** `ProjectGoal` carries
  `ProjectId × GoalId × Priority`, normalized per project by
  `ProjectGoalPlanningService.NormalizeAsync`.
- **In-flight goal-type uniqueness is project-scoped.** A project may hold at most one
  Active/Paused goal per `(entityType, entityId, goalType)`. Violations return 409
  `projectGoalSlotOccupied`.
- **`PUT /me/projects/{id}/goals` replaces a project's entire membership.** Submitting a
  subset silently drops everything omitted — already noted in
  `use-project-actions.ts`. It is exported from `entities/project` and currently
  called by no production code.

## Goals / Non-Goals

**Goals:**

- Give the non-destructive intent ("get this goal out of this project") a control
  of its own, on the surface where the user forms that intent.
- Make a last-membership removal succeed rather than be refused, without weakening
  the server-side invariant.
- Reuse the existing bulk membership endpoint instead of adding an API surface.

**Non-Goals (design-level, beyond the proposal's scope statement):**

- No change to `ProjectGoal.Priority` being per-membership. How priority reconciles
  across projects is `GP-11`, and it blocks `GP-36`, not this change.
- No atomic multi-goal membership transaction. Every operation here is one call
  against one existing endpoint.
- No undo stack. Relocation is reversible by the user through the same controls.

## Decisions

### A project is a filter, not a switch

Confirmed with the product owner. A project organizes goals into a named,
independently-ordered view; **per-goal pause/resume remains the only activation
mechanism**. Membership does not activate or deactivate anything.

_Why this matters to the design:_ it is what makes "remove from project" a safe,
non-destructive, low-ceremony action — it changes which view a goal appears in,
nothing else. Under switch semantics the same action would silently drop the goal
out of daily planning and would need a much heavier confirmation.

_Alternative considered:_ project-as-switch (making a project current activates its
goals as a set). Rejected — `GP-25` reports directly that a tester's working set
changes too fluidly for project switching to replace pause/unpause.

_Known contradiction, deliberately left alone:_ `CreateGoalEndpoint`,
`CreateCombinedGoalsEndpoint`, and `V1GoalImportService` all set
`goal.Status = targetProjects.Any(p => p.Id == profile.ActiveProjectId) ? Active : Paused`
— membership deciding activation, which is switch behavior. It is the largest
generator of `GP-27`/`GP-28` confusion and should be reconciled, but not here:
`V1GoalImportService.cs:352` depends on that exact rule and is being rewritten now
by the in-flight `rewrite-v1-goal-import` change. Reconciling birth status belongs
to the `GP-27`/`GP-28` follow-up, after that import rewrite lands.

### Last-membership removal relocates to Default, implemented client-side

The client submits `PUT /me/goals/{goalId}/projects` with `[defaultProjectId]`
instead of `[]`. The server invariant is untouched and still enforced; the client
simply never asks for the state the server refuses.

_Why over the alternatives:_

| Option                                        | Verdict                                                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client substitutes Default (chosen)           | No API change, no migration, no spec relaxation. `goal-project-membership`'s invariant stays literally true.                                        |
| Show the action disabled with an explanation  | Rejected by the product owner — leaves Delete as the user's only exit, which is the reported defect.                                                |
| Relax the invariant, allow project-less goals | Schema, spec, and every membership consumer; an orphaned goal would appear in no project view and no daily plan. Far more than the defect warrants. |

**Edge — Default is the source.** When the goal's only membership is the Default
project, relocation has no destination. The action renders unavailable with the
existing last-membership explanation. The enabled predicate is therefore
"more than one membership **or** this project is not Default", not "more than one
membership".

### Removal pre-flights the destination's goal-type slot

Relocating into Default can collide with project-scoped in-flight uniqueness — if
Default already holds an Active/Paused goal for the same unit and goal type, the
call returns 409. This is a failure mode the action did not previously have, so it
is handled before the mutation rather than surfaced as a raw error.

`findProjectGoalConflicts` in `pages/goals/model/projects/use-project-goal-conflicts.ts`
already performs exactly this check (matching `entityType`/`entityId`/`goalType`
against Active/Paused goals of candidate projects) for the membership field, and
`goals.project.membershipConflict` copy already exists. Both are reused against the
Default project rather than reimplemented. The 409 handler stays as the backstop
for the race between pre-flight and submit.

### Bulk assembly submits current priorities and appends additions

`ProjectGoalEntry.priority` is required on every entry, and
`UpdateProjectGoalsEndpoint` writes `membership.Priority = entry.Priority` for
existing members as well as new ones. Submitting additions at priority 0, or
renumbering the whole list by index, would therefore silently reorder the
project's unit priority — which `project-management` reserves for the dedicated
Reprioritize Units mode and which propagates into Dailies and Insights.

Absolute values do not need to be preserved, because `NormalizeAsync` renumbers
every membership at the end of the same call: it groups in-flight memberships by
unit, orders units by `group.Min(entry => entry.Priority)`, and reassigns
`1..N`. Only the _relative_ order of each unit's minimum priority survives.

So the sheet submits each existing member with the `priority` it already has
(returned by `GET /me/projects/{id}/goals`), and each addition with a distinct
increasing value above the current maximum — the batch form of the
`(max ?? 0) + 1` rule `ProjectsService.GetNextPriorityAsync` already applies on
the goal-side endpoint. Added goals therefore land at the bottom of the
project's unit order, and existing unit order is unchanged.

_Alternative considered:_ letting the user place additions within the order.
Rejected — it duplicates Reprioritize Units, which `project-management` makes the
only surface that sets unit priority.

### Bulk assembly pre-flights the destination slot too

`UpdateProjectGoalsEndpoint` checks project-scoped goal-type uniqueness across
the **entire submitted set**, which necessarily includes every existing member.
Adding one goal whose `(entityType, entityId, goalType)` slot is already held by
an Active/Paused member therefore returns 409 and rejects the whole save —
nothing is added, not just the conflicting goal.

The sheet therefore evaluates the same conflict before submitting, using the same
`findProjectGoalConflicts` helper as the single-goal relocation path, and marks
the offending goal as unselectable with the reason rather than letting one
conflicting selection discard the user's entire batch. The 409 remains handled as
the backstop.

### The assembly surface adds members; it does not remove them

`PUT /me/projects/{id}/goals` replaces a project's whole membership, and rejects
the entire call if any removal would orphan a goal. A sheet that both added and
removed would therefore need to partition unchecked goals, relocate the
last-membership ones through a second endpoint first, then submit the bulk call —
a non-atomic two-phase sequence whose partial failure leaves the user's intent
half-applied.

Neither `GP-29` (efficient assignment from the project context) nor `GP-30`
(membership visible during assembly) asks for bulk removal, and removal now has a
dedicated per-goal action. So the sheet lists every goal with its current
membership state, lets the user check goals to add, and submits
`current membership + additions` in one call. Already-member goals render as
members and are not unchecked from the sheet; the row action is the removal path.

**Stated assumption** — if bulk removal turns out to be wanted, the two-phase
sequence above is the way to add it, and it should be its own change so its
partial-failure behavior gets specified rather than inherited.

**Whole-replacement safety:** the sheet must build its submission from membership
fetched at save time, not from the list it rendered with, or a concurrent change
elsewhere is silently dropped.

### FSD ownership, and promoting unit-name resolution to `shared/`

The assembly sheet lives in `features/project-management` alongside
`ManageProjectsSheet`, exported through that slice's public API — not in
`pages/goals`. `GP-08` (Cluster 8) needs the same surface from the goal-creation
entry point, and a page-owned component could not be reached from there without a
page-to-page import. Pages consuming a feature is the allowed direction.

The sheet has to render and search goals by unit name, and unit-name resolution
currently exists only above or beside it:

- `pages/goals/model/shared/use-goal-catalog.ts` → `getEntityName`
- `features/v1-import/model/use-entity-display-name.ts` → the same lookup,
  already duplicated because "FSD forbids a feature depending on a page"

A feature can import neither a page nor a sibling feature, so the sheet cannot
reach either. **Unit-name resolution is therefore promoted to `shared/unit-name`**
and both existing copies are refactored onto it. `shared/ability-text` is the
precedent: catalog-plus-i18n text resolution already lives in `shared/`, which
every layer may import.

The promoted resolver takes the **superset** of the two existing signatures —
`(entityType: string | null, entityId: string | null) => string`, returning `""`
for a null id as `use-entity-display-name` does — and keeps the namespaced
`characters:<id>` key form with the catalog-record fallback. Behavior for both
existing call sites must be identical after the refactor, which is why their
regression coverage is a task rather than an afterthought.

_Alternatives considered:_ passing `getEntityName` into the sheet as a prop from
the page (cheapest, no moves, and the pattern `import-v1-result.tsx` already uses
— but leaves two copies in place and makes every future consumer thread it);
duplicating the lookup a third time inside `features/project-management`
(self-contained, but a third copy to keep in sync). The promotion was chosen
deliberately over both, accepting that it pulls `pages/goals` and
`features/v1-import` into this change's blast radius.

_Sequencing note:_ `rewrite-v1-goal-import` also touches `features/v1-import`, but
its tasks are complete and its gates pass, and the promotion changes only an
import line in that feature's report component. Land in either order.

The removal action is per-goal-row behavior and stays with the row menu in
`pages/goals/ui/goals-board/goal-row-actions.tsx`, taking the owning project as a
prop. `GoalsList` renders that menu from two call sites and must thread project
scope through to both — the same menu renders on Overview, where no project scope
exists and the action is therefore absent.

### Row membership data

Computing the submitted membership list, detecting a last-membership relocation,
and disabling the Default-only case all need the row's current memberships, which
project-detail rows do not carry: `goalRowFromProjectMember` omits `projects`,
and Overview's archived rows call `goalRowFromSummary(goal)` with no memberships
argument while its non-archived rows get them from `useGoalProjects`. Both paths
must supply memberships — otherwise the removal action has no input, and the
Overview project filter silently matches nothing on the Archived tab.

Membership is read at submit time rather than trusted from the rendered row:
`PUT /me/goals/{goalId}/projects` is a whole-list replacement exactly like the
project-side endpoint, so a membership added elsewhere after the page loaded would
be dropped by a list derived from stale cache. The refetch-before-submit rule
applies to both endpoints, not just the assembly sheet.

### Desktop and mobile

The assembly surface uses `Sheet`, matching `ManageProjectsSheet` and
`ReprioritizeUnitsSheet` on this same route rather than introducing a desktop-only
Dialog variant. The interaction does not meaningfully diverge between layouts — a
searchable checklist works at both widths — so this is responsive reflow, not a
platform split. Removal has no confirmation surface at all: it is not destructive,
and the spec forbids giving it deletion's confirmation. The Overview project filter
does diverge: it joins the desktop single-row filter group and becomes an icon-only
trigger with an accessible name on mobile, per `goals-navigation`'s existing
requirements.

### The Overview filter is not a project selector

`goals-navigation` requires that any Goals subpage "that includes a project
selector" use the shared `ProjectSelect` component with its Current plan and
default markers, and position it trailing in the status-control row. Overview's
membership filter deliberately does **not** claim that role: it selects nothing for
any calculating view, it only narrows a list. It therefore renders in the
Type/Sort/Group filter group, not the status row, and does not reuse
`ProjectSelect`. Without this carve-out the two existing requirements and the new
filter's mobile placement contradict each other.

### Unavailable Default project

`defaultProjectId` is `undefined` whenever the projects query is pending, errored,
or unauthenticated. Relocation cannot be computed in that state, so the removal
action renders unavailable rather than submitting — a list containing `undefined`
would serialize as `[null]` and fail the endpoint's project-ownership check with a
400 the user cannot act on.

### Overview's project filter owns its own state

The filter is local component state in `goals-page.tsx` alongside the existing
Type/Sort/Group filters, defaulting to "all projects". It deliberately does **not**
read or write the persisted Current-plan preference that `goals-navigation`
requires for Dailies and Insights — that preference selects which project's goals a
calculating view operates on, whereas this filter only narrows a list the user is
already looking at. Conflating them would make browsing Overview silently change
what Dailies computes.

## Risks / Trade-offs

- **A relocated goal changes which daily plan it can appear in.** Dailies reads one
  selected project's goals filtered to Active. Moving a goal to Default removes it
  from the source project's plan and adds it to Default's. → The success toast names
  the destination project explicitly, so the consequence is stated at the moment it
  happens rather than discovered later in Dailies.
- **The removed row vanishes from the view the user is acting in.** → Same toast,
  naming the goal and destination; the goal remains reachable from Overview and from
  the destination project.
- **Whole-membership replacement can drop concurrent changes.** → Submission is built
  from membership refetched at save time; the endpoint's own normalization and the
  existing stale-revision handling cover the remaining window.
- **Pre-flight and submit can race.** → The 409 handler is kept and surfaces the
  conflict copy; pre-flight reduces the common case, it does not replace the
  backstop.
- **Delete and Remove sit adjacent in the same menu.** → Delete keeps its destructive
  styling and confirmation; Remove has neither. The delete confirmation additionally
  names the project-scoped alternative.
- **Promoting unit-name resolution touches two unrelated surfaces.** The Goals pages
  and the V1 import report both change their name lookup, so a regression there is a
  regression in features this change otherwise does not touch. → The promoted
  resolver takes the superset signature and preserves both behaviors exactly
  (including the null-id `""` case and the `characters:<id>` fallback chain), and
  existing-consumer regression tests plus `pnpm lint:fsd` are explicit tasks.
- **One conflicting selection could discard a whole batch.** The bulk endpoint rejects
  the entire save on any slot conflict. → The sheet pre-flights and blocks the
  offending selection rather than submitting a batch that cannot succeed.
- **Adding goals could reorder unit priority.** → Existing members resend their current
  priority and additions append above the maximum, so `NormalizeAsync`'s renumbering
  preserves the established unit order.

## Migration Plan

No data migration, no API deployment ordering, no companion API change. Every
endpoint used already exists in production. Rollback is a frontend revert; no
persisted state written by this change requires cleanup, because the only state it
writes — project memberships — is the same state the existing goal edit form
already writes.

## Open Questions

- Whether the relocation toast should offer an inline undo, or whether re-adding
  through the membership field is sufficient. Deferrable: it changes neither the
  requirements nor the call sequence, only the toast's contents.
- Whether the Overview project filter should offer "Default project only" as a
  distinct option from selecting Default by name. Deferrable: a labeling choice
  within a filter the specs already require.
