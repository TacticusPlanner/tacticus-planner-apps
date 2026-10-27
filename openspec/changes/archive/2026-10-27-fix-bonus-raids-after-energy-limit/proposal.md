# Proposal

## Why

A player reported (UserJot "Bonus Raids Skip Higher-Priority Snappa Farming", 2026-10-27) that once they spent all their energy, Today hid its plan as expected and showed Bonus Raids, but Bonus Raids started at their second goal (Patermine B1) and left out the rest of their top goal's farming (Snappa D1).

The cause is the Bonus Raids rule itself. `estimateBonusRaids` runs today's schedule twice, at the real daily energy and at unlimited energy, and drops every upgrade or shard that got at least one raid in the real run. The real run always assumes the full daily energy, so the top goal takes the whole budget and touches all its materials, and every one of them is dropped from Bonus Raids. Below the limit that is fine, because those materials are on Today's plan. Once the limit is spent, the plan is hidden and Bonus Raids are the only list, so the top goal's remaining farming disappears.

A second gap sits in the same list: Bonus Raids plan each node at its full daily attempt cap, even when the player's synced attempts show some of those attempts are already used. After the limit that overstates what a node can still give, and a node's "N upgrades left" label can then suggest stopping early when the player can only raid it out.

## What Changes

- Once today's real energy spend reaches the daily energy limit, Bonus Raids list every raid still open today: today's schedule with unlimited energy and each node capped at the player's real attempts left. Partly raided materials of higher-priority goals keep their remaining farming, in goal-priority order.
- In that list a node's planned raids never exceed its real attempts left, and the attempts left stand in for the daily cap when deciding the "N upgrades left" label. A node without synced attempts-left data keeps its full daily cap.
- Below the limit nothing changes: Today's plan and Bonus Raids (materials the real schedule leaves unraided) render as before.
- The Home raids widget follows Today, as it already does.
- No copy change, no API change.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- `daily-raids-today`: the Bonus Raids requirement says what Bonus Raids list once the daily energy limit is spent, and that they respect the real attempts left.

## Impact

- `features/goal-farming`: `spendDay` takes optional real attempts left per node; `EstimatePlanParams.attemptsLeftByBattle` applies it to day 1; new `estimateRaidsLeftToday`.
- `features/daily-raids`: `calculateDailyRaids` takes the attempts left and returns `raidsLeftToday`; `selectTodayRaids` lists it as Bonus Raids once the limit is reached.
- `pages/dailies` (Today) and `pages/home` (raids widget) pass the new list.
- No companion `tacticus-planner-api` change.
