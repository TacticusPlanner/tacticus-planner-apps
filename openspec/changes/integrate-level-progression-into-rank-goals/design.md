## Context

The app currently auto-suggests Level alongside Rank, merges a Level row only when it has exactly one dependent, and allocates books primarily to separate Level goals. `rank-additional-target.ts` already derives a Rank target's required level. The paired API change removes automatic Rank-only Level synthesis while preserving stored legacy pairs.

## Goals / Non-Goals

**Goals:** Make Rank the visible/canonical owner of routine level progress and avoid duplicate XP need.

**Non-Goals:** Remove explicit Level goals, alter the XP curve, or hide genuine eligibility blockers.

## Decisions

1. `features/goal-farming` owns a canonical per-unit progression demand/allocation result keyed by ordered target intervals; Rank and Level views consume it through public APIs. Derive aggregate XP and potential progress from those intervals, never independent page formulas. Alternative: hide the Level row but keep its full duplicate demand. Rejected because estimates and Dailies would still be wrong.
2. `features/goal-creation` uses `requiredLevelForRankTarget` for Rank preview and drops Rank-only Level auto-suggestion. Ability retains its own Level prerequisite rule. API receives the existing Rank target/edges; no new client-only target field.
3. Legacy Level with exactly one Rank dependent is folded into Rank row and effective need, without deleting data. If Ability also depends on it, it remains visible and receives first allocation of the shared level interval; Rank cannot spend those books twice. Standalone Level stays independent.
4. Goals desktop row and mobile card both show level/XP under the Rank milestone, using layout-appropriate disclosure. The Goals tutorial targets differ between table and card; update both. Dailies uses the same canonical demand, not a page-local copy.

## Risks / Trade-offs

- [Existing Rank-only Level could have been intentional] → Keep its stored id/detail and verify projections are reversible.
- [XP-book ownership across overlapping goals is unclear] → Allocate once by effective priority; this is the same ownership rule later reused by multi-Rank milestones.
- [Global priority is a later change] → Use current effective project order until `establish-global-goal-priority` supplies account order, without embedding project ids in the interval model.

## Migration Plan

Apply API companion first, then switch creation and shared goal-farming projection together. No client storage migration. Compare current and legacy fixtures across Goals, Insights, and Dailies; rollback the client as one unit if attribution differs.

## Open Questions

- Which current translated phrase best distinguishes raw remaining XP from book-covered Potential XP? Choose copy during implementation; it does not change the numerical rule.
