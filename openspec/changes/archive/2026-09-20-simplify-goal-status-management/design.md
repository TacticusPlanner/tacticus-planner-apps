## Context

`GoalRowActions` (`pages/goals/ui/goals-board/goal-row-actions.tsx`) is the single row-actions control shared by both the desktop table (`goals-list.tsx`) and mobile cards (`goals-mobile-cards.tsx`) — no platform split needed for the behavior this change adds. It currently renders pause/resume and archive/unarchive as plain `DropdownMenuItem`s inside the "⋯" menu, alongside project removal and delete, and calls `useGoalActions().setStatus(goalId, status)` — a single-goal mutation with no cascade or attainment awareness.

`GoalRow` (`pages/goals/model/shared/types.ts`) already carries `dependsOn?: string[]`, sourced from `GoalDetail.dependsOn`. Both `goals-page.tsx` and `project-detail-page.tsx` already compute `attainmentByGoalId` via `useGoalAttainment(goalIds)` and an `isReached(goalId)` helper, for the existing Reached status-filter count — the same signal this change needs for gating Archive, already available at the page level, just not threaded down to `GoalRowActions` today.

`UpdateProjectGoalsStatusEndpoint`/`updateProjectGoalsStatus()` (`entities/project/api/project.api.ts`) already exist, already restrict targets to `Active`/`Paused`, and already exclude `Completed`/`Archived` goals from the bulk set — confirmed via fresh grep that the client function has zero production callers today. No api change of any kind is needed for this proposal.

See proposal.md - Why.

## Goals / Non-Goals

**Goals:**

- Make pause/resume a primary, always-visible row action (GP-21).
- Wire the existing bulk pause/resume endpoint to a real UI surface, project-scoped (GP-22).
- Gate Archive's availability on a goal having reached its target, resolving GP-24/TERM-03 by making the Pause-vs-Archive choice a fact about the goal's own state rather than a wording problem.
- Cascade pause/resume to a goal's `dependsOn` prerequisites, safely with respect to a prerequisite shared by more than one dependent (GP-23).

**Non-Goals:**

- No api change — every endpoint this needs already exists and already behaves correctly for this scope (see Context).
- No removal of `GoalStatus.Archived` or its UI (superseding CLUSTERS.md's 2026-09-19 "remove outright" decision) — Archive stays, gated instead of eliminated.
- No server-side enforcement of the reached-gate on Archive. `UpdateGoalStatusEndpoint` continues to accept `Archived` as a valid target for any goal, reached or not — this is a client-side UI guardrail (decided explicitly over a server-enforced alternative: the api has no existing, confirmed way to compute "reached" for every goal kind, and building that is materially bigger scope than this change needs).
- No general multi-select bulk action UI (checkboxes, "select N rows") — GP-22's endpoint is an unconditional "every applicable goal in this project" transition, so the UI is two buttons, not a selection mechanism.
- No transitive cascade beyond direct `dependsOn` edges — a prerequisite's own prerequisites are not walked recursively. If GP-23's ask turns out to need multi-level chains in practice, that's a follow-up once single-level cascade ships and is observed to be insufficient.

## Decisions

**Cascade logic lives in `pages/goals/model/goals-data/use-goal-actions.ts`, computed from data the calling page already has.** The "no other dependent" check for a pause cascade needs the full row set (to count how many rows list a given id in their own `dependsOn`), which a single row's `GoalRowActions` instance doesn't have — only the page does (`allRows` in both `goals-page.tsx` and `project-detail-page.tsx`). `useGoalActions` gains a cascade-aware entry point that accepts the acting goal's `dependsOn` ids and a precomputed "how many rows depend on this id" lookup (a `Map<string, number>` built once per page render from `allRows`, not per row), rather than passing the entire row list through every row's action handlers.
Alternative considered: compute the dependent-count lookup inside `GoalRowActions` itself from a `rows` prop. Rejected — every row would then receive the full row list as a prop, an FSD/perf smell (invalidates every row's memoization on any row's data change) for a value only the pause path needs, once, from the parent.

**`reached` is threaded down as a plain boolean prop, not recomputed inside `GoalRowActions`.** Both call sites already compute `attainmentByGoalId`/`isReached` for the status filter; `GoalRowActions` receives `reached={isReached(row.goalId)}` alongside the existing `row`/`actions`/`project` props. Keeps attainment computation owned by the page (already the pattern for `isReached`), and `GoalRowActions` stays a presentation-plus-simple-mutation component with no new data-fetching of its own.

**The primary pause/resume control and the "⋯" menu are visually and semantically separate, not one control that happens to also open a menu.** GP-21's complaint is specifically that pause/resume requires opening the menu first; solving it means the control must be operable in one click, not "one click to open, one to select." Concretely: an icon button (Pause/Play, matching the existing icon-button pattern already used for the menu trigger itself) sits before the "⋯" trigger in the Actions cell.

**A cascade never transitions a `Completed` or `Archived` prerequisite.** `UpdateGoalStatusEndpoint` has no state-machine restriction on the _current_ status a transition starts from — only on the requested target (`UpdateGoalStatusValidator.AllowedTargets`) — so a cascade that blindly called `setStatus` on every `dependsOn` id would silently reopen a prerequisite the player already finished or deliberately archived. The cascade-aware entry point in `use-goal-actions.ts` filters `dependsOn` ids to those whose current row status is `Active` or `Paused` before applying the "no other dependent" (pause) or "always" (resume) rule from the requirement above — a `Completed`/`Archived` id is excluded before either check runs, not as an afterthought.

**Cascade calls run sequentially, and in-flight/result state is tracked per goal id, not as the single `pendingId: string | null` `useGoalActions` has today.** The acting goal's own call runs first, then each surviving cascade target's call runs in turn (not `Promise.all`) — partly for predictable ordering, partly because each call also triggers the api's own `NormalizeAsync` renormalization pass (see Risks below), and running them one at a time avoids two concurrent writes to the same project's goal-priority rows racing each other. `pendingId: string | null` becomes `pendingIds: ReadonlySet<string>` (the acting goal plus whichever cascade targets are still in flight), so every affected row can independently show its own pending state instead of only the clicked row. On completion: a single toast reports overall success if every call succeeded; if any call failed partway through, the toast names how many of N updates succeeded rather than presenting a false all-or-nothing result, and whichever calls did succeed are left as committed (no compensating rollback of the ones that landed).
Alternative considered: fire all cascade calls with `Promise.all` for speed. Rejected — no meaningful latency win for what's realistically 1-3 calls per action, and it removes the ability to reason about `NormalizeAsync` ordering.

**The bulk pause/resume UI is two items in Project Detail header's existing overflow menu** (`project-detail-header.tsx`, which already has a `DropdownMenu` for secondary actions like Edit), not new always-visible buttons. GP-22 asks for the capability to exist and be reachable "quickly," not for prominent placement — the header's existing overflow pattern is the natural, lowest-footprint home, consistent with how Edit already lives there.
Alternative considered: a single context-sensitive "Pause all / Resume all" toggle instead of two separate items. Rejected — a project's goals are rarely uniformly all-Active or all-Paused, so a single toggle would need to define what it means when mixed (which the endpoint itself doesn't need to care about, since it always transitions every _applicable_ goal toward one explicit target); two explicit items ("Pause all goals", "Resume all goals") avoid that ambiguity entirely and map directly onto the endpoint's own `Status` parameter.

