## 1. Reproduce and decide

- [ ] 1.1 On the Aspire stack below 768px, reproduce both steps signed in and guest at ordinary and short heights, scrolling forward/back and recording target/spotlight rectangles, scroll container, visual viewport, and selector; verify whether the current build actually misaligns.
- [x] 1.2 Compare the reproduced cause with `fix-mobile-tour-account-drawer-positioning` and record whether this change remains separate or is folded into that proposal; verify the decision references observed geometry.

## 2. Correct and verify

- [x] 2.1 If reproduced independently, correct target refresh or callout placement in the shared shell tour without changing normal sticky/fixed navigation; verify both steps align in the same viewport cases. If not reproduced, record the evidence and do not add speculative code.
- [ ] 2.2 Add focused tests for selector choice and any confirmed refresh behavior, plus manual checks of callout controls and safe areas; verify tests and recorded mobile checks pass.
- [x] 2.3 If code changes, run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; verify all pass.

## Closure record (2026-09-25): not reproduced

Closed as not reproducible at the user's request. No code changed, so 2.3 (gates) is vacuously satisfied and 2.2 (new tests) was not needed and is left unchecked.

Evidence (signed-in Chrome session, Aspire web/API healthy, viewport 568 x 454, `max-width: 767px` matched, real pointer clicks). Cutout = spotlight SVG path bounds, viewport px, includes 8px padding:

- Header step at scrollY 0: header y 0-81, cutout y -8..89, Skip/Back/Next at y 214-246 (inside viewport).
- Header step after scrolling to scrollY 1000: header still y 0-81 (sticky); cutout at document y 992-1089 = viewport -8..89; controls inside viewport.
- Nav step at scrollY 1000: nav (fixed) y 370-454, cutout y 361-461, callout y 212-336, buttons y 291-323 above the bar.
- Back from nav to header: header re-measured at y 0-81, cutout viewport -8..89 (no stale rectangle); Joyride scrolled the page 1000 -> 972 to reveal the target.
- Screenshots taken within ~1s of a step change or scroll showed the overlay mid-transition; every measurement after it settled was aligned.

Not verified (1.1 left unchecked): the signed-out guest flow, and an ordinary (tall) mobile height. Neither was tested.

Decision for 1.2: no shared cause with `fix-mobile-tour-account-drawer-positioning` was found (that fix addressed drawer opening animation and callout overflow; these two targets are static sticky/fixed elements whose geometry was stable and matched their cutouts), so this change stays separate and closes without code.
