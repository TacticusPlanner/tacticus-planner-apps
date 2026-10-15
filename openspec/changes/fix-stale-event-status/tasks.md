## 1. Shared minute tick

- [x] 1.1 Move `useMinuteNow` to `shared/lib/format-time` (keeping `shared/lib` under the steiger grouping threshold), export it from the `@/shared/lib` public API, and point the Legendary Event hooks at it; add a fake-timer test for the hook; verify the Legendary Event tests still pass and `pnpm lint:fsd` is clean.
- [x] 1.2 Add an optional `nowMs` to `formatRelativeTime` (defaulting to `Date.now()`) with a test.

## 2. Home events calendar

- [x] 2.1 Derive the week window from the ticking instant's local day and pass the tick to `buildEventsCalendarDays`/`buildEventsCalendarLanes`; add fake-timer tests: an ended event loses `isActiveNow` on the tick, the week rolls at local midnight, and the window is stable within a day.

## 3. HSE and Today status

- [x] 3.1 Use the shared tick in `useActiveHomeScreenEvent`; verify its boundary test still passes.
- [x] 3.2 Pass the hook's `nowMs` to the HSE status line and preview banner countdowns; add an HSE page test proving they use it.
- [x] 3.3 Re-read Today's campaign-event window on every minute tick; add a fake-timer test that the countdown is dropped once the window ends.

## 4. Catalog re-check

- [x] 4.1 Re-check the game catalog in the background when the tab becomes visible and the last usable sync is over an hour old, leaving the init gate's status and progress untouched and keeping the cache on failure; add tests for the stale, recent, hidden/repeated, failure and no-initial-sync cases.

## 5. Gates

- [x] 5.1 Run the changed tests, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, prettier on changed files and `git diff --check`; verify all pass.

## Deferred / out-of-session

- [ ] Correct the HSE schedule in `event-occurrences.json` (T00:00Z vs T08:00Z starts around 2026-09-12, the 7-day `hse-against-the-tide`, overlapping HSEs on 2026-10-26) in the companion `tacticus-planner-api` change `fix-stale-event-status`, owned separately.
