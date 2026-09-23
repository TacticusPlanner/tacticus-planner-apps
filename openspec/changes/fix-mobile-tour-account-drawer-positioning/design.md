## Context

See `proposal.md` - Why. Relevant existing shape, confirmed by reading the
code:

- `general.tutorial.tsx`'s mobile steps (`useMobileTutorialSteps`) has one
  step with a `before`/`after` hook — the account-menu step, index 2. Its
  `before: openMenu` calls `setMobileMenuForceOpen(true)` and returns a
  Promise that resolves after `MOBILE_MENU_OPEN_DELAY_MS` (a bare
  `setTimeout(resolve, 300)`), then Joyride measures
  `target: '[data-testid="auth-account-drawer"], [data-testid="mobile-guest-settings-content"]'`.
- `setMobileMenuForceOpen` lives in `tour-provider.tsx` and feeds
  `useTourControlledPopoverOpen()`, whose returned `open` boolean is
  `userOpen || mobileMenuForceOpen` — consumed by two different components
  depending on auth state:
  - Signed in: `auth-control.tsx`'s `Drawer`/`DrawerContent` (`vaul`, via
    `packages/ui/src/components/drawer.tsx`), `data-testid="auth-account-drawer"`.
  - Guest: `mobile-header.tsx`'s `Popover`/`PopoverContent` (Radix, via
    `packages/ui/src/components/popover.tsx`), `data-testid="mobile-guest-settings-content"`.
  - Both open/close via CSS animation classes (`data-open:animate-in
data-open:fade-in-0` etc., confirmed in `drawer.tsx`) driven by their
    `data-state`/`data-open`/`data-closed` attributes — there is no
    JS-driven open animation to hook into directly.
- `tour-provider.tsx`'s own comment already documents _why_ force-open
  exists at all (Joyride's simulated click on the trigger races Radix's
  outside-click dismissal) — that mechanism is unrelated to this change and
  stays as-is. This change only replaces the fixed wait _after_ force-open,
  before Joyride measures the result.

## Goals / Non-Goals

**Goals:**

- Replace the fixed 300ms wait with a readiness check that works for both
  target shapes (vaul `Drawer`, Radix `Popover`) without depending on
  library-specific animation internals.
- Keep the fix bounded — never let the tour hang if a target never appears
  or never stops changing.

**Non-Goals:**

- No change to _why_ force-open exists, or to the click-simulation/dismissal
  race it works around (`tour-provider.tsx`'s existing comment covers that;
  out of scope here).
- No change to any other tour step, target, or the tour library itself.
- No change to the drawer/popover components' own animations or styling.

## Decisions

**Wait for the matched target element's `getBoundingClientRect()` to stop
changing across consecutive animation frames, bounded by a safety timeout**,
rather than listening for a CSS `animationend`/`transitionend` event.

Alternative considered: listen for `animationend`/`transitionend` on the
matched element. Rejected as the primary mechanism — it requires the
element to already exist in the DOM before a listener can attach, but
`openMenu` calls `setMobileMenuForceOpen(true)` and the element only mounts
after the resulting re-render; the wait function would need its own
"element has mounted" poll first regardless. It's also less robust across
the two target shapes: `Drawer` and `Popover` don't necessarily fire the
same named animation/transition events, and a reduced-motion user (or a
target whose animation is disabled by CSS) may fire neither event at all,
silently hanging without the same bounded fallback this design requires
anyway. A rect-stabilization poll handles "not yet mounted" and "no
animation to wait for" as the same case (the rect is immediately stable),
needs no per-target-shape knowledge, and still resolves promptly once
layout genuinely stops moving.

Shape: a small `waitForElementSettled(selector, { timeoutMs })` helper in
`general.tutorial.tsx` (or a shared `shared/tour` util if a second step
ever needs the same pattern — YAGNI for now, this is the only caller),
polling via `requestAnimationFrame`: on each frame, query the selector,
read its rect, and compare to the previous frame's; resolve once two
consecutive frames match (or once the safety timeout elapses, whichever
comes first). `before`'s existing return type (`Promise<void>`) is
unchanged, so no caller besides `openMenu` itself needs to change.

**Safety timeout value**: reuse the previous fixed delay's rough order of
magnitude scaled up for headroom, not a new arbitrary number — 1000ms per
attempt is generous relative to any real animation this codebase uses
(currently ~300ms as the old fixed wait already assumed) while still
keeping a stalled tour step short.

## Risks / Trade-offs

- [`requestAnimationFrame` polling adds a small amount of per-frame work
  while waiting] → Mitigation: only runs during this one step's brief
  open-and-settle window (typically well under 300ms in practice), not
  continuously during the tour.
- [A rect-based check can't distinguish "genuinely settled" from "paused
  mid-animation for exactly one frame by coincidence"] → Mitigation:
  require two consecutive matching frames (not one), which real CSS
  animations don't produce spuriously at 60fps; existing behavior (fixed
  300ms) had no such protection at all, so this is strictly more reliable,
  not less.

## Open Questions

- After the readiness fix, does the account-menu callout still clip against
  the visible viewport on short screens or with browser chrome? The
  implementation task must reproduce both auth states and adjust callout
  placement/scroll containment if needed; readiness alone is not proof of
  `TOUR-05` resolution.