## Risks / Trade-offs

- [The reached-gate on Archive is client-only, so a request crafted outside the UI (or a future bug) could still archive an unreached goal] → Accepted per the confirmed decision; the existing account-wide "every goal shows every applicable action per its actual status" invariant elsewhere in this codebase is likewise UI-enforced, not uniquely risky here. Revisit if this proves to matter in practice.
- [The pause cascade's "no other dependent" check only looks at the current page's row set] → On Goals Overview this is every goal on the account, so accurate; on Project Detail it's scoped to that project's rows only, so a prerequisite also depended on by a goal in a _different_ project would not be detected as shared, and could be cascade-paused even though another project still needs it. Flag as a known limitation in tasks.md rather than solve now — resolving it correctly needs an account-wide dependent lookup, which project detail doesn't otherwise fetch.
- [Two explicit bulk buttons instead of one toggle add a small amount of header clutter] → Already inside an overflow menu, not the visible header row, so the cost is one extra menu item, not surface area.
- [The cascade multiplies calls to `UpdateGoalStatusEndpoint`, which runs `ProjectGoalPlanningService.NormalizeAsync` on every call — the same renormalization path ORDER-02 (CLUSTERS.md Cluster 4, reopened 2026-09-20, not yet re-verified against current code) reports as capable of unexpectedly reordering goals] → One user click on a goal with, say, three sole-dependent prerequisites now fires four sequential status-change calls instead of one, each renormalizing that goal's project(s) — if ORDER-02 turns out to still reproduce, this change would make it fire up to N times more often per user action than before. Not mitigated here: this proposal's cascade scope (direct `dependsOn` edges only, sequential calls) is already the minimum viable shape, and building a batched/atomic multi-goal status-transition endpoint just to reduce `NormalizeAsync` calls is out of scope for what is otherwise a zero-api-change proposal. Sequencing this change's manual verification (tasks.md) after ORDER-02's own re-verification, or including an ORDER-02 repro attempt using a cascade as the trigger, is the cheapest way to close this risk without new scope.

## Migration Plan

No data migration, no api change. Ship as a normal apps-only release.
