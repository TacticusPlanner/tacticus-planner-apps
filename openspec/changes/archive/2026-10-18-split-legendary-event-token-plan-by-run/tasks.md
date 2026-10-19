# Tasks

## 1. Shared split

- [x] 1.1 Extract `splitPlanByRun(plan, supply)` from `run-forecast.ts` into `features/legendary-event-tokens/lib`; `run-forecast.ts` calls it; existing forecast tests stay green; new tests for the worked example, 40 / 110 tokens and unknown run

## 2. List UI

- [x] 2.1 Token plan list renders run sections with headers, the empty-run line and the Not enough tokens section; grouping restarts per section; plan-wide token numbers; update its tests
- [x] 2.2 Mobile two-line section header

## 3. i18n

- [x] 3.1 `legendaryEvents` keys in en/de/es/fr (section header, no tokens planned, beyond supply)

## 4. Verification

- [x] 4.1 `pnpm --filter web lint`, `typecheck`, `vitest run`
- [ ] 4.2 Desktop and mobile check of the Overview tab through the Aspire stack
