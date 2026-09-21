## Why

Character Lookup's mobile rank-range Selects pre-filter their own option
lists (`startOptions` caps at `< rankEnd`, `endOptions` caps at `> rankStart`),
so a user can never pick a start rank at or above the current end — the one
case the range's existing auto-advance clamping
(`use-lookup-selection.ts`'s `setDraftRange`) exists to handle. The nearby
progression range Selects already offer the full ladder and lean on their
own setter's clamping, so the rank range's more restrictive options list
reads as an inconsistency, not a deliberate choice (`LIB-02`, `LIB-03`).

## What Changes

- Widen `character-lookup-controls.tsx`'s `startOptions`/`endOptions` for
  the mobile rank-range Selects to offer the full rank ladder (0 through
  the current maximum reachable rank), matching the progression range
  Selects' existing pattern.
- **Revised during implementation (2026-09-21)**: `setDraftRange`
  (`use-lookup-selection.ts`) turned out not to be the already-correct,
  unchanged setter this proposal originally assumed. It only auto-adjusts
  the _end_ when the _start_ changes — there is no symmetric handling for
  an end-select that lands at or below the current start, so widening
  `endOptions` alone would let a user reach an inverted range
  (`rankStart > rankEnd`). Separately, its existing ceiling handling
  deliberately collapses `rankStart === rankEnd` when `start` is raised to
  the last rank, which violates the same `start < end` invariant
  `hasCompleteValidRange` already enforces elsewhere (the URL round-trip)
  — previously unreachable because the old `startOptions` filter never let
  a user pick the ceiling value at all. Both are now fixed: `setDraftRange`
  auto-adjusts symmetrically in both directions and preserves strict
  `start < end` at both ends of the ladder (pulling the _other_ side back
  by one step instead of colliding into equality) — see `design.md` for
  the exact behavior at each boundary.
- No behavior change to the desktop Slider variant's reachable range — it
  already exposes the full `0..maxIndex` range to both thumbs, and Radix's
  `minStepsBetweenThumbs` already prevents it from ever producing an
  inverted or non-strict pair, so it was never able to hit either bug
  above. It does, however, share `setDraftRange`, so its behavior at the
  ceiling/floor is the same fix, not a separate one.
- No change to the at-a-glance unit-profile card or any other Character
  Lookup control (`LIB-01`'s regression concern).

## Capabilities

### New Capabilities

- `character-lookup-range-controls`: how a user manually edits the
  Character Lookup rank range via the mobile Selects and the desktop
  Slider, and how the range stays valid (start < end, both within the
  reachable ladder) while they do — distinct from
  `character-lookup-range-defaults`, which only covers how a range is
  first derived, not how the user edits it afterward.

### Modified Capabilities

None — `character-lookup-range-defaults` governs initial/derived ranges
only and is unaffected; this proposal is entirely about user-driven edits
to an already-established range.

## Impact

- `apps/web/src/fsd/pages/library/ui/character/character-lookup-controls.tsx`
  — `startOptions`/`endOptions`.
- `apps/web/src/fsd/pages/library/ui/character/hooks/use-lookup-selection.ts`
  — `setDraftRange`, revised for symmetric end-direction handling and
  boundary behavior (see `design.md`).
- No change to `unit-profile.tsx` or any i18n keys. No API changes, no
  cross-repo companion change.
