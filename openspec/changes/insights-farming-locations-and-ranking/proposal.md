## Why

Feedback on the Plan > Insights farming cards after `add-ce-nodes-first-and-event-insights`:

- Players want to switch between the nodes they have already reached and every node, for campaigns and for campaign events alike. "Best events to farm" always ranked every event node, and "Best campaigns to farm" only reached ones.
- The row summary ("N upgrades · N days") did not explain why a campaign ranked where it did.

## What Changes

- A **Locations: Reached / All** segmented control in the Insights toolbar View slot. It applies to both farming cards.
  - **Reached** (default): nodes reached by campaign progress. Campaign event nodes count when reached by event progress, whether or not the event is running now.
  - **All**: every node of every campaign and campaign event.
  - Estimates, the plan date and bottlenecks still read only the battles the player can raid now.
- Both cards rank by **share of needed items** a campaign can drop at its cheapest node per resource, then by **energy per item**, then by the existing score.
- Each row shows "X% of needs · ⚡N/item". Expanding a row adds "N needed items across M resources · E energy · D days". The info hint explains the ranking.
- With Reached on and no reached event nodes, "Best events to farm" shows an empty line instead of disappearing.

Depends on `add-ce-nodes-first-and-event-insights` (archive it first: this change modifies its `plan-insights-events` requirement).

## Capabilities

### Modified Capabilities

- `plan-insights-events`: the Locations control, and the ranking and row summary of both farming cards.

## Impact

- `entities/player-data-override` (`progressReachedCampaignBattles`, `useEligibleCampaignBattles`), `features/goal-planning` (`use-goal-catalog.ts`, insights calc, new `plan-farming-insights.ts`), `entities/campaign-insight` (row layout with a summary), `pages/goals/ui/insights`.
- New strings under `goals.insights` (`locations.*`, `farmingSpotShare`, `perItem`, `farmingSpotDetail_*`, `eventsNoneReached`) in en/de/es/fr; `farmingSpot_*` removed. No API change.
