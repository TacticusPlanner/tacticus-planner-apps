## Context

See `proposal.md` - Why. Shape of the code this lands on, confirmed by reading it on `main`:

- `GoalsList` (`pages/goals/ui/goals-board/goals-list.tsx`) is consumed only
  by `goals-page.tsx` now; the `project` prop on `GoalsListProps` is never
  supplied, so `GoalRowActions`' project move/remove branch, its
  `useMoveGoalFromProject` call, `MoveToProjectDialog` and the
  `ManageProjectsSheet` it mounts are unreachable from this page.
- Desktop row actions are three inline icon buttons (Edit, Pause/Resume,
  Delete) in a trailing Actions cell; mobile has a `DropdownMenu` holding
  Delete only. Both render from one `GoalRowActions`.
- `useGoalActions` already owns the sequential multi-goal shape a bulk action
  needs: `run(goalId, action, { silent, trackPending })`, a `pendingIds`
  set, optimistic cache patches (`patchStatusCache`, `patchRemovalCache`)
  and the aggregate `goals.toasts.statusChangedPartial` toast. The
  prerequisite cascade is a sequential loop over `updateGoalStatus` because
  each status call renormalizes the global order server-side.
- The API has per-goal status, delete and `PUT me/goals/{id}/projects`
  endpoints and an atomic per-project `PUT me/projects/{id}/goals` with an
  `expectedGoalIds` stale check. There is no batch status/delete endpoint.
- Mobile reorder mode is a page-local boolean (`useMobileReorderMode`) with
  a control-row toggle (`GoalsMobileReorderToggle`) and a sticky bottom bar
  (`MobileReorderBar` in `features/goal-order`).
