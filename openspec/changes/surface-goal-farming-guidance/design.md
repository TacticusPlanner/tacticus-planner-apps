## Context

Goal detail currently shows progress/estimate, blockers, and a short farming strategy/location summary, but not resource rows or node guidance. Project detail has per-goal estimates. `features/goal-farming` and Goals/Dailies model code already derive needs, locations, eligibility, estimates, and priority-aware XP-book allocation.

## Goals / Non-Goals

**Goals:** Present one canonical planning result in goal/project views with explicit actionability and blocker labels.

**Non-Goals:** Build a second farming algorithm, change allocation semantics, or turn an unselected project into the active daily plan.

## Decisions

- Put reusable guidance derivation/formatting in the goal-farming feature or a legal lower FSD slice; goal detail and project detail consume its public API, never each other's page code. Start with existing client data and verify any API gap before declaring apps-only implementation.
- Derive resource rows and project aggregate from one canonical per-goal result, preserving the same priority, inventory, recipe, eligibility, and selected-source inputs as Dailies. Mark “preview” whenever it is not the Dailies-selected schedule; distinguish locked from real attempt exhaustion.
- Keep raw XP per `goal-progress-display`; add an explicitly labeled _additional_ book-equivalent count, in the user's selected XP-book rarity, based on the priority-allocated owned-book remainder. Convert with the existing rarity XP table (`xpBookValueByRarity`), not a second table. Owned-book netting stays in raw XP across all rarities; only the final conversion uses the setting. Do not present that equivalent as a guaranteed source or deduct owned books twice.
- Store the rarity as a new field in the existing user-settings entity (nested JSON, so no column migration expected), edited in the Planning settings dialog. Default Legendary; a missing or unsupported stored value falls back to Legendary. No new endpoint.
- Render concise summary in goal detail and a project summary/link rather than a second full Raids page. Keep desktop/mobile access visible without hover-only disclosure.

## Risks / Trade-offs

- Existing API data may lack a source/reason needed for reliable guidance → confirm first; if missing, author a same-named API companion with contract/spec before code and apply API first.
- The rarity setting requires an API companion (DTO, validation, OpenAPI, default for existing rows); apply API first.
- `expose-planning-settings-from-dailies` moves and rewords the same dialog; land it first or reconcile dialog copy and tests.
- Cluster 1 may change Rank/Level goal ownership, and global priority may replace project-relative allocation → reconcile those dependency specs before implementing this guidance.

## Open Questions

- `computeLevelGoalCost` (create-goal preview) is still Legendary-only. Should it follow the rarity setting so the two displays don't disagree? Provisionally yes, as a small follow-on within this change.
- Do existing catalog/API projections expose every locked/unavailable reason used by this guidance? Inspect a real mixed-source goal before fixing repository scope.
- After global priority lands, should a non-selected project's preview allocate shared inventory by global order or project-filtered order? This proposal provisionally follows the canonical planning order in force at implementation; settle with `establish-global-goal-priority` before apply.
