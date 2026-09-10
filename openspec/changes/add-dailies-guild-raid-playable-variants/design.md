## Context

See the proposal/spec. Exact readiness already produces ordered boss recommendations and ownership gaps. The variant-rules change adds slot-specific replacements, roles, essential flags, and Machine-of-War alternatives. Player data already provides current character/MoW progression and the shared character combat-power estimate.

## Goals / Non-Goals

**Goals:**

- Produce a deterministic owned five-character assignment when authored rules allow one.
- Explain every substitution and separate four-state variant-availability result without redefining exact readiness.
- Prefer useful buildable results without claiming to predict raid performance.

**Non-Goals:**

- Expected damage/effectiveness, team synergy, boss-mechanic scoring, or learned performance.
- Multi-token planning, cross-attack character locking, or guild-wide assignments.
- Expanding the generic Dailies recommendation engine with boss-specific rules.

## Decisions

### Add a specialized pure matcher to `entities/guild-raid-meta`

The matcher extends the exact-readiness domain result and consumes one recommendation, owned roster facts, and its explicit rules. It does not import page code or the generic Dailies team engine. This keeps curated slot constraints near the Meta model and exposes one public result carrying both unchanged `exactReadiness` and separate `variantAvailability` for both layouts.

### Solve slots as a small constrained assignment

Owned ideal heroes are locked first. Missing slots form a maximum-five-node search over their explicit owned candidates plus an unfilled option, excluding already-used ids. The search compares all assignments lexicographically: maximize filled essential slots, maximize total filled slots, then compare replacement choices in authored slot order by higher combat power, authored candidate order, and unit id. Exhaustive/backtracking search is bounded and avoids greedy allocation, including when completion is impossible and one shared candidate must be reserved for an essential slot.

### Keep scoring local to allowed-candidate tie-breaking

The existing combat-power estimate is used only after the authored rules establish eligibility and fill objectives and only to choose among otherwise equivalent owned assignments. It does not produce an effectiveness value or compare different Meta recommendations. Recommendation ordering remains exactly authored; variant availability is a badge/explanation, not a sort key.

### Keep Machine-of-War selection separate

The ideal owned MoW wins. Otherwise the matcher selects among explicitly allowed owned alternatives using current investment, then authored order/id. MoW absence is reported but does not alter hero readiness because the five-character lineup remains playable.

### Extend one canonical result structure

The result retains ideal slots and the existing exact-readiness value, then adds recommended slots with `{idealHeroId, selectedHeroId, roleId, selectionKind}` plus unfilled reasons and a separately named variant-availability value. Variant summaries, replacement explanations, and UI counts derive from those rows. Desktop and mobile never run separate matching logic.

### Responsive UI and tutorial update

Desktop compares ideal and recommended lineups side by side. Mobile leads with the owned recommended lineup and collapses ideal/replacement detail. The existing Guild Raids tutorial and supported locale files gain variant-specific copy and breakpoint-specific selectors.

## Risks / Trade-offs

- [Risk] Combat power is not boss-specific effectiveness → Use it only inside an authored allowed list and never label it as expected performance.
- [Risk] Editorial candidates conflict across slots → Backtracking enforces uniqueness and finds a complete assignment when one exists.
- [Risk] Essential flags make Unavailable stricter than Partial → Surface the blocking essential slot in the explanation and cover edge cases with table-driven tests.
- [Risk] Variant availability could be mistaken for a replacement exact-readiness definition → Keep both named signals in the result/UI and preserve authored recommendation order.
- [Risk] Rules are temporarily absent during catalog rollout → Fall back to exact readiness with a rules-unavailable message, never inferred substitutions.

## Migration Plan

Apply only after exact readiness and both API/app variant-rule changes. Add matcher/result tests first, then integrate ordering and responsive views, translations, and tutorial coverage. Rollback removes variant output and leaves exact readiness intact.
