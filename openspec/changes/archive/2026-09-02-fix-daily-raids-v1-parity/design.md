## Context

See proposal.md for motivation and the daily-raids-today delta specification for the observable contract. The Dailies calculation maps the shared goal-farming schedule into a page view model; schedule entries currently retain calculation order. V1's per-goal estimate presentation ordered resources by goal priority, descending `daysTotal`, then descending `energyTotal`. The existing Today page already resolves real attempted nodes from live progress, but its display badge treats `attemptsLeft === 0` as a simulated "Max raids" status rather than historical activity.

## Goals / Non-Goals

**Goals:**

- Use one calculation-derived urgency ordering for both Today and Bonus Raids without changing goal priority or scheduling allocation.
- Preserve the raw live-progress attempt count through to the historical attempt-list display.
- Keep the Dailies page responsible for rendering and the goal-farming feature responsible for reusable estimate calculation.

**Non-Goals:**

- Change energy budgets, campaign eligibility, farm-node selection, inventory allocation, or the contents of a player's raid plan.
- Change the "Max raids" state in simulated schedule and Bonus Raids location cards.
- Include event-campaign attempts whose battle identity cannot be resolved safely from the stored live-progress data.

## Decisions

### Derive resource urgency beside the canonical schedule

Expose the resource-level duration and energy estimates alongside the existing daily schedule view model, then order entries within a goal group using those values. This keeps the page from re-running or approximating goal-farming calculations and lets Today and Bonus Raids consume the same canonical ordering metadata. Use resource identity as the final tie-breaker so equal estimates cannot fall back to map insertion order.

**Alternative considered:** sort by today's planned raid count or entry energy spent. Rejected because either measures only the first day and would not preserve V1's total time-investment priority.

**Alternative considered:** reorder the global planner output. Rejected because that could alter allocation iteration and plan semantics instead of only correcting presentation order.

### Separate historical count display from remaining-attempt status

Keep `attemptsUsed` and `attemptsLeft` in the resolved attempt record. The Today's Attempts renderer will always display `attemptsUsed`; it will no longer infer a label from `attemptsLeft`. Simulated schedule cards retain their existing remaining-attempt and daily-cap presentation behavior.

**Alternative considered:** remove `attemptsLeft` from the historical record. Rejected because the same source remains useful to other Dailies derivations, and removing it provides no user benefit.

## Risks / Trade-offs

- **[Risk]** A resource estimate can be absent for an entry introduced by a future schedule type. **Mitigation:** define a deterministic fallback order that leaves eligible known estimates first and does not throw or omit rows.
- **[Risk]** Sorting individual entries instead of resource groups could split one resource's locations. **Mitigation:** group locations by goal and resource before applying urgency order, while retaining each resource's existing location order.
- **[Risk]** Tests could accidentally assert English labels rather than the order contract. **Mitigation:** use fixed resource ids and test ids or DOM sequence assertions in focused unit/UI tests.

## Migration Plan

No data migration is required. Deploy this as a client-only calculation and presentation update. A normal code revert restores the previous ordering and attempt badge behavior without affecting stored player data or synced progress.
