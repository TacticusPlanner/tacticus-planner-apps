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

5. One shared node-eligibility source for every estimate surface. Goals currently builds its battle set in `pages/goals/model/shared/use-goal-catalog.ts` with `filterUnlockedBattles` (`shared/lib/unlocked-battles.ts`), which keeps every event-campaign battle, while Today and Raids Plan use `availableCampaignBattles` (`features/daily-raids/model/campaign-event-eligibility.ts`): standing nodes must be reached, event nodes must belong to the active event and be reached. Move the Goals catalog to the latter rule, consuming it through the daily-raids feature's public API and the same live-progress, campaign-events-progress, and campaign-progress inputs; do not duplicate the rule. Live evidence: Ragnar's Venerable Battle Mark (`upgHpM004`) has no eligible node in the Plan (blocker, no date) while Goals showed Ragnar Active with a finite date. Alternative: patch `filterUnlockedBattles` alone. Rejected because it lacks the active-event and event-progress inputs and would leave two rules that can drift.
6. Goals presentation maps the canonical result to the existing soft label. "Restricted" versus "Blocked" is presentation only (goal-blocker-reasons): partial (actionable resources non-empty) shows Restricted, nothing obtainable shows Blocked. The indicator lists each blocked material with quantity and reason, using the existing `common:goals.estimate.blocked.*` reason keys, and no date. Alternative: a new third status. Rejected as unnecessary state.

## Risks / Trade-offs

- [The Goals catalog also feeds the goal-creation preview and Insights, so inactive event nodes stop appearing as farmable there] → Intended; cover with tests and re-check the preview against a goal that uses an event-only material.
- [Goals loads campaign-events-progress and the active event id lazily, so estimates can flash a pre-hydration result] → Treat missing event inputs as "no event nodes eligible" consistently with the Plan, and verify no false completion date appears before hydration.

- [Scheduling later stages while an earlier stage is blocked could imply impossible sequence] → Preserve stage ordering for actual progress; surface later actionable work only where the existing progression model permits pre-farming, and never credit a blocked transition as attained.
- [Shared inventory or raid caps could be consumed twice] → Derive detail and totals from one immutable result; test competing goals and sources.
- [A missing API/catalog source may be mistaken for a client-only defect] → Trace a concrete failing resource before implementation; create a paired API proposal if server-owned data is absent.

## Migration Plan

No persisted-data migration. Replace client result mapping and all consumers together, then run old all-actionable/all-blocked regressions and the new mixed-state suite. Roll back the client release as one unit if totals diverge.

## Open Questions

- Which reported Bellator-like material and eligibility snapshot best reproduces `PLAN-014` on the current stack? Capture it as a regression fixture before applying; this does not change the behavior contract.
