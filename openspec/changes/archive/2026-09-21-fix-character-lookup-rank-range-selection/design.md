## Context

See proposal.md - Why and the "Revised during implementation" note. `start < end` (strict) is an existing invariant on this rank range, enforced elsewhere by `use-lookup-selection.ts`'s own `hasCompleteValidRange` (used to decide whether a URL-supplied range is trustworthy — it explicitly requires `rankIndex(rankStart) < rankIndex(rankEnd)`, not `<=`). This design keeps that invariant true after every edit, rather than loosening it to allow equality at the ladder's ends.

## Goals / Non-Goals

**Goals:**

- Both rank-range Select controls, and the desktop Slider, can reach every rank in the ladder as a value for either side.
- After any single-side edit, `rankStart < rankEnd` always holds — never inverted, never equal.
- Ceiling/floor edits resolve predictably: the _other_ side moves to stay valid, rather than the requested edit being silently ignored or producing an invalid range.

**Non-Goals:**

- Allowing `rankStart === rankEnd` as a valid one-rank "range" anywhere. Rejected — it would require also loosening `hasCompleteValidRange`'s `<` check (a shared invariant, not local to this control), and nothing in `LIB-02`/`LIB-03`'s acceptance criteria asks for a single-rank range; the tester's ask was reaching the _existing_ ladder freely, not a new kind of range.
- Changing the desktop Slider's own crossing prevention (`minStepsBetweenThumbs`) — it already guarantees `start < end` at the interaction level; this change only fixes the shared setter it and the mobile Selects both call.

## Decisions

**Auto-advance/retreat by exactly one rank, symmetric in both directions.** `setDraftRange` already auto-advanced "to" to "from + 1" when only the start changed (pre-existing, documented behavior — always collapses to the minimal 1-rank span on a start edit, not just when the old end became invalid). The fix makes the end-changed direction mirror that exactly: auto-retreat "from" to "to − 1". Considered a narrower alternative — only intervene when the new value would otherwise invalidate the range (i.e., leave the untouched side alone if it's still valid) — and rejected it to avoid two different behaviors for the two directions of the same control; symmetry is simpler to reason about and matches what was already shipped for one direction.

**At the ceiling, pull the start back rather than collapse to equality.** Selecting the last rank as "from" leaves no rank above it to advance "to" into. Instead of leaving `to === from` (the prior, buggy behavior), "from" is pulled back to the second-to-last rank and "to" stays at the last rank. This mirrors `character-lookup-range-defaults`' own established pattern for the same situation (`deriveLookupRange`'s "Maximum values retain a meaningful range" requirement: "keep that maximum as the corresponding target and move the corresponding range start back one attainable step") — reusing an already-accepted shape for the boundary case rather than inventing a new one.

**At the floor, push the end forward rather than collapse to equality.** Exact mirror of the ceiling case: selecting the first rank as "to" pushes "from" to the first rank and "to" forward to the second rank, instead of colliding both at rank 0.

**Fixed in `setDraftRange`, not in the Select components.** The invalid states (inversion, ceiling/floor collapse) are a property of the range value itself, not of which control produced the edit — the desktop Slider shares the exact same setter and would hit the same ceiling/floor collapse if `minStepsBetweenThumbs` weren't already preventing it from reaching that state via dragging. Fixing the shared setter, once, is a smaller and more correct change than duplicating boundary logic into two option-list computations that don't need to know about the ladder's boundary behavior at all.

## Risks / Trade-offs

- [Risk] Always collapsing to a 1-rank span on every start (or now end) edit, even when the untouched side was already valid, discards a wider range the user may have deliberately set (e.g. moving "from" up by one step drops a far-away "to" back down to "from + 1" instead of leaving it where it was). → Accepted, not introduced by this change: this is the pre-existing behavior for the start direction (see its original comment), which this fix only extends symmetrically rather than redesigning. If this proves surprising in practice, it's a follow-up UX question, not a defect in this fix.
