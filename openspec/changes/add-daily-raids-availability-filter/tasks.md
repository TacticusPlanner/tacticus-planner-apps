## 1. Toggle implementation

- [ ] 1.1 In `raids-plan-page.tsx`, add `const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)` alongside the existing `showAllDays`/`compact` state. Verify by reading the updated component.
- [ ] 1.2 Add a toggle Button to the whole-plan summary row (next to `showAllDaysButton` and the density toggle), `data-testid="plan-availability-toggle"`, following the density toggle's icon + `{isMobile ? null : t(...)}` pattern. Verify by reading the updated component at both a sub-768px and an at/above-768px layout.
- [ ] 1.3 In the day-column map, pass `emphasis={showOnlyAvailable && day.day === 1 ? "location" : "material"}` and `attemptsLeftByBattle={day.day === 1 ? raids.attemptsLeftByBattle : undefined}` to `RaidSchedule` (per design.md's "Decisions" — Day 1 only, every other day's call is otherwise unchanged). Verify by reading the updated component.
- [ ] 1.4 Add `dailies.plan.showOnlyAvailable` (label: "Show only available") to `apps/web/public/locales/en/dailies.json`, with matching real translations in `de/dailies.json`, `es/dailies.json`, `fr/dailies.json`. Verify by re-reading each edited file.

## 2. Tests

- [ ] 2.1 In `dailies-pages.test.tsx` (or `raid-schedule.test.tsx` if `RaidsPlanPage`-level tests live elsewhere — check both), add tests asserting: the toggle is off by default and an exhausted Day 1 node is visible; turning it on hides that node from Day 1 only; a Day 2 node with a fully-allocated simulated attempt cap remains visible regardless of the toggle's state; turning the toggle back off restores the hidden Day 1 node. Verify with `pnpm --filter web test:run raids-plan` (or the matching existing test file's run target).
- [ ] 2.2 Confirm existing Raids Plan tests (density toggle, "Show all days", per-day summary stats) still pass unchanged — regression check for the new state addition. Verify with the same test run.

## 3. Verification and gates

- [ ] 3.1 Manually verify in the browser (Aspire AppHost stack, signed-in session, account with at least one exhausted node today): on Raids Plan, confirm the toggle is off by default with the exhausted node visible, turning it on hides only that Day-1 node while Day 2+ columns are unaffected, and the toggle renders correctly at both a sub-768px and an at/above-768px viewport. Confirm Today's page behavior is completely unchanged.
- [ ] 3.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all must pass before this change is considered done.