- `GoalResourceChips` caps at six chips with a "+N" chip and the `<ul>` is
  `max-h-12 max-w-[220px] overflow-hidden`, so a Machine of War goal loses
  chips silently (staging: Z'Kar shows two of its chips).
- `EstimateCell` renders `UnavailableMaterials` (one `<li>` per blocked
  material) into the Status · Done by cell when the estimate is Blocked;
  `BlockedIndicator` already has a tooltip listing the blocker reasons.
- `packages/ui` ships `Checkbox` (Radix) and `DropdownMenu`; nothing new is
  needed.
- `add-goals-overview-density-option` (in progress, 0/14) edits the same
  toolbar and row files.

## Goals / Non-Goals

**Goals:**

- One selection model on the page, consumed by both the desktop table and
  the mobile select mode, with no persistence and no context provider.
- Every bulk action reuses the existing per-goal mutation helpers; no API
  change, no new dependency.
- `GoalRowActions` becomes one menu-only component for both platforms, and
  its dead project branch is deleted.

**Non-Goals:**

- No batch endpoint. Sequential per-goal calls are the design until a
  measured need appears (see Risks).
- No bulk Remove-from-project, Move, Edit, or Archive.
- No change to how estimates, blockers, attainment or order are computed.
- Project Detail is not a consumer of `GoalsList` any more; nothing here
  targets it.

## Decisions

**Selection lives in `goals-page.tsx` as `useState<ReadonlySet<string>>`
and is threaded through `GoalsListProps` as `selection` +
`onToggleSelected`.** The page already owns every other list-wide
concern (filters, reorder, edit dialog) and derives the visible row set
(`rows`), which is exactly what select-all needs. A context provider or a
store was rejected: two consumers, one owner. Clearing is a `useEffect`
keyed on `[tab, goalType, scopeId, group]` plus an explicit clear at the end
of every bulk action; a reorder drop and query refetches never touch it.
Select-all toggles over `rows` (the flattened, filtered set across every
`rowGroups` entry): checked when every visible id is selected,
indeterminate when some are, unchecked otherwise.

**Bulk mutations are three new functions on `useGoalActions`:
`setStatusMany(targets, status)`, `removeMany(ids)`,
`addToProject(rows, project)`.** Each is a sequential `for` loop over the
existing `run(goalId, …, { silent: true, trackPending: false })` with all
ids held pending for the whole operation (the cascade's exact shape), the
existing optimistic patches applied up front and reverted per failed id,
and one aggregate toast when `succeeded < total`. Alternatives:
`Promise.all` was rejected because status calls renormalize order
server-side (the reason the cascade is sequential); a new batch endpoint
was rejected as a paired API change nothing yet justifies.
`ponytail: sequential per-goal calls, ~150ms each; add a batch endpoint if
users routinely select 50+ goals.`

**Add to project updates each goal's own membership
(`updateGoalProjects(goalId, [...current, target])`) rather than the
project's atomic membership endpoint.** Per-goal keeps all four bulk
actions on one loop, needs no `expectedGoalIds` snapshot or stale-409
reconcile UI, and the current membership is already on `GoalRow.projects`.
The atomic endpoint stays the right tool for the Manage-goals sheet, where
the user reviews a whole membership set. Goals already in the destination
are filtered out before the loop, so the count in the success toast is the
number actually added.

**Applicability is computed from the selection at render time, not stored.**
`pauseTargets = selected ∩ Active ∩ !reached`, `resumeTargets = selected ∩
Paused ∩ !reached`; a button is disabled when its target set is empty, and
its label shows that set's size. Reached comes from the page's
`reachedByGoalId`. Goals already in `pendingIds` are excluded from every
target set.

**`GoalRowActions` becomes a `DropdownMenu` on both platforms: Edit,
Pause|Resume, separator, Delete (destructive).** The desktop-vs-mobile
split, the inline icon buttons, the project branch, `useMoveGoalFromProject`,
`MoveToProjectDialog` (as a move picker) and `ManageProjectsSheet` are
removed from it. The trigger is an always-visible `icon-sm` ghost button at
the trailing edge of the Character cell (`ml-auto` inside the cell's flex
row) on desktop and stays at the card header's right on mobile. Rejected:
placing the trigger in the leading cell after the drag handle — that cell
already holds checkbox, priority number and grip, and a fourth control there
would be wider than the name column; hover-only visibility — fails
keyboard and touch discoverability and Azure keeps it visible.

**Destination picker for Add to project reuses `MoveToProjectDialog`'s
component with a `title`/`description` prop pair**, since its shape
(project list with colour dots, `onSelect`, `onCreateNew`, pending) is
exactly what the bulk action needs. The file is renamed to
`project-picker-dialog.tsx` with the "move" copy replaced. The no-project
case routes to `ManageProjectsSheet` with `project={undefined}`, as the old
move flow did, and applies the created project as the destination.

**Bulk delete reuses `DeleteGoalDialog` with a new `count` prop**; the
title/description/confirm keys take `count` and pluralise through i18next.
The single-row delete passes `count: 1` and keeps its copy.

**Toolbar: two explicit rows in `goals-page.tsx` on desktop.** The actions
row is `[Create goal] [Pause] [Resume] [Add to project] [Delete] …
[Planning settings]`; the filters row is `[status] [type] [group] [order
hint]`. The four bulk buttons and their enablement/count logic are one
component, `GoalsBulkActions` (`goals-board/goals-bulk-actions.tsx`),
rendered as `size="sm"` outline buttons in the desktop row and as the
button strip of the mobile bottom bar, so the two platforms cannot drift.
Mobile keeps its existing status row and icon row; the icon row gains the
select-mode toggle next to the reorder toggle.

**Mobile select mode is a page-local boolean beside reorder mode, with a
`MobileSelectBar` in `goals-board/`.** `useMobileReorderMode` is not reused
(its scroll-into-view/focus behaviour is reorder-specific); a `useState`
plus two wrappers (`toggleSelect` calls `exitReorder`, `toggleReorder`
calls `exitSelect`) gives mutual exclusion. The bar copies
`MobileReorderBar`'s sticky-bottom card shape but lives in the page slice,
not `features/goal-order`, because it is selection UI, not order UI (FSD:
a page may compose two features; a feature must not import a sibling).
Exiting select mode (Done, entering reorder, leaving the page) clears the
selection.

**Leading cell is always rendered on desktop.** `hasLeadingCell` was
conditional on reorder/priority; the checkbox makes it unconditional on
this page, so the flag and its branches go. Cell content order: checkbox,
priority number, drag handle. The checkbox sits inside the cell that
already stops row-navigation propagation.

**Column swap and Remaining unclipped.** The `TableHead`/`TableCell` pairs
for Status · Done by and Remaining swap; the Remaining cell gets
`min-w-[260px]` and the chips `<ul>` loses `max-h-12 max-w-[220px]
overflow-hidden`; `MAX_VISIBLE_CHIPS` and the overflow `<li>` are deleted.
`h-14` on a `<tr>` already behaves as a minimum, so a wrapped-chips row
grows on its own; no per-row height logic is added.

**Blocked materials move into `BlockedIndicator`'s tooltip.**
`BlockedIndicator` gains an optional `estimate?: EstimateOutcome` prop and
renders `UnavailableMaterials` (moved from `goal-row-shared.tsx` to
`status-badge.tsx`) after the reason lines when the estimate is Blocked.
`EstimateCell` returns `null` for a Blocked estimate. Both the table cell
and the mobile card pass the estimate, so the two platforms match.

**Tour.** Desktop gains `select` (target: the header select-all checkbox,
`goals-select-all`) and `bulkActions` (target: `goals-bulk-actions`) steps
before `createGoal`; mobile gains `select` targeting
`goals-mobile-select-toggle` and reuses the same `bulkActions` copy on the
bottom bar only when the bar is visible, so the mobile step targets the
toggle. Copy lives under `tour.overview.steps.select.*` and
`tour.overview.steps.bulkActions.*`. The `reprioritize` step's desktop
target is unchanged (`goal-row-drag-handle`).

**Ordering against `add-goals-overview-density-option`.** This change lands
first. That change's toolbar task places the density toggle on the filters
row, and its Compact row-height task inherits the wrapped-chips exception
from this change's `goal-list-layout` delta. Its proposal's "Archive order"
note should be extended to name this change.

## Risks / Trade-offs

- [N sequential requests for N selected goals] → rows stay disabled and
  the bar shows a spinner for the duration; typical selections are under
  twenty. Batch endpoint deferred, see the ponytail note above.
- [Bulk optimistic delete of many rows, one failure] → the existing
  `remove` already invalidates both query prefixes on failure; `removeMany`
  does the same once after the loop, restoring only the failed ids from the
  refetch.
- [Selection cleared by an effect on filter change could race a bulk
  action that started before the change] → the loop iterates a snapshot
  array taken at click time, so the selection state clearing mid-flight
  changes nothing about which goals are acted on.
- [Row menu adds a click to Pause] → accepted and decided; bulk Pause
  restores one-click speed for the multi-goal case.
- [Wrapped-chips rows break the "fixed height" scanability] → limited to
  Machine of War Ability goals with many materials; the widened column
  keeps most at two lines. Revisit if it reads as jumpy in review.
- [Two toolbar rows cost ~40px vertical space on desktop] → accepted for
  discoverability; the density change can reclaim row height.
- [Existing tests assert the inline icon buttons and the seven-column
  header] → updated in the same change; listed in tasks.

## Open Questions

None that change the specs or tasks. Exact button widths and the Remaining
minimum width are tuned during desktop verification.
