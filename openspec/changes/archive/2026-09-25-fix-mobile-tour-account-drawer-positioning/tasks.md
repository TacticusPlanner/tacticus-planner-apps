## 1. Readiness wait

- [x] 1.1 In `general.tutorial.tsx`, add a `waitForElementSettled(selector: string, { timeoutMs }: { timeoutMs: number }): Promise<void>` helper per design.md's "Decisions": polls via `requestAnimationFrame`, comparing `document.querySelector(selector)?.getBoundingClientRect()` across consecutive frames, resolving once two consecutive frames match (element present, rect unchanged, no pending/running target animations) or once `timeoutMs` elapses, whichever first. Verify by reading the added helper.
- [x] 1.2 Replace `openMenu`'s `setTimeout(resolve, MOBILE_MENU_OPEN_DELAY_MS)` with `setMobileMenuForceOpen(true)` followed by `await waitForElementSettled(ACCOUNT_MENU_TARGET_SELECTOR, { timeoutMs: 1000 })`, reusing the step's own existing `target` string (or a shared constant extracted from it) as the selector rather than duplicating it. Remove the now-unused `MOBILE_MENU_OPEN_DELAY_MS` constant if nothing else references it. Verify with `pnpm typecheck`.

## 2. Tests

- [x] 2.1 In `general.tutorial.test.tsx`, update the existing "opens the account surface before its step and closes it afterwards" test: since `renderHook` alone doesn't mount `AuthControl`/`MobileHeader`, the target selector won't exist in jsdom by default — insert a matching element into `document.body` with a controllable `getBoundingClientRect` (stub returning the same rect across calls) before calling `before()`, advance fake timers/rAF frames, then assert the promise resolves and `setMobileMenuForceOpen` was called with `true`. Verify with `pnpm --filter web test:run general.tutorial`.
- [x] 2.2 Add a test asserting the rect-stabilization path: insert the target element with a `getBoundingClientRect` stub that returns a different rect on the first call and a stable one afterward (simulating an in-progress animation), and assert `before()` doesn't resolve until the rect has stabilized across two consecutive frames. Also cover matching rects during a pending/running animation and require stabilization after it finishes. Verify with the same test run.
- [x] 2.3 Add a test asserting the safety-timeout fallback: with no matching element ever inserted into the DOM, assert `before()` still resolves (does not hang) once the timeout elapses, including when a target animation runs continuously. Verify with the same test run.
- [x] 2.4 Confirm the existing "is a short tour" and "introduces the header before forcing the account menu open" tests (which only inspect step `target` values, not `before`/`after` timing) still pass unchanged. Verify with the same test run.

## 3. Gates

- [ ] 3.1 Manually verify in the browser (Aspire AppHost stack) at a normal and short viewport below 768px, signed in and signed out: start the mobile tour and confirm the account-menu spotlight, callout, and navigation controls are positioned within the visible viewport after the drawer/popover settles; if clipping remains, correct callout placement or scroll containment and repeat the check.
- [x] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.

## Verification record (2026-09-24)

- Focused regression tests: 11 passed via `pnpm -C apps/web test:run general.tutorial`. The planned filtered command also selected the workspace root with the installed pnpm, so the explicit package directory was used.
- `pnpm test:run` passed (264 web files, 2,094 web tests; all six Turbo tasks successful).
- `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check` passed. Typecheck was rerun after concurrent changes supplied previously missing goals-tour translation keys.
- Strict OpenSpec validation passed.
- Task 3.1 remains blocked: Aspire web and API are healthy, but controlling the existing Chrome localhost tab repeatedly timed out. No signed-in or guest mobile layout pass is claimed. Awaiting restored browser control and user-confirmed normal/short mobile viewport sizes.

## Mobile verification follow-up (2026-09-25)

- Browser access restored; used the existing signed-in Chrome session with a 375 × 667 viewport and healthy Aspire web/API resources. Opened Account menu → Take a tour → Next → Next using keyboard activation (mouse input timed out).
- Reproduced clipping after the account drawer settled: the callout title moved above the viewport. Added step-local cross-axis shifting, disabled page scrolling for the fixed target, and bounded tooltip height with internal scrolling. Retest showed the complete title, content, Skip, Back, and Next within the viewport (callout bounds approximately x=16, y=16, width=345, height=143).
- Spotlight alignment still fails: settled drawer bounds were y=133.45 through 667.2, while the spotlight cutout remained y=450 through 1000. Two matching frames can precede the end of the opening animation. The user approved adding an active-animation check. After implementation, retesting showed the spotlight cutout at y=127 through 677 around the settled drawer at y=133.45 through 667.2 (including padding). Callout contents remained visible; Next closed the drawer and Back reopened it. Task 3.1 remains incomplete pending the other viewport/auth cases.
- Guest and shorter-height checks remain pending. No auth, preferences, or player data were changed for verification.

- Approved active-animation guard implemented and covered by tests for temporarily matching rects during an animation and a never-ending animation. All 13 focused tests and typecheck passed.
- After the final code change, full tests passed (264 web test files, 2,106 web tests), as did typecheck, lint, FSD checks, whitespace checks, and strict OpenSpec validation.

## Short-viewport signed-in verification (2026-09-25)

- Signed-in Chrome session, Aspire web/API healthy, viewport 658 × 454 (`max-width: 767px` matched), real pointer clicks. Account menu → Take a tour → Next → Next reached the account step.
- Drawer settled at y=91 through 454; callout y=16 through 159 and Skip/Back/Next at y=114 through 146, all inside the 454px viewport. Body `pointer-events` was `none` while the callout was `auto`; one pointer click on Next advanced a single step (3 → 4) and closed the drawer; Done ended the tour and restored body `pointer-events: auto`.
- Not verified: the signed-out guest settings popover. Task 3.1 is left unchecked and the change was archived at the user's request with that case outstanding.
- Unrelated: the Home page tour's "Your Projects" callout is clipped at this height (bottom y=502 in a 454px viewport, buttons below the fold). Page-tour step, outside this change's scope.
