## Context

The goal detail edit form currently handles notes, projects, sources, and strategy through `use-goal-detail-save`; the goal entity does not expose a target mutation. The paired API change adds a revision-checked target operation and a revision in goal detail. Rank semantics must follow the preceding level-integration and multiple-milestone changes.

## Goals / Non-Goals

**Goals:** Keep target edits explicit, isolated from unrelated detail saves, and reflected throughout client planning.

**Non-Goals:** Change a goal's kind or unit, edit an Unlock target, resurrect terminal goals, or automatically complete an already-attained goal.

## Decisions

1. Add a dedicated target editor/action inside goal detail, separate from the existing general Save control. This avoids partial multi-endpoint saves and makes clear that target changes recalculate planning. Reusing the general save button was considered but would imply atomicity across unrelated mutations that the API cannot provide.
2. Put the typed target mutation and revision handling in the goal entity public API. The Goals page composes the editor and uses shared goal-kind validation/field primitives, without importing a create-goal page or a sibling feature. Where creation validation can be reused, extract it into a downward-safe shared module rather than copy divergent rules.
3. Read the stored target and revision when entering edit mode. Keep a local draft through validation/server errors. A stale-revision conflict requires an explicit refresh/review; automatic replay could overwrite a newer user's intent. A milestone collision links or names the existing conflicting milestone where the response permits.
4. After success, update the canonical goal cache and invalidate all goal/project/planning query keys that derive needs, estimates, blockers, Dailies, or Insights. Do not optimistically show a recalculated estimate before authoritative refresh. Distinguish refresh failure from zero need.
5. Use the existing goal-detail sheet at both breakpoints. Mobile presents the same fields in a scrollable, keyboard-safe sheet with a persistent save affordance; desktop uses the existing wider sheet. No separate route or alternate target semantics are needed. Add a Goals tour step targeting the Edit target action where eligible, with breakpoint-appropriate selectors only if markup differs.

## Risks / Trade-offs

- [Creation and edit validation diverge] → Share goal-kind rules and test parity for each supported kind.
- [Save succeeds but derived queries fail] → Show explicit stale state and retry; never label old estimates as new.
- [Multiple concurrent edits] → Revision check plus retained draft and explicit conflict resolution.
- [Rank target shrink makes a prior level prerequisite redundant] → Preserve independent goals; recalculate restrictions and expose cleanup as a separate user choice, not an implicit delete.

## Migration Plan

Apply the API companion first. Ship client types and UI together; old clients keep using existing detail operations. Rollback of the client simply hides editing, with server-stored revised targets still readable by existing goal rendering.

## Open Questions

- Exact copy for a target-change history item can be refined during translation review without changing behavior or task scope.
