## Context

See proposal.md - Why. Today `reprioritize-units-sheet.tsx` is the sole reorder surface: a dialog/Sheet listing unit blocks, drag-reordered with `@dnd-kit/core`/`sortable`, saved in one call to the unit-keyed endpoint. `project-detail-page.tsx` renders the goal list (desktop table / mobile cards per `goal-list-layout`), offers Group=Unit as one of its Group options, and its onboarding tour (`project-detail-page.tutorial.tsx`) targets `[data-testid="project-reprioritize-units"]` — the Sheet's trigger button, which this change removes.

## Goals / Non-Goals

**Goals:**

- Replace the dialog-based unit reorder with inline per-goal drag (desktop) and a collapse-to-reorder mode (mobile), calling the companion API change's new goal-keyed endpoint.
- Make Group=Unit a pure client-side display clustering over the flat priority list, with no server-side grouping behind it.
- Fold in the Level-goal row-merge rendering (Cluster 7) on the same goal-list surface.

**Non-Goals:**

- Not building the "add a rank range" creation shortcut (`add-rank-range-progression`) — separate change, sequenced after this one.
- Not changing the Goals Overview list's non-reorderable behavior — the drag handle and reorder mode are conditional on project detail only.

## Decisions

**Reuse `@dnd-kit`, generalize the existing dialog's usage into a row-level pattern.** `reprioritize-units-sheet.tsx` already proves the mechanics (`DndContext`, `useSortable`, `PointerSensor`/`KeyboardSensor`) work in this codebase; V1's `sortable-list.tsx` is the reference for a clean, reusable generic wrapper (item-agnostic `SortableList<T>` taking `getId`/`renderItem`/`onReorder`). Build an equivalent shared component (or port V1's) in an appropriate FSD slice (`entities/project` or `features/project-management`, not page-local, since both the desktop table rows and the mobile card list need it) rather than duplicating drag wiring in two places.

**Desktop: the handle lives in `goal-list-layout`'s row, not a page-level overlay.** Per the spec delta, the handle is a leading control before the Character column, present only when the table renders on project detail. This means the shared goal-row rendering component needs a `reorderable?: boolean` (or equivalent) prop threaded from `project-detail-page.tsx`, not a project-detail-specific fork of the row component — Goals Overview keeps rendering the same row component with reordering off.

**Mobile: reorder mode is local UI state, not a route or dialog.** A boolean (e.g. `isReordering`) on `project-detail-page.tsx` (or its mobile-specific subtree) toggles between the normal card list and a collapsed, draggable one. Each drag's `onReorder` calls the goal-order mutation immediately — no local "pending order" held back for a Save button, since the spec requires committing per drag. Exiting reorder mode is just flipping the boolean back; no discard-vs-save branch exists because there's nothing pending to discard.

**Group=Unit clustering already exists client-side and needs no new code — verified, not assumed.** `project-detail-page.tsx` already derives its unit clusters entirely client-side today, via `groupRows` (`model/shared/row-groups.ts`) and `projectUnitPlans`: `groupRows` partitions "already-filtered, already-sorted rows" by unit key, in first-appearance order, with each group's rows keeping their incoming order — it never imposes an order of its own. This means today's unit blocks were never a server-side concept in the display layer; the server-side unit-contiguous _priority storage_ just happened to make the flat list `groupRows` receives arrive pre-clustered. Once the companion api change makes that incoming list flat-per-goal instead, `groupRows` requires **no changes** — it already satisfies "Sort orders individual goals; Group=Unit is a display-only clustering" by construction (stable grouping, incoming order preserved). This corrects an earlier draft of this design, which incorrectly assumed this clustering needed to be newly built.

**Level-goal merge is computed from the already-loaded goal list, not a new query.** For each Level goal in the loaded set, find goals whose `DependsOn` includes it; render merged (as a sub-line) only when exactly one such dependent exists among the currently-loaded in-flight goals, otherwise render standalone. This is a pure client-side derivation over data already fetched for the list — no new endpoint or field needed (confirmed in the companion api proposal's Impact section).

**Optimistic update on reorder, with drag disabled while a reorder is in flight.** Since each drag commits immediately with no Save step, the row/card order updates optimistically on drop (not waiting for the mutation's round-trip) to avoid visible snap-back latency, with a rollback to server state if the mutation is rejected (stale set). To close the race a same-day review caught — a second drag built from optimistic state that's already stale once the first drag's mutation is rejected — the drag surface is disabled (or drag-drop is ignored) while a reorder mutation is in flight, re-enabled only once that mutation resolves (success or rollback). This is simpler than queuing a second call behind the first: since the mutation round-trip is fast and each drag already commits immediately with no batching, a brief drag-disabled window is a smaller UX cost than the complexity of a request queue plus discard-on-rejection logic, and it structurally can't fire a call built from state the previous rejection already invalidated.

**Cross-cluster dragging is not offered while Group=Unit is active.** A goal's drag is confined to reordering within its own cluster when clustered by unit — there is no drop target that would move it into a different unit's cluster or to a flat-order position between another unit's goals. Considered and rejected: allowing a cross-cluster drop and re-deriving clusters afterward — since `groupRows` clusters purely by the goal's own unit key, a goal dropped "between" another unit's cards would immediately re-cluster back into its own unit's section on the next render, which looks like the drop silently did nothing (or worse, visually flickers) rather than behaving predictably. Confining the drag to its own cluster avoids that dead-end interaction entirely; a true cross-unit reorder is still possible by switching to no grouping or Group by type first.

## Risks / Trade-offs

- **[Risk]** `project-detail-page.tutorial.tsx` targets `[data-testid="project-reprioritize-units"]`, the Sheet trigger being removed → **Mitigation**: update the tour step to target the new drag handle (desktop) or the mobile reorder-mode button instead of dropping the step outright — reprioritization is still worth calling out in onboarding.
- **[Risk]** Optimistic reordering with per-drag commits could race if the user drags twice in quick succession before the first mutation resolves, with a second call built from optimistic state a rejected first call already invalidated → **Mitigation**: see the "disabled while in flight" decision above — the drag surface is unavailable for the brief window a mutation is pending, so there is no second call to race with the first.
- **[Risk]** `add-goals-to-project-sheet.tsx` currently sends each existing member's own `priority` back to `UpdateProjectGoalsEndpoint` and computes one for new members — the companion api change makes that endpoint ignore the field entirely → **Mitigation**: no functional change needed for that caller (it already sends values consistent with append-only behavior), but its request-building code should stop computing/sending `priority` since the field is being removed from the endpoint's contract — flagged as its own task.

## Migration Plan

- Remove `reprioritize-units-sheet.tsx` and its trigger from `project-detail-page.tsx`.
- Update `project-detail-page.tutorial.tsx`'s reprioritize step to target the new drag affordance.
- Deploy together with the companion `tacticus-planner-api` change (same release) — the client must not call the removed unit-order endpoint after that deploy.
- Rollback: revert both changes together; no persisted client state to unwind (reorder is server-persisted priority, unaffected by this deploy itself).
