## Context

`useLookupSelection` owns URL-synced draft and applied Character Lookup state.
Its parser currently gives a missing progression end the same value as the
start, and the synced-player prefill only raises an end value to equality.
`CharacterLookupPage` performs that asynchronous prefill after character
selection; both desktop and mobile render the hook's shared draft. See
`proposal.md` and `specs/character-lookup-range-defaults/spec.md` for the
behavior contract.

## Goals / Non-Goals

**Goals:**

- Derive one valid range shape for catalog defaults and synchronized player
  data, without duplicating rank/progression edge handling in page variants.
- Ensure a later player-data response cannot silently replace an intentional
  URL or in-progress user selection.
- Keep the existing URL parameters, draft/applied model, and Apply behavior.

**Non-Goals:**

- Changing manual range-control rules, calculation formulas, or the set of
  supported rank/progression values.
- Changing the Character Library route, share URL format, player-data schema,
  translations, or Joyride tour steps.

## Decisions

### 1. Centralize generated defaults in the selection hook

`useLookupSelection` will own a small pure range-derivation helper alongside
the existing URL parser and mutation functions. Given a rank/progression
starting pair, it will return rank and progression start/end values together:
advance rank by one when possible; advance progression by one or to the
earliest value supporting the target rank, whichever is later; and use the
preceding value as the start when that dimension is already at its maximum.

Returning the complete pair keeps rank/progression compatibility in one place
and lets hook tests cover the arithmetic without rendering either layout.
Putting this logic in desktop/mobile controls was rejected because both forms
would need identical state and could diverge. Keeping separate rank and
progression helpers was rejected because their target compatibility is a
cross-dimension invariant.

### 2. Treat complete URL state and user interaction as authoritative

The hook will identify whether the route supplied a complete valid range and
track whether the user has altered its generated draft. A player prefill is
eligible only for the selected character while generated defaults remain in
control. The page will continue to request a single selected character record,
but will ask the selection hook to apply its start state rather than directly
constructing start/end values.

This avoids the current race where a delayed Dexie result can overwrite URL
state or a slider/select interaction. Always applying synced data was rejected
because it makes shared links and edits unstable. Persisting a separate
"prefilled" marker in the URL was rejected because it is UI-loading metadata,
not shareable lookup state.

### 3. Keep responsive rendering unchanged

The controls receive one `draft` from the page, and their rank widgets differ
only in presentation (desktop slider versus mobile selects). The new behavior
therefore needs no viewport-specific state, markup, copy, or tutorial change;
tests will validate that both layouts consume the shared values.

## Risks / Trade-offs

- [A source rank/progression pair lies on a rarity boundary] → Derive the
  progression target from the greater of its next step and the minimum step
  required for the selected target rank.
- [A maximum endpoint cannot advance] → Reverse only that dimension's start
  to its preceding attainable value and retain the maximum endpoint.
- [Player data arrives after a route or user action changes selection] → Gate
  the one-time prefill by selected character and selection-authority state.
- [Existing URL compatibility is accidentally changed] → Retain the existing
  parameter names and add route-backed regression tests for explicit ranges.

## Migration Plan

1. Ship the frontend-only selection-state update with its hook and page tests.
2. Verify anonymous defaults, owned-character prefills, maximum endpoints,
   shared URLs, and character switching in the Character Library.
3. Roll back by restoring the preceding frontend bundle if a lookup selection
   regression is detected; no data migration is required.
