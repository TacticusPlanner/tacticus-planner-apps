## 1. Column label

- [x] 1.1 Change `goals.columns.estimate` in `apps/web/public/locales/en/common.json` from "Est." to "Done By", verified by `goal-row-estimate`'s parent header rendering "Done By" in a `goals-list.tsx` test — and confirmed live in the running app (see 4.1)
- [x] 1.2 Update `goals.columns.estimate` in `apps/web/public/locales/{de,es,fr}/common.json` with real translations: de "Fertig am", es "Fecha fin", fr "Terminé le" (no existing V1/repo precedent to reuse — V1's own "Done By" column is hardcoded English, not localized)

## 2. Done By cell content

- [x] 2.1 Added a memoized `Intl.DateTimeFormat(i18n.resolvedLanguage, { month: "short", day: "numeric" })` in `EstimateCell` (`goals-list.tsx`), following the `events-calendar-desktop.tsx` pattern, and format `estimate.date` by parsing its `YYYY-MM-DD` components via `Date.UTC(...)`, verified by the live check (52-day-out date "Nov 8" rendered correctly against the real account's data) and existing/new unit tests
- [x] 2.2 Repurposed `goals.estimate.days` (its only consumer, confirmed by grep) from "{{days}}d" to "in {{days}} days"; `EstimateCell`'s successful-estimate branch now renders the calendar icon + formatted date on one line and the caption beneath it — verified by a new `goals-list.tsx` test asserting both lines render, and live in the browser
- [x] 2.3 Updated `goals.estimate.days` in `apps/web/public/locales/{de,es,fr}/common.json`: de "in {{days}} Tagen", es "en {{days}} días", fr "dans {{days}} jours"
- [x] 2.4 Confirmed the Blocked and no-estimate branches of `EstimateCell` are unchanged — both branches' code is untouched by this change, and their existing tests pass unmodified

## 3. Regression coverage

- [x] 3.1 Added a `goals-list.tsx` test (`useIsMobileMock` toggle, following the `project-select.test.tsx` precedent) asserting the rendered cell's `innerHTML` is byte-identical between `GoalsTable` (desktop) and `GoalsMobileCards` (mobile) for the same estimate — passes
- [x] 3.2 Confirmed `plan-insights-calc.ts` and other `EstimateOutcome` consumers unaffected: `pnpm test:run` for `apps/web/src/fsd/pages/goals` — 37 files / 256 tests pass. **One unplanned fix needed**: `EstimateCell` now reads `i18n.resolvedLanguage`, which broke `project-detail-page.test.tsx`'s narrower `react-i18next` mock (only provided `t`, not `i18n`) — added `i18n: { resolvedLanguage: "en" }` to that mock, matching the same fix already needed in `goals-list.test.tsx` and the existing `events-calendar` test precedent. Not a scope change to this component; the test mock was simply incomplete for a dependency `EstimateCell` now has.

## 4. Manual verification

- [x] 4.1 **Desktop confirmed live**: with the local Aspire stack (already running) and the real signed-in account, navigated to Goals → Projects → "My Goals" — column header reads "Done By", and cells show the calendar icon + short date ("Nov 8", "Sep 20", "Sep 18", "Oct 23") with "in N days" beneath, exactly as designed, against real computed estimates. **Mobile viewport could not be captured**: `resize_window` to 390×844 reported success but the captured screenshot stayed at the original 1568×778 size across two attempts — a tooling limitation in this session, not a reason to believe the mobile render is wrong. Confidence instead comes from 3.1's test, which renders the actual `GoalsMobileCards` code path (not a CSS-only view swap) and asserts its output is byte-identical to the desktop cell already confirmed live.
- [x] 4.2 Confirmed live: goals with a "Blocked" _status_ badge (a different, pre-existing concept from the estimate's own Blocked state — see `BlockedIndicator`) still showed a normal Done By date, i.e. this change didn't conflate the two. The estimate-level Blocked chip and the no-estimate "—" placeholder weren't triggered by this account's current data, so those two specific states rest on their unmodified, passing existing tests rather than a live screenshot.

## 5. Gates

- [x] 5.1 `pnpm test:run` — clean run: 215 files / 1515 tests pass. (A later re-run flaked once on `dailies-layout.test.tsx`'s redirect test — the same known environmental timeout seen throughout this session under heavy parallel load; unrelated file, passes reliably in isolation.)
- [x] 5.2 `pnpm typecheck` — clean
- [x] 5.3 `pnpm lint` — clean
- [x] 5.4 `pnpm lint:fsd` — no problems found
- [x] 5.5 `git diff --check` — no whitespace errors (only pre-existing LF/CRLF normalization warnings)
