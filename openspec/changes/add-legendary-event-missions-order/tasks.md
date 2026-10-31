# Tasks

## 1. Missions

- [x] 1.1 Count enemies by faction and trait, enemies and waves in `battleEnemies`; add `tokenMissionAmount`; verify `missions.test.ts`.
- [x] 1.2 Read the next run's open missions when no run is in progress (Next token card and Missions order).

## 2. Missions order

- [x] 2.1 Add `missionOrder` (`lib/mission-order.ts`): per run section, merge the lane queues greedily by mission value per token, keep slots and recompute running points; verify `mission-order.test.ts`.
- [x] 2.2 Add `missionOrder` with its forecast markers to the ready token plan view when a missions source and a token supply exist.

## 3. UI

- [x] 3.1 Points / Missions switch, run missions summary and per-token mission lines in the Token plan list; verify `token-plan-list.test.tsx`.
- [x] 3.2 Pass the missions source to the plan wizard's draft token view.
- [x] 3.3 Add `tokenPlan.plan.order.*` and `tokenPlan.plan.missions.*` in en/de/es/fr.

## 4. Manual

- [ ] 4.1 On an upcoming event, open the wizard's Runs and tokens step, switch to Missions and check the run summaries and token lines.
