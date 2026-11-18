## 1. CE nodes first

- [x] 1.1 `pickFarmNodes`/`classifyNeed`/`EstimatePlanParams` take `preferredBattleIds` and narrow the pick to them when any passes
- [x] 1.2 `preferEvent` quick filter; `useDailyRaids` passes the active event's reached nodes and reports `hasActiveEventBattles`
- [x] 1.3 Today offers the chip only with a running event (or while on); HSE and HRE hide it and keep it off
- [x] 1.4 Strings in en/de/es/fr; engine and Today tests

## 2. Best events to farm

- [x] 2.1 `computePlanInsights` ranks events over every event-campaign battle (`eventBattlesById`)
- [x] 2.2 Card description line; strings in en/de/es/fr; calc test
- [x] 2.3 Both farming cards rank every campaign; top 3 with a Show all toggle; component test
