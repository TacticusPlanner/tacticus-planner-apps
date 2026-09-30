## 1. Day cell model

- [x] 1.1 Add `pages/dailies/model/plan-day-cells.ts` (`buildPlanDayCells`) merging a day's entries by `resourceId` with summed `owned/target`, distinct units in priority order, nodes, cell ordering, and the Raided rule (design Decision 1); verify with `plan-day-cells.test.ts` covering the Calgar/Tigurius Purity Seal `1/2` example, priority ordering, a unit with two goals counted once, Day 1 all-exhausted vs partially exhausted vs unknown attempts, future-day satisfied cell, and future day ignoring real attempts
- [x] 1.2 Add a helper deriving filter-bar units and each unit's first/last actionable day across all plan days; verify with unit tests including a unit whose last day is beyond the first three days and a plan with no actionable cells

## 2. Plan UI components

- [x] 2.1 Add `ui/plan/plan-material-cell.tsx` (resource art, `owned/target` badge with success style, 2 portraits + `+N`, focusable with accessible name, dimmed state, no click action) and its tooltip (material, unit names, up to 4 nodes "campaign node × raids", "+N more"); verify with component tests for overflow, badge style, and tooltip content on focus
- [x] 2.2 Add `ui/plan/plan-day-card.tsx` (title, localized calendar date, energy/raid pills, energy bar with 95% threshold and 100% cap, day unit row, fixed height, scrolling grid, "Raided" divider only when non-empty, grid rendered only when mounted); verify with component tests for the 700/738 and 500/738 bars, 30 Sep → 1 Oct dates, unit row excluding raided-only units, and an all-raided Day 1
- [x] 2.3 Add `ui/plan/use-drag-scroll.ts` (mouse-only drag, click suppression past a movement threshold) and `ui/plan/plan-day-strip.tsx` (horizontal strip, lazy grid mounting via `IntersectionObserver` seeded with days 1–3, "Show all days" at the strip end, pending-jump scroll once the target card exists); verify with tests for Show-all placement/visibility, ≤3-day plans without the control, and a jump to an unrevealed day revealing all days and scrolling to it (observer and `scrollIntoView` stubbed)
- [x] 2.4 Add `ui/plan/plan-unit-filter.tsx` (portrait toggle buttons with pressed state and localized names, first/last day jump buttons, single jump when equal, hidden when no units); verify with tests that selecting dims unrelated cells across cards and re-selecting clears

## 3. Page integration and cleanup

- [x] 3.1 Rewrite `raids-plan-page.tsx` to keep the stat tiles, add the filter bar and strip, and remove the density toggle and `compact` state; verify `dailies-pages.test.tsx` Plan cases updated for the strip, material cells, per-day Raided split, filter, and absence of the Collapse/Expand control
- [x] 3.2 Remove now-unused `compact` and `layout` props from `RaidSchedule`/`ResourceCard` and their tests; verify Today's tests in `raid-schedule.test.tsx` and `dailies-pages.test.tsx` still pass unchanged
- [x] 3.3 i18n: remove `plan.collapse`/`plan.expand`; add strings for the tooltip nodes/"+N more", filter bar label, jump buttons ("← Day {{day}}" / "Day {{day}} →"), cell accessible names, and the unit overflow; update `dailies` in `en`, `de`, `es`, `fr` with real translations; verify `dailies-translations.test.ts` passes and no English is left in de/es/fr

## 4. Tutorial

- [x] 4.1 Update `raids-plan.tutorial.tsx` steps (navigation, summary, filter bar `plan-unit-filter`, strip `plan-days`) with the same steps for desktop and mobile, and update `tour.raidsPlan.steps.*` (rewrite "days" to describe material cells and the Raided section, add "filter") in all four locales; verify `dailies-tutorial.test.tsx` covers the new targets at a viewport below 768px and one at or above 768px

## 5. Desktop verification (viewport ≥ 768px, full Aspire stack)

Data states: a project/account with ≥ 2 active goals sharing a material and a plan longer than 3 days; a synced account where at least one Day 1 node has zero attempts left; an account with no active goals.

- [x] 5.1 Strip scrolls by mouse drag and trackpad; dragging over a cell or portrait doesn't activate it; cards are equal height with internal grid scrolling; screenshot recorded
- [ ] 5.2 Merged cell shows both portraits and summed `owned/target`; tooltip on hover and keyboard focus lists units and nodes; Day 1 Raided section shows exhausted cells
- [x] 5.3 Filter: select a unit, cells dim on every card; jump to its last day beyond Day 3 reveals all days and scrolls there; re-select clears
- [x] 5.4 "Show all days" appears at the strip end only when > 3 days; no Collapse/Expand control; tour runs through all steps

## 6. Mobile verification (viewport < 768px, e.g. 375×667, full Aspire stack)

Same data states as section 5.

- [x] 6.1 Strip swipes natively with the next card peeking; card height fits the viewport with the header visible; no horizontal page overflow from the filter bar
- [ ] 6.2 Tapping a cell opens its tooltip and tapping elsewhere closes it; filter jumps scroll the chosen day into view
- [ ] 6.3 Tour runs through all steps with correct targets

## 7. Shared verification and gates

- [ ] 7.1 Account with no active goals shows the existing empty state with no filter bar or strip
- [x] 7.2 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check`; all pass
