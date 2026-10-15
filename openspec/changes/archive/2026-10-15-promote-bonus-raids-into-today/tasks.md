## 1. Selection logic

- [x] 1.1 Add `selectTodayRaids({ todayEntries, bonusEntries, attemptsLeftByBattle, dailyEnergy, realEnergyUsedToday })` in `features/daily-raids/model/select-today-raids.ts` and export it from the slice's public API. Verify with unit tests: below the limit, one short of it, at it, above it, no synced spend, a zero limit, and exhausted bonus nodes dropped.

## 2. Surfaces

- [x] 2.1 Use the selection in `pages/dailies/ui/today-page.tsx`. Past the limit, hide the Today's-plan lane and show Bonus Raids as the only list, with a limit-reached caption and "Show more" (or a caption saying no bonus raids are left). Verify with component tests in `dailies-pages.test.tsx`.
- [x] 2.2 Use the selection in `pages/home/ui/raids/raids-widget.tsx`. Past the limit, show the Bonus Raids locations with a limit-reached caption (or the caption with the empty message). Verify with component tests in `raids-widget.test.tsx`.
- [x] 2.3 Add `dailies:bonus.limitReached`, `dailies:bonus.limitReachedEmpty`, and `common:home.raids.limitReached` with real en/de/es/fr translations.

## 3. Verification

- [x] 3.1 Run the changed tests, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and Prettier on changed files. Verify all pass.

## Deferred / out-of-session

- [ ] 4.1 Manual browser verification of Today and the Home widget, on desktop (≥768px) and mobile (<768px). Needs a signed-in account whose synced attempts have spent at least the daily energy limit, with bonus raids remaining. This needs the Aspire stack and a signed-in account, and neither was available in this session. The maintainer will file a tracking issue.
