## Context

Goal detail currently shows progress/estimate, blockers, and a short farming strategy/location summary, but not resource rows or node guidance. Project detail has per-goal estimates. `features/goal-farming` and Goals/Dailies model code already derive needs, locations, eligibility, estimates, and priority-aware XP-book allocation.

## Goals / Non-Goals

**Goals:** Present one canonical planning result in goal/project views with explicit actionability and blocker labels.

**Non-Goals:** Build a second farming algorithm, change allocation semantics, or turn a project into a separate daily plan (Dailies plans across all goals; a project is only a filter).

## Decisions

- Put reusable guidance derivation/formatting in the goal-farming feature or a legal lower FSD slice; goal detail and project detail consume its public API, never each other's page code. Start with existing client data and verify any API gap before declaring apps-only implementation.
- Derive resource rows and project aggregate from one canonical per-goal result, preserving the same priority, inventory, recipe, eligibility, and selected-source inputs as Dailies. Mark “preview” whenever it is not the schedule Dailies shows for the same filter; distinguish locked from real attempt exhaustion.
- Keep raw XP per `goal-progress-display`; add an explicitly labeled _additional_ book-equivalent count, in the user's selected XP-book rarity, based on the owned-book remainder after the shared global-order allocation (`allocateLevelXp` over the whole plan, so overlapping Rank milestones and Ability goals of one unit never double-count books or levels). The count applies to the required level of a Rank or Ability goal; there is no Level goal. Convert with the existing rarity XP table (`xpBookValueByRarity`), not a second table. Owned-book netting stays in raw XP across all rarities; only the final conversion uses the setting. Do not present that equivalent as a guaranteed source or deduct owned books twice.
- Store the rarity as a new field in the existing user-settings entity (nested JSON, so no column migration expected), edited in the Planning settings dialog. Default Legendary; a missing or unsupported stored value falls back to Legendary. No new endpoint.
- Render concise summary in goal detail and a project summary/link rather than a second full Raids page. Keep desktop/mobile access visible without hover-only disclosure.

## Risks / Trade-offs

- Existing API data may lack a source/reason needed for reliable guidance → confirm first; if missing, author a same-named API companion with contract/spec before code and apply API first.
- The rarity setting requires an API companion (DTO, validation, OpenAPI, default for existing rows); apply API first.
- `expose-planning-settings-from-dailies` moves and rewords the same dialog; land it first or reconcile dialog copy and tests.
- Depends on `integrate-level-progression-into-rank-goals` (Level goals removed; the required level lives on the Rank/Ability goal) and on `establish-global-goal-priority` / `consolidate-goals-into-plan-and-remove-active-project` (one account-wide order; a project is only a filter). Both are settled in the current PR branches; apply this change after they merge, and align requirement wording with their archived specs.

**Decided (confirmed by the user): `computeLevelGoalCost` follows the rarity setting.** `features/goal-farming/lib/level-xp-cost.ts` today hard-codes Legendary (`books = ceil(remaining / xpBookValueByRarity.Legendary)`, gold = `books * 500`; the per-book apply gold does not depend on rarity, per V1's `legendaryTomeApplyCost`). It gains a `rarity` input (default Legendary, unsupported values fall back to Legendary) so the creation card and the goal/project guidance can never disagree; a lower rarity therefore raises both the book count and the gold. The XP values per rarity are the ones already in `xpBookValueByRarity`. The API is unaffected: it only stores the setting.

## Open Questions

- Do existing catalog/API projections expose every locked/unavailable reason used by this guidance? Inspect a real mixed-source goal before fixing repository scope.
- Resolved by `establish-global-goal-priority`: a project's preview allocates shared inventory by the global goal order (the same run Dailies uses); a project filter only narrows which goals are shown, it never re-allocates.
