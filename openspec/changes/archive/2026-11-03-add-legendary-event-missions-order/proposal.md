## Why

The token plan already knows which open missions the Next token progresses, but it only says so on the Overview's Next token card, never on the plan wizard's Runs and tokens step, and not at all before a run starts. Players want to spend the tokens they will play anyway so they also finish the run's missions, and to see when each mission is done.

## What Changes

- Open missions fall back to the next run when no run is in progress, so mission lines show for upcoming events and between runs.
- A token's **mission amount**: how far a won token moves a mission, counted from the battle's waves (enemies by faction and trait, waves) and the team's members. Alliance, damage-type and ability counts are marked as estimates.
- A **Missions order** for the token plan: the same tokens, reordered inside each run so that run's open missions finish as early as possible. Points are unchanged (a run's points are the sum of its tokens) and each lane keeps its own order.
- The Token plan list gets a Points / Missions switch (remembered per device, shared by the event page and the wizard). In Missions order each run shows its open missions with the token that finishes each, and each token row shows the missions it moves and the ones it finishes.
- The plan wizard's Runs and tokens step reads the missions source, so the switch is there too.

## Capabilities

### Modified Capabilities

- `legendary-event-missions`: open missions without a current run; mission amounts.
- `legendary-event-token-plan`: the Missions order and its switch in the Token plan list.

## Impact

- `apps/web/src/fsd/entities/legendary-event/lib/missions.ts`: enemy and wave counts, `tokenMissionAmount`.
- `apps/web/src/fsd/features/legendary-event-tokens`: `mission-order.ts`, `token-plan-view.ts`, `mission-order-view.tsx`, the Token plan list and rows.
- `apps/web/src/fsd/pages/legendary-events/ui/plan-wizard`: the missions source in the plan source and the draft token view.
- `apps/web/public/locales/*/legendaryEvents.json`: `tokenPlan.plan.order.*`, `tokenPlan.plan.missions.*`.
