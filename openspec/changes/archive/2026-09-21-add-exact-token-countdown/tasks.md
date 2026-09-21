## 1. Implementation

- [x] 1.1 Create `apps/web/src/fsd/pages/home/ui/token-availability/format-exact-countdown.ts` exporting `formatExactCountdown(targetMs: number, nowMs: number): string`, returning `h:mm:ss` (hours unbounded/unpadded, minutes/seconds zero-padded to 2 digits), clamped to `0:00:00` when `targetMs <= nowMs` — verify by reading the function against the design's format decision.
- [x] 1.2 In `token-availability.tsx`, change `NOW_TICK_MS` from `30 * 1000` to `1000` — verify by reading the updated constant.
- [x] 1.3 In `TokenRow`'s `countdownText`, replace the `"pending"` case's `formatRelativeTime`/`home.tokens.nextLabel` call with `formatExactCountdown(countdown.targetMs, nowMs)` rendered directly (no i18n wrapper needed — the value is numeric, not prose) — verify by reading the updated case; confirm `formatRelativeTime`'s import is removed if no longer used elsewhere in the file.

## 2. Tests

- [x] 2.1 Create `format-exact-countdown.test.ts` covering: sub-hour duration (e.g. 900s → `0:15:00`), multi-hour duration past 24h (e.g. 98103s → `27:15:03`), exact zero, and a past/negative target clamped to `0:00:00` — verify with `pnpm --filter web test:run format-exact-countdown`.
- [x] 2.2 In `token-availability.test.tsx`, add a case asserting a "pending" token's row shows the exact `h:mm:ss` text (not `home.tokens.nextLabel`) for a known `nextTokenInSeconds`/`observedAtMs`/`nowMs` combination — verify with `pnpm --filter web test:run token-availability`.
- [x] 2.3 Confirm the existing "styles a capped token distinctly" and "does not apply capped styling" tests still pass unchanged, since the capped/full states aren't touched by this change — verify with the same test run.

## 3. Gates

- [x] 3.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
