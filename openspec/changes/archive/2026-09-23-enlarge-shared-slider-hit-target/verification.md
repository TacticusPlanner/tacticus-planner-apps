## Manual verification

Date: 2026-09-23
Environment: local Aspire stack, authenticated Chrome session

### Wide viewport (1536 × 735)

- **Planning Settings — passed:** the slider root measured 400 × 44 px while
  the visible track remained 400 × 4 px and the thumb remained 16 × 16 px. A
  tap 14 px above the track changed the tier from 0 to 4, and a drag in the
  enlarged area below the track changed it from 4 to 6. Clicking the adjacent
  minimum label left the value at 6. Canceling and reopening restored the
  original value of 0, so no setting was persisted.
- **Progress campaign-event card — passed:** all 12 rendered slider roots
  measured 44 px high. An above-track tap changed the selected Extremis value
  from 23 to 10. Its neighboring decrement button then changed only that value
  from 10 to 9. Navigating away discarded the unsaved draft.
- **Character lookup — passed:** the two-thumb slider root measured 320 × 44 px
  while its track remained 4 px high and both thumbs remained 16 × 16 px. An
  above-track tap changed the range from 12/13 to 7/8, and a below-track drag
  changed it from 7/8 to 9/10. Clicking the adjacent Rank range label left the
  range unchanged. Reloading discarded the unapplied draft.

### Narrow viewport (375 × 667)

- **Planning Settings — geometry and keyboard passed:** the slider root measured
  295.2 × 44 px while the visible track remained 295.2 × 4 px and the thumb
  remained 16 × 16 px. Arrow-key input changed the accessible tier from 0 to
  1, and canceling discarded the draft. Chrome device emulation did not
  reliably deliver automated pointer events to this modal, so its narrow
  tap/drag check remains outstanding; the same control passed tap and drag at
  the wide viewport.
- **Progress campaign-event card — tap and layout passed:** the initial mobile
  check exposed pre-existing min-content overflow that clipped the slider and
  its neighboring controls. Adding `min-w-0` to each event section and allowing
  the control row to wrap reduced the first slider from 362.7 px to 269.6 px
  within the card. Its root remained 44 px high, its visible track remained
  4 px high, and an automated pointer tap in the enlarged area changed the
  value from 30 to 14. The adjacent controls are now fully visible. Chrome
  device emulation did not reliably deliver drag gestures, so the narrow drag
  check remains outstanding; the wide drag check passed.
- **Character lookup — passed / not applicable:** below the mobile breakpoint,
  the rank range intentionally renders two compact select controls instead of
  the shared slider. Both controls remained visible and usable, so there is no
  slider hit target to regress at this viewport.

### Still required

- **Disabled live state:** blocked because the current campaign-event catalog
  gives every rendered track regular battles, while Planning Settings and
  character lookup do not expose a disabled slider state. The focused component
  test verifies that disabled pointer and keyboard input do not change the
  value. A live disabled check would require an explicitly approved reversible
  local fixture or temporary development-only hook.

## Automated verification

- `pnpm --filter @workspace/ui exec vitest run src/components/slider.test.tsx`
  — 4 tests passed.
- `pnpm test:run` — 1,939 tests passed across 245 web test files, plus all
  package suites. An initial unrelated `section-tabs` keyboard test failed once;
  its isolated rerun passed 25/25, and the clean full rerun passed 1,939/1,939.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm lint:fsd` — passed.
- `git diff --check` — passed.
