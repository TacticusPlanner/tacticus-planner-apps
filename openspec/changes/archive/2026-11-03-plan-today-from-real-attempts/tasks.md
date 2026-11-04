## 1. Engine

- [x] 1.1 `runPlanSchedule`: day 1 budget is `dailyEnergy - energyUsedToday` (floored at 0) and caps nodes at `attemptsLeftByBattle`; unused-energy count uses each day's budget
- [x] 1.2 Bonus Raids' unlimited run and Raids left today ignore `energyUsedToday`

## 2. Dailies

- [x] 2.1 `calculateDailyRaids` passes attempts left and energy spent into Today, Bonus Raids and the Plan
- [x] 2.2 Tests: a need raided out today moves to day 2; day 1 spends only the energy left; no synced attempts plans day 1 fresh
