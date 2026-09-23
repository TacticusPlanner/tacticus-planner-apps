## Context

`estimate-plan.ts` and `estimate.ts` currently break out of a stage scan when an unavailable need appears, returning a blocked outcome before scheduling other needs. See the proposal and `partial-goal-planning` spec. The API stores goal targets/configuration; the calculation is client-owned today.

## Goals / Non-Goals

**Goals:** Retain actionable demand and explicit blockers in one plan result, with one allocation path for detailed rows and summary totals.

**Non-Goals:** New acquisition data, a claim that a partly scheduled goal completes, and a scheduler-specific rarity heuristic.

## Decisions

1. `features/goal-farming` owns a canonical per-goal result containing ordered actionable resource rows, blocked resource rows with reason and remaining amount, scheduled raids/suppliers, and nullable completion. Goals and Dailies consume it through that slice's public API; neither page imports the other. Alternative: keep the current binary `Estimated | Blocked` result and add separate UI-only blocker scans. Rejected because independent scans can disagree on inventory and source allocation.
2. Allocate inventory once in priority/stage order, then classify every residual need. A blocker remains in the result while the scheduler advances obtainable peers; completion is withheld until all residual demand resolves. Do not count scheduled work twice when several stages or goals share a material.
3. Preserve the current campaign and flat-supplier rules, including eligibility and selected overrides. A missing campaign node is not a blocker if a supported supplier can cover the need; an unselected or unsupported source is not silently added.
4. Present an explicit partial-plan state in shared goal/estimate UI and the Dailies rows. Mobile and desktop may arrange the same reason text differently, but neither hides the blocker below an unexplained completion figure. Update the Goals and Dailies tutorial steps if the changed presentation is material.

## Risks / Trade-offs

- [Scheduling later stages while an earlier stage is blocked could imply impossible sequence] → Preserve stage ordering for actual progress; surface later actionable work only where the existing progression model permits pre-farming, and never credit a blocked transition as attained.
- [Shared inventory or raid caps could be consumed twice] → Derive detail and totals from one immutable result; test competing goals and sources.
- [A missing API/catalog source may be mistaken for a client-only defect] → Trace a concrete failing resource before implementation; create a paired API proposal if server-owned data is absent.

## Migration Plan

No persisted-data migration. Replace client result mapping and all consumers together, then run old all-actionable/all-blocked regressions and the new mixed-state suite. Roll back the client release as one unit if totals diverge.

## Open Questions

- Which reported Bellator-like material and eligibility snapshot best reproduces `PLAN-014` on the current stack? Capture it as a regression fixture before applying; this does not change the behavior contract.
