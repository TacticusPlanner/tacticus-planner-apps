## Context

The app's project membership and assembly specs mirror the API's current unit/type slot. `rankResourceNeed` derives full Rank ranges per goal and can double-count overlap when two Rank targets for one character become legal. `integrate-level-progression-into-rank-goals` establishes level/XP ownership first; `establish-global-goal-priority` later replaces project-effective ordering with account order.

## Goals / Non-Goals

**Goals:** Independent milestone controls with one allocation of shared progression.

**Non-Goals:** Duplicating identical active targets, declaring a covered later goal actually complete before sync, or changing non-Rank slots.

## Decisions

1. `features/goal-farming` owns a canonical per-unit ordered progression-interval allocation: derive each Rank/level/material occurrence once from current state to each target and assign uncovered intervals to the first goal that claims them. Detailed per-goal rows and aggregate totals derive from that structure. Alternative: subtract one goal's total from another after separate estimates. Rejected because recipe overlap and partial slots cannot be safely subtracted from totals.
2. `entities/goal` exposes normalized Rank end-target identity from the API contract; goal creation, membership picker, and project assembly use it for local preview, then treat server 409 as authoritative under concurrency. Keep the user's draft on conflict and link to the existing goal.
3. Keep each goal's identity, status, membership, and priority independent even if its additional demand is zero because an earlier higher target covers it. Actual completion is evaluated against synced character progression, never another goal's planned demand.
4. Goals table and mobile cards label both targets; project assembly uses desktop table and mobile sheet selectors with the same target-specific eligibility. Update Goals/Projects tutorials at both layouts. The shared allocator API is consumed by Goals, Insights, and Dailies rather than importing page logic.

## Risks / Trade-offs

- [A higher target appears before a lower one] → Allocate to the earlier goal, show the later one as covered in plan but not actually achieved.
- [Partial slots and crafted recipes overlap] → Model occurrence/interval identity before recipe expansion and net inventory once.
- [Global order lands later] → Accept an ordered input independent of projects; change its source in `establish-global-goal-priority` without changing allocation semantics.

## Migration Plan

Apply API companion first, then enable multi-target UI and interval estimator in one client change. No client storage migration. Preserve prior one-Rank fixtures and add two-target, shared-project, delete/recreate, and conflict fixtures. Roll back the client with API only after reviewing any newly created multi-target records.

## Open Questions

- Which compact label best distinguishes two partial targets at the same rank in the mobile card? Choose translated presentation during implementation; target identity and actions are fixed by the spec.
