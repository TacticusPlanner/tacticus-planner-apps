## 1. Reached vs All

- [x] 1.1 `progressReachedCampaignBattles` (nodes reached by progress, events running or not) exposed through `useEligibleCampaignBattles` and `useGoalCatalog`
- [x] 1.2 `computePlanInsights` ranks farming twice (`insightBattles.reached`, `insightBattles.all`) and returns `allLocations`
- [x] 1.3 Locations segmented control in the Insights View slot; events card empty line under Reached

## 2. Clearer ranking

- [x] 2.1 Farming spots report `itemCount` and `coverage`; `buildFarmingInsights` ranks by coverage, then energy per item, then score
- [x] 2.2 Row summary "X% of needs · ⚡N/item", detail line on expand, updated hint; strings in en/de/es/fr
- [x] 2.3 Calc, ranking, component and page tests
