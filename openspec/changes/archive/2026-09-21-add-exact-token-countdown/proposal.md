## Why

Tester feedback (`DAILY-11`, `DAILY-12`) points out that Token
Availability's rounded countdown text ("in 2 hours") is less useful than
an exact timer for a player timing their next token — they currently keep
an external timer instead. The precise data already exists:
`token-countdown.ts`'s `tokenCountdown` computes an exact target
timestamp from the synced snapshot; `token-availability.tsx` just formats
it with the rounded `formatRelativeTime` and re-renders on a 30-second
tick. Both issues are satisfied by a formatting swap and a tick-interval
change, not a new timer feature.

## What Changes

- Add an exact-duration formatter (`h:mm:ss`, minutes/seconds
  zero-padded, hours unbounded and unpadded) and use it in
  `TokenRow` in place of `formatRelativeTime` for the "pending" countdown
  state. The "full", "due", and "unavailable" states are unaffected.
- Tighten `TokenAvailability`'s live tick from 30 seconds to 1 second so
  the exact countdown visibly counts down second-by-second rather than
  jumping in 30-second steps.
- No change to `tokenCountdown`'s own computation, to which token types
  render, to the capped/loading/empty states, or to any other Home
  section — this is scoped entirely to how the "pending" countdown is
  displayed and how often it re-renders. No opt-in/toggle is added: every
  viewer of the widget sees the exact countdown, since this is a passive
  display change with no new interaction to learn (satisfies the "preserve
  existing workflow for users who don't use the new capability" acceptance
  criterion — there's no separate workflow to preserve).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-token-availability`: the "Each available token type shows current
  count and regen state" requirement's countdown becomes an exact,
  live-updating `h:mm:ss` value instead of a rounded relative-time phrase.

## Impact

- `apps/web/src/fsd/pages/home/ui/token-availability/token-availability.tsx`
  — `NOW_TICK_MS`, `TokenRow`'s "pending" case.
- New file:
  `apps/web/src/fsd/pages/home/ui/token-availability/format-exact-countdown.ts`
  (+ test) — page-local, not `shared/lib`, since it has one consumer today
  (matches this folder's existing precedent of not sharing
  `resourceCountdown`-style logic prematurely — see `token-countdown.ts`'s
  own comment).
- No change to `token-countdown.ts`, no new i18n keys (the exact string is
  numeric, not translated prose), no API changes, no cross-repo companion
  change.
