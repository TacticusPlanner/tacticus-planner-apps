## Context

See proposal.md - Why. `tokenCountdown` already returns `{ kind: "pending", targetMs }` with an exact millisecond target; only the display formatting and tick cadence change here.

## Goals / Non-Goals

**Goals:**

- Show the "pending" countdown as an exact, ticking `h:mm:ss` value.
- Keep the display updating closely enough to real time that it reads as a live timer (sub-second drift is fine; multi-second staleness is not).

**Non-Goals:**

- No settings/toggle to switch between exact and rounded display — see proposal.md's note on why "preserve existing workflow" doesn't require one.
- No change to how long a token regen takes or how it's computed.

## Decisions

**Format: unbounded, unpadded hours + zero-padded `mm:ss`, no days component.** A regen can be many hours away (guild raid/onslaught tokens in particular), so the format must handle values well past 24 hours. Wrapping to a days+hours display (`1d 03:15:00`) was considered and rejected: it adds a second unit boundary and a pluralization/i18n concern for one extra digit's worth of readability, when a plain `27:15:03` is unambiguous and matches how most game countdown timers already render multi-hour durations. Hours are left unpadded (`5:00:00`, not `05:00:00`) since there's no fixed-width row of values to align against.

**Formatter lives page-local, not in `shared/lib`.** `format-relative-time.ts` is shared because multiple pages already use it. This new formatter has exactly one consumer (`TokenRow`) today, mirroring `token-countdown.ts`'s own documented choice not to share `resourceCountdown`-style logic with Guild Raid's page-local equivalent until a second consumer actually exists.

**Tick interval: 1000ms, not something coarser.** A `h:mm:ss` display that only updates every 30 seconds would visibly jump by up to 30 in the seconds column, undermining the point of showing seconds at all. 1-second `setInterval` on one small home-page widget (at most 5 rows) is negligible re-render cost; no debouncing or `requestAnimationFrame` scheduling is needed for this granularity.

## Risks / Trade-offs

- [Risk] A 1-second interval keeps a timer running on the Home page for as long as it's mounted, slightly more background work than the previous 30-second tick. → Mitigation: the interval is already cleaned up on unmount (existing `useEffect` cleanup); five `tabular-nums` text updates per second is well within what React/the DOM handle without jank, so no further mitigation is needed.
- [Risk] `Date.now()`-driven countdowns can drift a second or two from wall-clock time if the tab is backgrounded and throttled by the browser. → Mitigation: each tick recomputes from `targetMs - Date.now()` rather than decrementing a counter, so the display self-corrects to the true remaining time on the next tick rather than accumulating drift.
