## 1. Readiness wait

- [ ] 1.1 In `general.tutorial.tsx`, add a `waitForElementSettled(selector: string, { timeoutMs }: { timeoutMs: number }): Promise<void>` helper per design.md's "Decisions": polls via `requestAnimationFrame`, comparing `document.querySelector(selector)?.getBoundingClientRect()` across consecutive frames, resolving once two consecutive frames match (element present, rect unchanged) or once `timeoutMs` elapses, whichever first. Verify by reading the added helper.
- [ ] 1.2 Replace `openMenu`'s `setTimeout(resolve, MOBILE_MENU_OPEN_DELAY_MS)` with `setMobileMenuForceOpen(true)` followed by `await waitForElementSettled(ACCOUNT_MENU_TARGET_SELECTOR, { timeoutMs: 1000 })`, reusing the step's own existing `target` string (or a shared constant extracted from it) as the selector rather than duplicating it. Remove the now-unused `MOBILE_MENU_OPEN_DELAY_MS` constant if nothing else references it. Verify with `pnpm typecheck`.

## 2. Tests

- [ ] 2.1 In `general.tutorial.test.tsx`, update the existing "opens the account surface before its step and closes it afterwards" test: since `renderHook` alone doesn't mount `AuthControl`/`MobileHeader`, the target selector won't exist in jsdom by default — insert a matching element into `document.body` with a controllable `getBoundingClientRect` (stub returning the same rect across calls) before calling `before()`, advance fake timers/rAF frames, then assert the promise resolves and `setMobileMenuForceOpen` was called with `true`. Verify with `pnpm --filter web test:run general.tutorial`.
- [ ] 2.2 Add a test asserting the rect-stabilization path: insert the target element with a `getBoundingClientRect` stub that returns a different rect on the first call and a stable one afterward (simulating an in-progress animation), and assert `before()` doesn't resolve until the rect has stabilized across two consecutive frames. Verify with the same test run.
- [ ] 2.3 Add a test asserting the safety-timeout fallback: with no matching element ever inserted into the DOM, assert `before()` still resolves (does not hang) once the timeout elapses. Verify with the same test run.
- [ ] 2.4 Confirm the existing "is a short tour" and "introduces the header before forcing the account menu open" tests (which only inspect step `target` values, not `before`/`after` timing) still pass unchanged. Verify with the same test run.

## 3. Gates

- [ ] 3.1 Manually verify in the browser (Aspire AppHost stack) at a normal and short viewport below 768px, signed in and signed out: start the mobile tour and confirm the account-menu spotlight, callout, and navigation controls are positioned within the visible viewport after the drawer/popover settles; if clipping remains, correct callout placement or scroll containment and repeat the check.
- [ ] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
