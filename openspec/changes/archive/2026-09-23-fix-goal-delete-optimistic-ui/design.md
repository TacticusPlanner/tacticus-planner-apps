## Context

See `proposal.md` - Why. Relevant existing shape, confirmed by reading the
code:

- `use-goal-actions.ts`'s `setStatus` (pause/resume) already patches the
  cache optimistically via `patchStatusCache`, which calls
  `applyOptimisticGoalStatus` (in the sibling file
  `optimistic-goal-status.ts`) against both `queryClient.setQueriesData`
  calls it makes — one for `goalQueries.all()`, one for
  `projectQueries.all()` — covering every shape a goal can be cached under:
  a single `GoalDetail`, the flat `{ goals: GoalSummary[] }` list, and the
  project-membership-wrapped `{ goals: ProjectGoalSummary[] }` list.
  `applyOptimisticGoalStatus` returns the same object reference when
  nothing changes, so unrelated cache entries don't re-render.
- `remove()` has no equivalent patch: it calls `run(goalId, () =>
deleteGoal(goalId))`, awaits it, and only shows `toast.success(...)` on
  success — the row's actual disappearance comes from `mutation`'s
  `onSuccess`, which invalidates and refetches both query prefixes.
- The only call site (`goal-row-actions.tsx`) awaits `actions.remove(goalId)`
  and only closes the confirmation dialog on success — it does not manage
  row visibility itself, so today's dialog-close and the eventual refetch
  are two separately-timed things the user perceives as one slow action.
- No multi-select or bulk-delete UI exists anywhere in the goals pages
  today (`goal-row-actions.tsx`, `goals-list.tsx`,
  `goals-mobile-cards.tsx`) — confirmed by reading these files. `GP-37`'s
  bulk-delete question is therefore about adding a UI capability that does
  not exist at all yet, not about extending one.

## Goals / Non-Goals

**Goals:**

- Make single-goal delete feel instant, mirroring `setStatus`'s existing
  optimistic pattern exactly (add-before-await, revert-on-failure).
- Remove the success-toast obstruction identified in the source issue.

**Non-Goals:**

- **Bulk/multi-select delete.** The two commenters on `GP-37` disagreed on
  whether this is needed at all, and no multi-select UI exists to extend.
  SeventhSun's own follow-up argues optimistic single-delete may fully
  resolve the underlying complaint (speed) without it — "just let the user
  one-click instant delete them... it would turn into a batch delete option
  that _also_ has no delay and no popup" (i.e., even a future bulk delete
  would want this same optimistic foundation first). Building this change's
  optimistic single-delete first, then re-evaluating whether bulk selection
  is still wanted once deletion no longer feels slow, is a smaller and more
  informed first step than speculatively building multi-select UI now. If a
  future request still wants bulk selection, it would consume the same
  `remove()`/cache-patch primitives this change adds.
- No change to `setStatus`, the pause/resume cascade, or bulk pause/resume
  — unrelated to deletion.

## Decisions

**Extract removal into a sibling pure function next to
`applyOptimisticGoalStatus`**, e.g. `applyOptimisticGoalRemoval(data,
goalId)` in a new `optimistic-goal-removal.ts` (mirroring
`optimistic-goal-status.ts`'s existing split: a pure, independently-testable
cache-shape function, plus a thin `patch*Cache` wrapper in
`use-goal-actions.ts` that calls `queryClient.setQueriesData` for both
query prefixes). Considered inlining the filter logic directly into
`use-goal-actions.ts`. Rejected — `optimistic-goal-status.ts` already has
its own dedicated test file (`optimistic-goal-status.test.ts`) covering
each cached shape in isolation; splitting removal out the same way keeps
that same shape-by-shape test coverage without needing
`QueryClient`/React plumbing in the test, and keeps `use-goal-actions.ts`
itself unchanged in structure (just one more `patch*Cache` call).

`applyOptimisticGoalRemoval` handles the same three shapes
`applyOptimisticGoalStatus` does, but by filtering instead of patching a
field:

- A cached `GoalDetail` matching `goalId`: leave it as-is (removing it from
  this cache entry doesn't fix anything — the goal that no longer exists is
  a query-key concern, not a filtering concern, and if the detail sheet is
  open on a goal the user just deleted, closing that sheet is already the
  consuming component's job, unrelated to this cache patch).
- The flat `{ goals: GoalSummary[] }` shape: filter out the entry whose
  `goalId` matches.
- The project-membership-wrapped `{ goals: ProjectGoalSummary[] }` shape:
  filter out the entry whose `.goal.goalId` matches.

Same "return the same reference when nothing changes" contract as
`applyOptimisticGoalStatus`, for the same re-render-avoidance reason.

**Revert-on-failure re-inserts via `queryClient.invalidateQueries`, not a
manually-reconstructed cache entry.** `setStatus`'s revert re-patches the
known `previousStatus` value back in-place, which works because nothing
about the goal's shape changed. A failed delete's "revert" is different:
the optimistic patch already removed the goal from arrays it must return
to at whatever position it previously held, and nothing in `remove()`'s
signature captures that position today. Re-running the existing
`goalQueries.all()`/`projectQueries.all()` invalidation on failure (the
same invalidation `onSuccess` already triggers) re-fetches the authoritative
list, which still contains the goal server-side since the delete failed —
simpler and correct, at the cost of the restore taking one more round trip
than the instant removal did. Acceptable: a failed delete is the
uncommon path, and the requirement is that the goal _comes back_, not that
it reappears instantly.

**Drop the success toast unconditionally**, not just when the sheet/dialog
is closing. Matches `setStatus`'s existing "no toast on success" behavior
exactly, and the source issue's own investigation note already endorses
this ("the success toast can likely be dropped too, mirroring pause/resume's
'no more toast' precedent").

## Risks / Trade-offs

- [A failed delete's restore takes a full round trip while the optimistic
  removal was instant, so a user could act on the (soon-to-reappear) empty
  space in the interim] → Mitigation: this matches `setStatus`'s own
  asymmetry (instant apply, revert only on the less-common failure path)
  and is an accepted trade-off of optimistic UI in general; the error toast
  makes the failure and reappearance legible rather than silent.
- [Dropping the success toast removes the only visible confirmation that a
  delete happened, for a user who deletes from a context where the row's
  disappearance might not be visible (e.g., scrolled away)] → Mitigation:
  this is the same trade-off pause/resume already accepted and shipped
  without complaint; scoped consistently rather than introducing a new,
  delete-specific exception.
