# Tasks

All paths are under `apps/web/src/fsd` unless stated. Commands run from the repository root (`pnpm --filter web exec vitest run <file>` for one file).

## 1. Engine

- [x] 1.1 In `features/goal-farming/lib/estimate.ts`, give `spendDay` an optional `attemptsLeftByBattle`: a node's cap is `min(daily cap, attempts left)` and its entry reports that cap as `dailyAttempts`. Verify: existing `estimate.test.ts` and `estimate-plan.test.ts` pass unchanged.
- [x] 1.2 In `features/goal-farming/lib/estimate-plan.ts`, add `EstimatePlanParams.attemptsLeftByBattle` (day 1 only) and `estimateRaidsLeftToday` (unlimited energy at the real attempts left); export it from `index.ts` and `@x/daily-raids.ts`. Verify: new `estimate-plan.test.ts` cases cover the worked example (Snappa 2 raids at B1 capped at 2 left, then Patermine 2 at B2, 40 energy), a node with 0 left, and a node with no synced data (full cap 5).

## 2. Today and Home

- [x] 2.1 In `features/daily-raids/model/daily-raids-calc.ts` take `attemptsLeftByBattle` and return `raidsLeftToday` on the ready view model; pass it from `use-daily-raids.ts`. Verify: `pnpm typecheck` passes.
- [x] 2.2 In `features/daily-raids/model/select-today-raids.ts` list `raidsLeftToday` as Bonus Raids once the limit is reached, keeping the exhausted-node filter; pass it from `pages/dailies/ui/today-page.tsx` and `pages/home/ui/raids/raids-widget.tsx`. Verify: `select-today-raids.test.ts`, `dailies-pages.test.tsx` and `raids-widget.test.tsx` assert the plan's material appears in Bonus Raids after the limit and that below the limit nothing changes.

## 3. Verification

- [x] 3.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`. Verify: all succeed. (In the authoring container `pnpm lint` ran out of heap; ESLint on every changed file passed and CI runs the full lint.)
- [x] 3.2 No copy, tutorial or i18n change: the Bonus Raids title and limit captions are unchanged. Verify: no locale file in the diff.
