## Context

Goal detail currently shows progress/estimate, blockers, and a short farming strategy/location summary, but not resource rows or node guidance. Project detail has per-goal estimates. `features/goal-farming` and Goals/Dailies model code already derive needs, locations, eligibility, estimates, and priority-aware XP-book allocation.

## Goals / Non-Goals

**Goals:** Present one canonical planning result in goal/project views with explicit actionability and blocker labels.

**Non-Goals:** Build a second farming algorithm, change allocation semantics, or turn an unselected project into the active daily plan.

## Decisions

- Put reusable guidance derivation/formatting in the goal-farming feature or a legal lower FSD slice; goal detail and project detail consume its public API, never each other's page code. Start with existing client data and verify any API gap before declaring apps-only implementation.
- Derive resource rows and project aggregate from one canonical per-goal result, preserving the same priority, inventory, recipe, eligibility, and selected-source inputs as Dailies. Mark “preview” whenever it is not the Dailies-selected schedule; distinguish locked from real attempt exhaustion.
- Keep raw XP per `goal-progress-display`; add an explicitly labeled _additional_ Legendary-equivalent count based on the priority-allocated owned-book remainder. Do not present that equivalent as a guaranteed source or deduct owned books twice.
- Render concise summary in goal detail and a project summary/link rather than a second full Raids page. Keep desktop/mobile access visible without hover-only disclosure.

## Risks / Trade-offs

- Existing API data may lack a source/reason needed for reliable guidance → confirm first; if missing, author a same-named API companion with contract/spec before code and apply API first.
- Cluster 1 may change Rank/Level goal ownership, and global priority may replace project-relative allocation → reconcile those dependency specs before implementing this guidance.

## Open Questions

- Do existing catalog/API projections expose every locked/unavailable reason used by this guidance? Inspect a real mixed-source goal before fixing repository scope.
- After global priority lands, should a non-selected project's preview allocate shared inventory by global order or project-filtered order? This proposal provisionally follows the canonical planning order in force at implementation; settle with `establish-global-goal-priority` before apply.
