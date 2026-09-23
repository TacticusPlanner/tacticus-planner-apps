## Why

The mobile onboarding tour's account-menu step force-opens the account
drawer (signed-in) or settings popover (guest), then waits a fixed 300ms
before Joyride measures the target — a timing guess the code's own comment
already calls fragile. When the open animation hasn't actually settled by
then, Joyride spotlights the wrong position (`TOUR-02`) or a size that clips
the step's content (`TOUR-05`), on the exact same step for both reports.

## What Changes

- Replace `general.tutorial.tsx`'s fixed `MOBILE_MENU_OPEN_DELAY_MS` (300ms)
  wait in the account-menu step's `before` hook with a real "the target has
  appeared and its layout has settled" signal, so Joyride only measures once
  the drawer/popover is actually done animating.
- Apply the same fix uniformly to both targets the step already matches —
  the signed-in account drawer (`auth-account-drawer`) and the guest
  settings popover (`mobile-guest-settings-content`) — since both are driven
  through the same `before: openMenu` hook today.
- Verify the spotlight, callout, and tour controls fit within the visible
  viewport on short mobile screens; correct placement if target readiness
  alone does not resolve the reported clipping (`TOUR-05`).
- No change to which element is targeted or any other tour step.

## Capabilities

### New Capabilities

- `mobile-tour-target-readiness`: defines that a mobile tour step which
  force-opens an animated UI element before targeting it SHALL wait for that
  element to finish opening and settle before Joyride measures/spotlights
  it, rather than an arbitrary fixed delay.

### Modified Capabilities

(none — no existing capability spec covers tour step timing/positioning)

## Impact

- `apps/web/src/fsd/shared/tour/general.tutorial.tsx` — replace the fixed
  300ms `openMenu` wait with a settle-detection wait.
- `apps/web/src/fsd/shared/tour/general.tutorial.test.tsx` — existing
  `openMenu`/`closeMenu` tests need to cover the new wait mechanism.
- No backend/API changes — apps-only, no companion `tacticus-planner-api`
  change.
