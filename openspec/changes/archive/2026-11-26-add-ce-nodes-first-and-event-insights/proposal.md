## Why

Players who know which campaign event (CE) they will play want their farming to work around it (UserJot: "Plan Campaign Farming Around Event Upgrades"). The planner cannot yet hold back an upcoming CE's upgrades, because the calendar does not say which campaign a CE will run. Two smaller steps help now:

- While a CE is running, Today always farms each material at the cheapest node, so a player who wants event points has to pick CE nodes by hand.
- Plan > Insights "Best events to farm" only scored the running CE's reached nodes, so it was empty between events and could not help pick the next one.

## What Changes

- New Today quick filter **CE nodes first**, offered while the player has reached nodes of a running campaign event (and while it is on). It farms a material at those nodes whenever one of them drops it, even at a worse energy per item. Materials the event does not drop are farmed as usual. It is hidden and off on the HSE and HRE tabs.
- Plan > Insights "Best events to farm" ranks every event campaign, running or not, reached or not, with a line saying so. Estimates, dates and "Best campaigns to farm" still read only eligible battles.
- "Best campaigns to farm" and "Best events to farm" rank every campaign instead of the top 3, show the top 3 by default and a "Show all (N)" toggle.

## Capabilities

### New Capabilities

- `plan-insights-events`: what the Insights farming cards rank and how many they show.

### Modified Capabilities

- `daily-raids-today`: adds the CE nodes first quick filter.

## Impact

- `entities/goal-farming` (`select-farm-nodes.ts`, `estimate-plan.ts`), `features/daily-raids` (quick filters, `use-daily-raids.ts`, `daily-raids-calc.ts`), `pages/dailies` (Today, HSE, HRE).
- `features/goal-planning/model/insights` (`plan-insights-calc.ts`, `use-plan-insights.ts`), `pages/goals/ui/insights`.
- New strings `dailies.quickFilters.*.preferEvent` and `goals.insights.eventsDescription`, `showAll`, `showLess` in en/de/es/fr. No API change.
