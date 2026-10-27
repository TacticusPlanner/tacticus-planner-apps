# Proposal

## Why

UserJot report "Schedule Page Shows All Onslaught Goals Instead of First": every day card on
Schedule lists an Onslaught run for every goal with Onslaught selected, instead of focusing on the
highest-priority one.

The cause is in the estimate, not the day card. Each goal's Onslaught source supplies the full
Onslaught run cadence (1.5 runs/day) on its own; only shop offers are pooled across goals. So with
N Onslaught goals the plan spends N × 1.5 runs a day. The schedule shows every goal farming
Onslaught at once, and every completion date that leans on Onslaught is too early. V1 handled this
correctly: later goals waited for the tokens earlier goals used.

## What Changes

- Onslaught tokens become one account-wide daily pool, counted in runs. When several goals are
  estimated together (Goals/Insights, Today, Schedule), goals draw runs from it in global priority
  order, each taking at most the runs it still needs. A goal that finishes partway through a day
  leaves its unused runs to the next Onslaught goal. Unused runs do not carry over to the next day.
- An Ascension goal with Onslaught selected that needs Mythic shards now puts that Mythic demand
  into the multi-goal estimate (previously count-only), drawn from the same run pool after its
  regular shards, plus its selected Mythic shop offers.
- A single-goal estimate (goal-creation preview, standalone estimates) still treats the goal as the
  only user of Onslaught.
- The Schedule day card follows automatically: it shows only the goals that actually receive runs
  that day.

## Impact

- `features/goal-farming/lib/estimate.ts` (`applyFlatSuppliers`),
  `features/goal-farming/lib/estimate-plan.ts` and `features/goal-farming/lib/goal-acquisition.ts`;
  the Today/Schedule (`daily-raids-calc.ts`) and Insights (`plan-insights-calc.ts`) callers.
- Completion dates move later for plans with two or more Onslaught goals.
- Frontend only; no API change.
