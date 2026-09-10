## Context

See the proposal/spec. Exact readiness already produces ordered boss recommendations and ownership gaps. The variant-rules change adds slot-specific replacements, roles, essential flags, and Machine-of-War alternatives. Player data already provides current character/MoW progression and the shared character combat-power estimate.

## Goals / Non-Goals

**Goals:**

- Produce a deterministic owned five-character assignment when authored rules allow one.
- Explain every substitution and four-state readiness result.
- Prefer useful buildable results without claiming to predict raid performance.

**Non-Goals:**

- Expected damage/effectiveness, team synergy, boss-mechanic scoring, or learned performance.
- Multi-token planning, cross-attack character locking, or guild-wide assignments.
- Expanding the generic Dailies recommendation engine with boss-specific rules.

## Decisions

### Add a specialized pure matcher to `entities/guild-raid-meta`

The matcher extends the exact-readiness domain result and consumes one recommendation, owned roster facts, and its explicit rules. It does not import page code or the generic Dailies team engine. This keeps curated slot constraints near the Meta model and exposes one public result type for both layouts.

### Solve slots as a small constrained assignment

Owned ideal heroes are locked first. Missing slots form a maximum-five-node search over their explicit owned candidates, excluding already-used ids. The search prioritizes complete assignments, then fewer substitutions, then candidate combat power, authored order, and unit id. Exhaustive/backtracking search is bounded and easier to verify than greedy selection, which can consume the only candidate for a later essential slot.

### Keep scoring local to allowed-candidate tie-breaking

The existing combat-power estimate is used only after the authored rules establish eligibility and only to choose among valid owned candidates. It does not produce an effectiveness value or compare different Meta recommendations. Result ordering uses readiness, substitution count, then authored order.

### Keep Machine-of-War selection separate

The ideal owned MoW wins. Otherwise the matcher selects among explicitly allowed owned alternatives using current investment, then authored order/id. MoW absence is reported but does not alter hero readiness because the five-character lineup remains playable.

### Extend one canonical result structure

The result retains ideal slots and adds recommended slots with `{idealHeroId, selectedHeroId, roleId, selectionKind}` plus unfilled reasons. Readiness summaries, replacement explanations, and UI counts all derive from those rows. Desktop and mobile never run separate matching logic.

### Responsive UI and tutorial update

Desktop compares ideal and recommended lineups side by side. Mobile leads with the owned recommended lineup and collapses ideal/replacement detail. The existing Guild Raids tutorial and supported locale files gain variant-specific copy and breakpoint-specific selectors.

## Risks / Trade-offs

- [Risk] Combat power is not boss-specific effectiveness → Use it only inside an authored allowed list and never label it as expected performance.
- [Risk] Editorial candidates conflict across slots → Backtracking enforces uniqueness and finds a complete assignment when one exists.
- [Risk] Essential flags make Unavailable stricter than Partial → Surface the blocking essential slot in the explanation and cover edge cases with table-driven tests.
- [Risk] Rules are temporarily absent during catalog rollout → Fall back to exact readiness with a rules-unavailable message, never inferred substitutions.

## Migration Plan

Apply only after exact readiness and both API/app variant-rule changes. Add matcher/result tests first, then integrate ordering and responsive views, translations, and tutorial coverage. Rollback removes variant output and leaves exact readiness intact.
