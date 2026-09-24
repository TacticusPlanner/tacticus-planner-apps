## Context

Today and Raids Plan use project goals selected through a shared Dailies project selector. Insights and project estimates also derive from project membership priority, while Goals Overview is flat but has no canonical execution order. The API companion `tacticus-planner-api/openspec/changes/establish-global-goal-priority` introduces `GET /me/goals` global priority/revision and `PUT /me/goals/order`; apply it first. Existing `make-global-plan-the-goals-landing` reserves `/goals/plan` provisionally and should use this finalized route.

## Goals / Non-Goals

**Goals:** One ordered planning input and one derived execution run, with all filtered views projecting it; no competing project-local ordering.

**Non-Goals:** Change goal status rules, remove projects, automatically change the `/goals` landing, or invent a new raid heuristic for mixed unit types without reproducing the reported symptom.

## Decisions

1. Finalize `/goals/plan` as the global ordered child route. Keep `/goals/overview` as All Goals and existing project URLs stable. The separate landing change will redirect bare `/goals` later. Goals shared layout owns route selection; Global Plan has no project selector. Project detail keeps project status/Group browsing state but removes drag controls and links to Global Plan.
2. Goal entity owns typed global priority/revision and reorder mutation; a shared planning feature owns the canonical sorted Active-goal selector and one simulation result containing per-goal needs, allocations, blockers, dates, and day rows. Today, Raids Plan, Insights, project summaries, and estimate displays derive from that structure through public APIs. This avoids page-to-page or sibling-feature imports and prevents divergent summary calculations. A single goal's isolated estimate remains separate and explicitly labeled.
3. Reorder only with the full in-flight set visible. The API requires all IDs and revision; filtered/grouped reorder would make hidden positions ambiguous. On stale conflict, keep the attempted move as a draft intent, refresh, show the changed order and require explicit retry. Do not silently replay. The global list includes Paused goals in position; the simulator filters them out without renumbering or reallocating their resources.
4. Desktop uses row drag handles; mobile uses the existing collapsed-card reorder pattern moved to Global Plan, with touch-sized handles. Both save on completed drag. On mobile, entering the mode scrolls the reorder-list heading or first card into the visible viewport and places focus on an appropriate mode/list target without disrupting an active drag. Keep a touch-sized Done/exit control reachable adjacent to the working list (for example a sticky in-view control) even when lower rows are being moved; it exits mode, not commits an unsaved batch. Respect reduced-motion preferences and avoid covering drag targets or the last row. Show save-pending and failure/conflict feedback within reach of the list. Desktop/mobile Joyride selectors are distinct where markup differs; the Goals tutorial explains canonical priority, paused goals, and project projections. The Dailies tour loses project-selection guidance. Keep the same goal detail/status actions in both forms.
5. Current plan remains an API-backed browsing preference for project dashboard prominence and the initial Insights project filter; it cannot choose an execution run. Insights project choice projects results from the global run. All Goals membership/type/sort/group filters remain independent of that preference and do not mutate execution order. Today's Attempts stays account-wide as it already is.
   Existing Shop, Arena, Onslaught, and Salvage recommendation pages may retain an explicitly labeled project-focus lens for presentation/team selection; that lens must not alter the canonical global raid/estimate allocation. Their independent recommendation policies are not rewritten by this change.
6. Trace the reported RAID-004 mixed Character/Machine-of-War case through goal ordering, requirement derivation, inventory allocation, and rendered raid groups before changing any type-weight code. Current `raid-schedule.tsx` already sorts active project entries by stored priority; the known defect is scope, not necessarily a type-weight comparator. Add a regression fixture with interleaved types and shared need, and only fix an additional type sort if reproduced.
7. Reconcile dependent proposals before application: `make-global-plan-the-goals-landing` uses `/goals/plan`; `improve-bulk-project-membership` never changes priority and retains Default membership; `surface-goal-farming-guidance` uses global-run estimates even for non-current project pages. If their planning artifacts still say project-only execution, update them with `openspec-update-change` before implementation.

## Risks / Trade-offs

- [Large calculation fan-out] → Compute one canonical result per goal/order/inventory/settings/catalog key and derive filtered summaries; test cache invalidation for reorder, status, membership, inventory, and planning settings.
- [User expects Current plan to control Dailies] → Explain browsing-only meaning in dashboard and Global Plan; keep project filters clearly labeled as projections.
- [Failed or partial loading presents stale estimates] → Model goal load, catalog/player load, no Active goals, no actionable demand, and simulation failure separately, with retry.
- [Cross-repo rollout] → API-first integration against regenerated OpenAPI; frontend must not call retired project reorder.
- [Dependent OpenSpec plans drift] → Validate named dependencies and revise their artifacts before apply rather than silently interpreting them differently.

## Migration Plan

After API migration/backfill, switch the goal entity contract and add `/goals/plan`. Replace project-scoped simulator input with global Active-goal input, then migrate consumers one by one against shared fixtures. Remove project-local reorder UI and Dailies project selector only when all consumers use the global result. The fallback on frontend rollback is to hide the new route, not to recreate project-local order; coordinate rollback with API backup policy.

## Open Questions

- Final wording for “Current plan” versus “project filter” can be refined during the en/de/es/fr copy review, provided it never implies an alternate execution plan.
